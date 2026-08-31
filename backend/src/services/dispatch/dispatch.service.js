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
   * Assign a professional responder to an incident with ACID transaction & concurrency lock
   */
  async assignResponder(incidentId, responderId, notes = null) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch incident inside transaction
      const incident = await tx.incident.findUnique({
        where: { id: incidentId }
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      // 2. Fetch responder profile inside transaction
      let responderProfile = await tx.responderProfile.findUnique({
        where: { id: responderId },
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

      if (!responderProfile) {
        responderProfile = await tx.responderProfile.findUnique({
          where: { userId: responderId },
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

      if (!responderProfile) {
        throw new AppError('Responder not found', 404);
      }

      if (responderProfile.status === 'OFF_DUTY' || responderProfile.status === 'UNAVAILABLE') {
        throw new AppError(
          `Cannot dispatch responder in '${responderProfile.status}' status. Responder must be active/on-duty.`,
          400
        );
      }

      // 3. Double-Dispatch Guardrail: Check for existing active dispatch for this incident or responder
      const existingActiveDispatch = await tx.dispatch.findFirst({
        where: {
          OR: [
            { incidentId: incident.id, status: { in: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'] } },
            { responderId: responderProfile.id, status: { in: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'] } }
          ]
        }
      });

      if (existingActiveDispatch) {
        if (existingActiveDispatch.responderId === responderProfile.id) {
          throw new AppError(
            `Unit ${responderProfile.user ? responderProfile.user.name : responderProfile.id} (${responderProfile.badgeNumber || 'Unit'}) is already actively assigned to an incident`,
            409
          );
        } else {
          throw new AppError(
            `Incident #${incident.id} already has an active responder assignment`,
            409
          );
        }
      }

      // 4. Atomic conditional status update - only 1 concurrent transaction can transition from available to DISPATCHED
      const updatedCount = await tx.responderProfile.updateMany({
        where: {
          id: responderProfile.id,
          status: { notIn: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING', 'OFF_DUTY', 'UNAVAILABLE'] }
        },
        data: {
          status: 'DISPATCHED'
        }
      });

      if (updatedCount.count === 0) {
        throw new AppError(
          `Unit ${responderProfile.user ? responderProfile.user.name : responderProfile.id} is already dispatched or unavailable`,
          409
        );
      }

      const previousStatus = responderProfile.status;

      // 5. Create Dispatch record in PostgreSQL
      const dispatch = await tx.dispatch.create({
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

      // 6. Update Incident status to ASSIGNED if currently initial state
      let updatedIncident = incident;
      if (incident.status === 'REPORTED' || incident.status === 'DISPATCHING') {
        updatedIncident = await tx.incident.update({
          where: { id: incident.id },
          data: {
            status: 'ASSIGNED'
          }
        });
      }

      // 7. Create IncidentEvent timeline note
      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          status: 'ASSIGNED',
          title: 'Unit Dispatched',
          description: `Assigned to ${responderProfile.user ? responderProfile.user.name : 'Responder'} (${responderProfile.badgeNumber || 'Unit'})`
        }
      });

      const updatedResponder = await tx.responderProfile.findUnique({
        where: { id: responderProfile.id },
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

      return {
        dispatch,
        responder: updatedResponder,
        incident: updatedIncident,
        previousStatus
      };
    }, {
      isolationLevel: 'Serializable'
    });
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
