const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

const VALID_STATUSES = ['AVAILABLE', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'DEPLOYED', 'RETURNED'];

class ResourceService {
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
   * List resources belonging to a hospital
   */
  async getHospitalResources(hospitalId, filters = {}) {
    const hospital = await this._findHospital(hospitalId);

    const where = {
      hospitalId: hospital.id,
      isActive: true
    };

    if (filters.category || filters.type) {
      const catVal = (filters.category || filters.type).trim();
      where.category = {
        contains: catVal,
        mode: 'insensitive'
      };
    }

    if (filters.status) {
      const statusVal = String(filters.status).trim().toUpperCase();
      if (VALID_STATUSES.includes(statusVal)) {
        where.status = statusVal;
      }
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return resources.map(r => ({
      ...r,
      allocatedQty: Math.max(0, r.quantity - r.availableQty)
    }));
  }

  /**
   * Get single resource by ID scoped to hospital
   */
  async getResourceById(hospitalId, resourceId) {
    const hospital = await this._findHospital(hospitalId);

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.hospitalId !== hospital.id) {
      throw new AppError('Resource not found for this hospital', 404);
    }

    return {
      ...resource,
      allocatedQty: Math.max(0, resource.quantity - resource.availableQty)
    };
  }

  /**
   * Create a new hospital emergency resource
   */
  async createResource(hospitalId, data) {
    const hospital = await this._findHospital(hospitalId);

    const name = (data.name || '').trim();
    const category = (data.category || data.type || '').trim().toUpperCase();

    if (!name) {
      throw new AppError('Resource name is required and must be a non-empty string', 400);
    }

    if (!category) {
      throw new AppError('Resource category is required and must be a non-empty string', 400);
    }

    if (data.quantity !== undefined && data.quantity !== null) {
      const rawQty = Number(data.quantity);
      if (typeof data.quantity === 'boolean' || isNaN(rawQty) || !Number.isInteger(rawQty) || rawQty < 0) {
        throw new AppError('Quantity must be a non-negative integer', 400);
      }
    }

    const quantity = data.quantity !== undefined ? Number(data.quantity) : 1;

    let availableQty = quantity;
    if (data.availableQty !== undefined && data.availableQty !== null) {
      const rawAvail = Number(data.availableQty);
      if (typeof data.availableQty === 'boolean' || isNaN(rawAvail) || !Number.isInteger(rawAvail) || rawAvail < 0) {
        throw new AppError('Available quantity must be a non-negative integer', 400);
      }
      if (rawAvail > quantity) {
        throw new AppError('Available quantity cannot exceed total quantity', 400);
      }
      availableQty = rawAvail;
    }

    let status = 'AVAILABLE';
    if (data.status) {
      const rawStatus = String(data.status).trim().toUpperCase();
      if (!VALID_STATUSES.includes(rawStatus)) {
        throw new AppError(`Invalid resource status '${data.status}'. Allowed: ${VALID_STATUSES.join(', ')}`, 400);
      }
      status = rawStatus;
    } else if (availableQty === 0) {
      status = 'DEPLOYED';
    }

    const resource = await prisma.resource.create({
      data: {
        hospitalId: hospital.id,
        name,
        category,
        district: hospital.district,
        quantity,
        availableQty,
        unit: data.unit ? String(data.unit).trim() : 'units',
        status,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });

    return {
      ...resource,
      allocatedQty: Math.max(0, resource.quantity - resource.availableQty)
    };
  }

  /**
   * Update resource details and quantities
   */
  async updateResource(hospitalId, resourceId, data) {
    if (!data || Object.keys(data).length === 0) {
      throw new AppError('Update payload cannot be empty', 400);
    }

    const hospital = await this._findHospital(hospitalId);

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.hospitalId !== hospital.id) {
      throw new AppError('Resource not found for this hospital', 404);
    }

    const updateData = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) {
        throw new AppError('Resource name cannot be empty', 400);
      }
      updateData.name = name;
    }

    if (data.category !== undefined || data.type !== undefined) {
      const cat = String(data.category || data.type).trim().toUpperCase();
      if (!cat) {
        throw new AppError('Resource category cannot be empty', 400);
      }
      updateData.category = cat;
    }

    if (data.unit !== undefined) {
      updateData.unit = data.unit ? String(data.unit).trim() : 'units';
    }

    // Atomic quantity calculations
    let newTotal = resource.quantity;
    let newAvail = resource.availableQty;

    if (data.quantity !== undefined && data.quantity !== null) {
      const q = Number(data.quantity);
      if (typeof data.quantity === 'boolean' || isNaN(q) || !Number.isInteger(q) || q < 0) {
        throw new AppError('Quantity must be a non-negative integer', 400);
      }
      newTotal = q;
      updateData.quantity = newTotal;
    }

    if (data.availableQty !== undefined && data.availableQty !== null) {
      const a = Number(data.availableQty);
      if (typeof data.availableQty === 'boolean' || isNaN(a) || !Number.isInteger(a) || a < 0) {
        throw new AppError('Available quantity must be a non-negative integer', 400);
      }
      newAvail = a;
      updateData.availableQty = newAvail;
    }

    if (newAvail > newTotal) {
      throw new AppError('Available quantity cannot exceed total quantity', 400);
    }

    if (data.status !== undefined && data.status !== null) {
      const st = String(data.status).trim().toUpperCase();
      if (!VALID_STATUSES.includes(st)) {
        throw new AppError(`Invalid resource status '${data.status}'. Allowed: ${VALID_STATUSES.join(', ')}`, 400);
      }
      updateData.status = st;
    } else if (newAvail === 0 && resource.status === 'AVAILABLE') {
      updateData.status = 'DEPLOYED';
    } else if (newAvail > 0 && resource.status === 'DEPLOYED') {
      updateData.status = 'AVAILABLE';
    }

    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    const updated = await prisma.resource.update({
      where: { id: resource.id },
      data: updateData
    });

    return {
      ...updated,
      allocatedQty: Math.max(0, updated.quantity - updated.availableQty)
    };
  }

  /**
   * Deactivate a hospital resource
   */
  async deactivateResource(hospitalId, resourceId) {
    const hospital = await this._findHospital(hospitalId);

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.hospitalId !== hospital.id) {
      throw new AppError('Resource not found for this hospital', 404);
    }

    const deactivated = await prisma.resource.update({
      where: { id: resource.id },
      data: {
        isActive: false,
        availableQty: 0,
        status: 'DEPLOYED'
      }
    });

    return {
      ...deactivated,
      allocatedQty: Math.max(0, deactivated.quantity - deactivated.availableQty)
    };
  }

  /**
   * Global resource query across all hospitals & districts
   */
  async getAllResources(filters = {}) {
    const where = { isActive: true };

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

    if (filters.status) {
      const st = String(filters.status).trim().toUpperCase();
      if (VALID_STATUSES.includes(st)) {
        where.status = st;
      }
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        hospital: {
          select: {
            id: true,
            hospitalName: true,
            district: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return resources.map(r => ({
      ...r,
      allocatedQty: Math.max(0, r.quantity - r.availableQty)
    }));
  }
}

module.exports = new ResourceService();
