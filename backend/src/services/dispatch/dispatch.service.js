const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');
const responderMatchingService = require('./responder-matching.service');

class DispatchService {
  /**
   * Get ranked matches for an incident
   */
  async getMatches(incidentId, options = {}) {
    return await responderMatchingService.findMatchesForIncident(incidentId, options);
  }

  /**
   * Internal helper to find responder profile by ID or User ID
   */
  async _findProfile(id) {
    let profile = await prisma.responderProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!profile) {
      profile = await prisma.responderProfile.findUnique({
        where: { userId: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              avatarUrl: true
            }
          }
        }
      });
    }

    return profile;
  }

  /**
   * Assign a professional responder to an incident
   */
  async assignResponder(incidentId, responderId, notes = null) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId }
    });

    if (!incident) {
      throw new AppError('Incident not found', 404);
    }

    const responderProfile = await this._findProfile(responderId);
    if (!responderProfile) {
      throw new AppError('Responder not found', 404);
    }

    if (responderProfile.status === 'OFF_DUTY' || responderProfile.status === 'UNAVAILABLE') {
      throw new AppError(
        `Cannot dispatch responder in '${responderProfile.status}' status. Responder must be active/on-duty.`,
        400
      );
    }

    const previousStatus = responderProfile.status;

    // Create Dispatch record in PostgreSQL
    const dispatch = await prisma.dispatch.create({
      data: {
        incidentId: incident.id,
        responderId: responderProfile.id,
        status: 'DISPATCHED',
        assignedAt: new Date()
      },
      include: {
        incident: true,
        responder: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Update Responder status to DISPATCHED
    const updatedResponder = await prisma.responderProfile.update({
      where: { id: responderProfile.id },
      data: {
        status: 'DISPATCHED'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    // Update Incident status to ASSIGNED if currently initial state
    let updatedIncident = incident;
    if (incident.status === 'REPORTED' || incident.status === 'DISPATCHING') {
      updatedIncident = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: 'ASSIGNED'
        }
      });
    }

    // Create IncidentEvent timeline note
    await prisma.incidentEvent.create({
      data: {
        incidentId: incident.id,
        status: 'ASSIGNED',
        title: 'Unit Dispatched',
        description: `Assigned to ${responderProfile.user ? responderProfile.user.name : 'Responder'} (${responderProfile.badgeNumber || 'Unit'})`
      }
    });

    return {
      dispatch,
      responder: updatedResponder,
      incident: updatedIncident,
      previousStatus
    };
  }

  /**
   * Get single dispatch by ID
   */
  async getDispatchById(id) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        incident: true,
        responder: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!dispatch) {
      throw new AppError('Dispatch record not found', 404);
    }

    return dispatch;
  }
}

module.exports = new DispatchService();
