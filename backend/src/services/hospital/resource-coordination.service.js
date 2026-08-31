const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

const VALID_COORDINATION_STATUSES = ['REQUESTED', 'OFFERED', 'APPROVED', 'REJECTED', 'CANCELLED'];

class ResourceCoordinationService {
  /**
   * Internal helper to find and verify hospital existence
   */
  async _findHospital(hospitalId) {
    let hospital = await prisma.hospitalProfile.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      hospital = await prisma.hospitalProfile.findUnique({
        where: { userId: hospitalId }
      });
    }

    if (!hospital) {
      throw new AppError('Hospital not found', 404);
    }

    return hospital;
  }

  /**
   * Discover available emergency resources across all hospitals
   */
  async discoverAvailableResources(requestingHospitalId = null, filters = {}) {
    const where = {
      isActive: true,
      availableQty: { gt: 0 }
    };

    if (filters.category || filters.type) {
      where.category = {
        contains: (filters.category || filters.type).trim(),
        mode: 'insensitive'
      };
    }

    if (filters.district) {
      where.district = {
        contains: filters.district.trim(),
        mode: 'insensitive'
      };
    }

    let reqHosp = null;
    if (requestingHospitalId) {
      try {
        reqHosp = await this._findHospital(requestingHospitalId);
      } catch (e) {
        // requesting hospital might be omitted or invalid
      }
    }

    if (filters.externalOnly === 'true' && reqHosp) {
      where.hospitalId = { not: reqHosp.id };
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            district: true,
            latitude: true,
            longitude: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return resources.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      district: r.district,
      quantity: r.quantity,
      availableQty: r.availableQty,
      allocatedQty: Math.max(0, r.quantity - r.availableQty),
      unit: r.unit,
      status: r.status,
      hospital: r.hospital ? {
        id: r.hospital.id,
        hospitalName: r.hospital.hospitalName,
        district: r.hospital.district,
        latitude: r.hospital.latitude,
        longitude: r.hospital.longitude
      } : null,
      isOwned: reqHosp ? (r.hospitalId === reqHosp.id) : false
    }));
  }

  /**
   * Create a new cross-agency resource coordination request
   */
  async createCoordinationRequest(data) {
    if (!data.resourceId) {
      throw new AppError('Resource ID is required', 400);
    }

    const resource = await prisma.resource.findUnique({
      where: { id: String(data.resourceId) },
      include: { hospital: true }
    });

    if (!resource || !resource.isActive) {
      throw new AppError('Resource not found or inactive', 404);
    }

    if (!resource.hospitalId) {
      throw new AppError('Source hospital not found for this resource', 404);
    }

    const destHospId = data.toHospitalId || data.requestingHospitalId || data.destinationHospitalId;
    if (!destHospId) {
      throw new AppError('Destination hospital ID is required', 400);
    }

    const toHospital = await this._findHospital(destHospId);

    if (resource.hospitalId === toHospital.id) {
      throw new AppError('Cannot create cross-agency coordination request for own hospital resource', 400);
    }

    const quantity = Number(data.quantity);
    if (typeof data.quantity === 'boolean' || isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError('Requested quantity must be a positive integer', 400);
    }

    const transfer = await prisma.resourceTransfer.create({
      data: {
        resourceId: resource.id,
        fromHospitalId: resource.hospitalId,
        toHospitalId: toHospital.id,
        fromDistrict: resource.district || resource.hospital?.district || 'Central Metro',
        toDistrict: toHospital.district || 'Central Metro',
        quantity,
        status: 'REQUESTED',
        notes: data.notes ? String(data.notes).trim() : null,
        reason: data.reason ? String(data.reason).trim() : null
      },
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    return transfer;
  }

  /**
   * Get single coordination request by ID with scoping
   */
  async getCoordinationRequest(requestId, hospitalId = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: requestId },
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    if (!transfer) {
      throw new AppError('Coordination request not found', 404);
    }

    if (hospitalId) {
      let resolvedHospId = hospitalId;
      try {
        const h = await this._findHospital(hospitalId);
        resolvedHospId = h.id;
      } catch (e) {
        // proceed with raw id
      }

      if (transfer.fromHospitalId !== resolvedHospId && transfer.toHospitalId !== resolvedHospId) {
        throw new AppError('Unauthorized to access this coordination record', 403);
      }
    }

    return transfer;
  }

  /**
   * List coordination requests for a hospital (incoming and outgoing)
   */
  async getHospitalCoordinationRequests(hospitalId, filters = {}) {
    const hospital = await this._findHospital(hospitalId);

    const where = {
      OR: [
        { fromHospitalId: hospital.id },
        { toHospitalId: hospital.id }
      ]
    };

    if (filters.status) {
      const st = String(filters.status).toUpperCase();
      if (VALID_COORDINATION_STATUSES.includes(st)) {
        where.status = st;
      }
    }

    if (filters.direction === 'incoming') {
      delete where.OR;
      where.fromHospitalId = hospital.id;
    } else if (filters.direction === 'outgoing') {
      delete where.OR;
      where.toHospitalId = hospital.id;
    }

    const requests = await prisma.resourceTransfer.findMany({
      where,
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests;
  }

  /**
   * Update coordination request status (Approve, Reject, Cancel)
   */
  async updateRequestStatus(requestId, targetStatus, actingHospitalId = null, reason = null) {
    const transfer = await prisma.resourceTransfer.findUnique({
      where: { id: requestId },
      include: { resource: true }
    });

    if (!transfer) {
      throw new AppError('Coordination request not found', 404);
    }

    const statusVal = String(targetStatus || '').trim().toUpperCase();
    if (!VALID_COORDINATION_STATUSES.includes(statusVal)) {
      throw new AppError(`Invalid coordination status '${targetStatus}'. Allowed: ${VALID_COORDINATION_STATUSES.join(', ')}`, 400);
    }

    // State machine check
    const currentStatus = transfer.status;
    const allowedFromRequested = ['APPROVED', 'REJECTED', 'CANCELLED', 'OFFERED'];
    const allowedFromOffered = ['APPROVED', 'REJECTED', 'CANCELLED'];

    if (currentStatus === 'REQUESTED' && !allowedFromRequested.includes(statusVal)) {
      throw new AppError(`Invalid transition from '${currentStatus}' to '${statusVal}'`, 400);
    } else if (currentStatus === 'OFFERED' && !allowedFromOffered.includes(statusVal)) {
      throw new AppError(`Invalid transition from '${currentStatus}' to '${statusVal}'`, 400);
    } else if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(currentStatus)) {
      throw new AppError(`Cannot transition from terminal status '${currentStatus}'`, 400);
    }

    // Authorization checks
    if (actingHospitalId) {
      let resolvedActingId = actingHospitalId;
      try {
        const h = await this._findHospital(actingHospitalId);
        resolvedActingId = h.id;
      } catch (e) {
        // proceed
      }

      if (statusVal === 'APPROVED' || statusVal === 'REJECTED') {
        if (transfer.fromHospitalId !== resolvedActingId) {
          throw new AppError('Only the source hospital owning the resource can approve or reject this request', 403);
        }
      } else if (statusVal === 'CANCELLED') {
        if (transfer.fromHospitalId !== resolvedActingId && transfer.toHospitalId !== resolvedActingId) {
          throw new AppError('Only participating hospitals can cancel this request', 403);
        }
      }
    }

    const updateData = {
      status: statusVal
    };

    if (reason) {
      updateData.reason = String(reason).trim();
    }

    const now = new Date();
    if (statusVal === 'APPROVED') {
      updateData.approvedAt = now;
    } else if (statusVal === 'REJECTED') {
      updateData.rejectedAt = now;
    } else if (statusVal === 'CANCELLED') {
      updateData.cancelledAt = now;
    }

    const updated = await prisma.resourceTransfer.update({
      where: { id: transfer.id },
      data: updateData,
      include: {
        resource: true,
        fromHospital: { select: { id: true, hospitalName: true, district: true } },
        toHospital: { select: { id: true, hospitalName: true, district: true } }
      }
    });

    return updated;
  }
}

module.exports = new ResourceCoordinationService();
