const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

class ReconciliationService {
  /**
   * Internal helper to resolve hospital ID
   */
  async _resolveHospitalId(hospitalId) {
    if (!hospitalId) return null;
    let hospital = await prisma.hospitalProfile.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      hospital = await prisma.hospitalProfile.findUnique({
        where: { userId: hospitalId }
      });
    }

    return hospital ? hospital.id : hospitalId;
  }

  /**
   * Reconcile a completed transfer
   */
  async reconcileTransfer(transferId, actualQuantity = null, actingHospitalId = null, notes = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: transferId },
      include: {
        resource: true,
        fromHospital: true,
        toHospital: true,
        reconciliation: true
      }
    });

    if (!transfer) {
      throw new AppError('Resource transfer not found', 404);
    }

    // Eligibility check: Only completed (RECEIVED) transfers can be reconciled
    if (transfer.status !== 'RECEIVED') {
      throw new AppError(
        `Only completed (RECEIVED) transfers can be reconciled (current status: '${transfer.status}')`,
        400
      );
    }

    // Authorization check
    if (actingHospitalId) {
      const resolvedId = await this._resolveHospitalId(actingHospitalId);
      if (transfer.fromHospitalId !== resolvedId && transfer.toHospitalId !== resolvedId) {
        throw new AppError('Unauthorized to reconcile this transfer', 403);
      }
    }

    // Idempotency check: If already reconciled, return existing record
    if (transfer.reconciliation) {
      return prisma.resourceReconciliation.findUnique({
        where: { id: transfer.reconciliation.id },
        include: {
          transfer: true,
          resource: true,
          sourceHospital: { select: { id: true, hospitalName: true, district: true } },
          destinationHospital: { select: { id: true, hospitalName: true, district: true } }
        }
      });
    }

    // Calculate discrepancy
    const expectedQuantity = transfer.quantity;
    let actQty = expectedQuantity;

    if (actualQuantity !== null && actualQuantity !== undefined) {
      const rawAct = Number(actualQuantity);
      if (typeof actualQuantity === 'boolean' || isNaN(rawAct) || !Number.isInteger(rawAct) || rawAct < 0) {
        throw new AppError('Actual quantity must be a non-negative integer', 400);
      }
      actQty = rawAct;
    }

    const discrepancyQuantity = actQty - expectedQuantity;
    let discrepancyType = 'MATCH';
    let status = 'RECONCILED';

    if (discrepancyQuantity < 0) {
      discrepancyType = 'SHORTAGE';
      status = 'DISCREPANCY';
    } else if (discrepancyQuantity > 0) {
      discrepancyType = 'OVERAGE';
      status = 'DISCREPANCY';
    }

    const reconciliation = await prisma.resourceReconciliation.create({
      data: {
        transferId: transfer.id,
        resourceId: transfer.resourceId,
        sourceHospitalId: transfer.fromHospitalId,
        destinationHospitalId: transfer.toHospitalId,
        expectedQuantity,
        actualQuantity: actQty,
        discrepancyQuantity,
        discrepancyType,
        status,
        resolutionNotes: notes ? String(notes).trim() : null
      },
      include: {
        transfer: true,
        resource: true,
        sourceHospital: { select: { id: true, hospitalName: true, district: true } },
        destinationHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    return reconciliation;
  }

  /**
   * Get single reconciliation record by ID with scoping
   */
  async getReconciliationById(reconciliationId, requestingHospitalId = null) {
    const reconciliation = await prisma.resourceReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        transfer: true,
        resource: true,
        sourceHospital: { select: { id: true, hospitalName: true, district: true } },
        destinationHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    if (!reconciliation) {
      throw new AppError('Reconciliation record not found', 404);
    }

    if (requestingHospitalId) {
      const resolvedId = await this._resolveHospitalId(requestingHospitalId);
      if (
        reconciliation.sourceHospitalId !== resolvedId &&
        reconciliation.destinationHospitalId !== resolvedId
      ) {
        throw new AppError('Unauthorized to access this reconciliation record', 403);
      }
    }

    return reconciliation;
  }

  /**
   * List reconciliations for a hospital
   */
  async getHospitalReconciliations(hospitalId, filters = {}) {
    const resolvedId = await this._resolveHospitalId(hospitalId);

    const where = {
      OR: [
        { sourceHospitalId: resolvedId },
        { destinationHospitalId: resolvedId }
      ]
    };

    if (filters.status) {
      where.status = String(filters.status).toUpperCase();
    }

    if (filters.discrepancyType) {
      where.discrepancyType = String(filters.discrepancyType).toUpperCase();
    }

    if (filters.direction === 'sent') {
      delete where.OR;
      where.sourceHospitalId = resolvedId;
    } else if (filters.direction === 'received') {
      delete where.OR;
      where.destinationHospitalId = resolvedId;
    }

    const records = await prisma.resourceReconciliation.findMany({
      where,
      include: {
        transfer: true,
        resource: true,
        sourceHospital: { select: { id: true, hospitalName: true, district: true } },
        destinationHospital: { select: { id: true, hospitalName: true, district: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return records;
  }

  /**
   * Resolve a reconciliation discrepancy
   */
  async resolveDiscrepancy(reconciliationId, resolutionData = {}, actingHospitalId = null) {
    const reconciliation = await prisma.resourceReconciliation.findUnique({
      where: { id: reconciliationId }
    });

    if (!reconciliation) {
      throw new AppError('Reconciliation record not found', 404);
    }

    if (reconciliation.status === 'RESOLVED') {
      throw new AppError('Reconciliation discrepancy is already resolved', 400);
    }

    if (reconciliation.status === 'RECONCILED' && reconciliation.discrepancyQuantity === 0) {
      throw new AppError('Cannot resolve a record with zero discrepancy (already reconciled)', 400);
    }

    // Authorization check
    if (actingHospitalId) {
      const resolvedId = await this._resolveHospitalId(actingHospitalId);
      if (
        reconciliation.sourceHospitalId !== resolvedId &&
        reconciliation.destinationHospitalId !== resolvedId
      ) {
        throw new AppError('Unauthorized to resolve this discrepancy', 403);
      }
    }

    const reason = (resolutionData.reason || resolutionData.resolutionReason || '').trim();
    if (!reason) {
      throw new AppError('Resolution reason is required and must be a non-empty string', 400);
    }

    const updated = await prisma.resourceReconciliation.update({
      where: { id: reconciliation.id },
      data: {
        status: 'RESOLVED',
        resolutionReason: reason,
        resolutionNotes: resolutionData.notes ? String(resolutionData.notes).trim() : null,
        resolvedBy: resolutionData.resolvedBy || 'Hospital Operations Officer',
        resolvedAt: new Date()
      },
      include: {
        transfer: true,
        resource: true,
        sourceHospital: { select: { id: true, hospitalName: true, district: true } },
        destinationHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    return updated;
  }

  /**
   * Global list of all reconciliations
   */
  async listAllReconciliations(filters = {}) {
    const where = {};

    if (filters.status) {
      where.status = String(filters.status).toUpperCase();
    }

    if (filters.discrepancyType) {
      where.discrepancyType = String(filters.discrepancyType).toUpperCase();
    }

    const records = await prisma.resourceReconciliation.findMany({
      where,
      include: {
        transfer: true,
        resource: true,
        sourceHospital: { select: { id: true, hospitalName: true, district: true } },
        destinationHospital: { select: { id: true, hospitalName: true, district: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return records;
  }
}

module.exports = new ReconciliationService();
