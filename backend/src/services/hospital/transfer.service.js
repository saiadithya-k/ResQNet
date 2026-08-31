const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

class TransferService {
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
   * Initiate and dispatch an approved resource transfer (APPROVED -> IN_TRANSIT)
   * Deducts source hospital available inventory atomically
   */
  async startTransfer(transferId, actingHospitalId = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: transferId },
      include: {
        resource: true,
        fromHospital: true,
        toHospital: true
      }
    });

    if (!transfer) {
      throw new AppError('Resource transfer not found', 404);
    }

    // Eligibility check
    if (transfer.status === 'REQUESTED') {
      throw new AppError('Transfer must be APPROVED before it can be started', 400);
    } else if (transfer.status !== 'APPROVED') {
      throw new AppError(`Cannot start transfer with status '${transfer.status}'`, 400);
    }

    // Authorization check
    if (actingHospitalId) {
      const resolvedId = await this._resolveHospitalId(actingHospitalId);
      if (transfer.fromHospitalId !== resolvedId) {
        throw new AppError('Only the source hospital can initiate and dispatch this transfer', 403);
      }
    }

    // Check source inventory availability
    if (transfer.resource.availableQty < transfer.quantity) {
      throw new AppError(
        `Insufficient available inventory at source hospital (available: ${transfer.resource.availableQty}, required: ${transfer.quantity})`,
        400
      );
    }

    // Execute atomic transaction
    const updatedTransfer = await prisma.$transaction(async (tx) => {
      // 1. Deduct source resource inventory
      const newAvail = transfer.resource.availableQty - transfer.quantity;
      const resStatus = newAvail === 0 ? 'DEPLOYED' : transfer.resource.status;

      await tx.resource.update({
        where: { id: transfer.resourceId },
        data: {
          availableQty: newAvail,
          status: resStatus
        }
      });

      // 2. Update transfer status to IN_TRANSIT
      return tx.resourceTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'IN_TRANSIT',
          inTransitAt: new Date()
        },
        include: {
          resource: true,
          fromHospital: { select: { id: true, hospitalName: true, district: true } },
          toHospital: { select: { id: true, hospitalName: true, district: true } }
        }
      });
    });

    return updatedTransfer;
  }

  /**
   * Mark transfer as DELIVERED (IN_TRANSIT -> DELIVERED)
   */
  async deliverTransfer(transferId, actingHospitalId = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: transferId }
    });

    if (!transfer) {
      throw new AppError('Resource transfer not found', 404);
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new AppError(`Cannot mark transfer delivered from status '${transfer.status}'`, 400);
    }

    if (actingHospitalId) {
      const resolvedId = await this._resolveHospitalId(actingHospitalId);
      if (transfer.fromHospitalId !== resolvedId && transfer.toHospitalId !== resolvedId) {
        throw new AppError('Unauthorized to update this transfer', 403);
      }
    }

    const updated = await prisma.resourceTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      },
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    return updated;
  }

  /**
   * Acknowledge and receive transfer at destination (DELIVERED / IN_TRANSIT -> RECEIVED)
   * Credits destination hospital inventory atomically with duplicate receipt protection
   */
  async receiveTransfer(transferId, actingHospitalId = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: transferId },
      include: {
        resource: true,
        fromHospital: true,
        toHospital: true
      }
    });

    if (!transfer) {
      throw new AppError('Resource transfer not found', 404);
    }

    // Duplicate receipt protection
    if (transfer.status === 'RECEIVED') {
      throw new AppError('Cannot receive an already received transfer', 400);
    }

    if (transfer.status !== 'DELIVERED' && transfer.status !== 'IN_TRANSIT') {
      throw new AppError(`Cannot receive transfer with status '${transfer.status}'`, 400);
    }

    // Authorization check
    if (actingHospitalId) {
      const resolvedId = await this._resolveHospitalId(actingHospitalId);
      if (transfer.toHospitalId !== resolvedId) {
        throw new AppError('Only the destination hospital can acknowledge and receive this transfer', 403);
      }
    }

    // Execute atomic transaction
    const receivedTransfer = await prisma.$transaction(async (tx) => {
      // 1. Credit destination hospital inventory
      const existingDestRes = await tx.resource.findFirst({
        where: {
          hospitalId: transfer.toHospitalId,
          name: transfer.resource.name,
          category: transfer.resource.category,
          isActive: true
        }
      });

      if (existingDestRes) {
        await tx.resource.update({
          where: { id: existingDestRes.id },
          data: {
            quantity: existingDestRes.quantity + transfer.quantity,
            availableQty: existingDestRes.availableQty + transfer.quantity,
            status: 'AVAILABLE'
          }
        });
      } else {
        await tx.resource.create({
          data: {
            hospitalId: transfer.toHospitalId,
            name: transfer.resource.name,
            category: transfer.resource.category,
            district: transfer.toDistrict || transfer.resource.district,
            quantity: transfer.quantity,
            availableQty: transfer.quantity,
            unit: transfer.resource.unit || 'units',
            status: 'AVAILABLE',
            isActive: true
          }
        });
      }

      // 2. Update transfer status to RECEIVED
      return tx.resourceTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date()
        },
        include: {
          resource: true,
          fromHospital: { select: { id: true, hospitalName: true, district: true } },
          toHospital: { select: { id: true, hospitalName: true, district: true } }
        }
      });
    });

    return receivedTransfer;
  }

  /**
   * General status update dispatcher
   */
  async updateTransferStatus(transferId, targetStatus, actingHospitalId = null) {
    const statusVal = String(targetStatus || '').trim().toUpperCase();

    if (statusVal === 'IN_TRANSIT') {
      return this.startTransfer(transferId, actingHospitalId);
    } else if (statusVal === 'DELIVERED') {
      return this.deliverTransfer(transferId, actingHospitalId);
    } else if (statusVal === 'RECEIVED') {
      return this.receiveTransfer(transferId, actingHospitalId);
    } else if (statusVal === 'CANCELLED') {
      const transfer = await prisma.resourceTransfer.findUnique({
        where: { id: transferId }
      });
      if (!transfer) {
        throw new AppError('Resource transfer not found', 404);
      }
      if (['DELIVERED', 'RECEIVED'].includes(transfer.status)) {
        throw new AppError(`Cannot cancel transfer with status '${transfer.status}'`, 400);
      }
      return prisma.resourceTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        },
        include: {
          resource: true,
          fromHospital: { select: { id: true, hospitalName: true, district: true } },
          toHospital: { select: { id: true, hospitalName: true, district: true } }
        }
      });
    } else {
      throw new AppError(`Invalid transfer transition target status '${targetStatus}'`, 400);
    }
  }

  /**
   * Get single transfer by ID with scoping
   */
  async getTransferById(transferId, requestingHospitalId = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: transferId },
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    if (!transfer) {
      throw new AppError('Resource transfer not found', 404);
    }

    if (requestingHospitalId) {
      const resolvedId = await this._resolveHospitalId(requestingHospitalId);
      if (transfer.fromHospitalId !== resolvedId && transfer.toHospitalId !== resolvedId) {
        throw new AppError('Unauthorized to access this transfer record', 403);
      }
    }

    return transfer;
  }

  /**
   * List transfers with filtering
   */
  async listTransfers(filters = {}) {
    const where = {};

    if (filters.hospitalId) {
      const resolvedId = await this._resolveHospitalId(filters.hospitalId);
      if (filters.direction === 'incoming') {
        where.toHospitalId = resolvedId;
      } else if (filters.direction === 'outgoing') {
        where.fromHospitalId = resolvedId;
      } else {
        where.OR = [
          { fromHospitalId: resolvedId },
          { toHospitalId: resolvedId }
        ];
      }
    }

    if (filters.status) {
      where.status = String(filters.status).toUpperCase();
    }

    const transfers = await prisma.resourceTransfer.findMany({
      where,
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return transfers;
  }
}

module.exports = new TransferService();
