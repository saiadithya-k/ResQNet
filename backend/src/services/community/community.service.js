const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');
const { calculateDistance } = require('../../utils/geo');

class CommunityService {
  /**
   * Internal helper to find community responder profile by Profile ID or User ID
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
        },
        dispatches: {
          include: {
            incident: true
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
          },
          dispatches: {
            include: {
              incident: true
            }
          }
        }
      });
    }

    return profile;
  }

  /**
   * Register a new community responder
   */
  async createCommunityResponder(data) {
    const {
      userId,
      email,
      name,
      phone,
      badgeNumber,
      latitude,
      longitude,
      skills = [],
      equipment = [],
      isVerified = true,
      role
    } = data;

    // Disallow role escalation
    if (role && ['ADMIN', 'DISPATCHER', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
      throw new AppError('Unauthorized role escalation. Community responders cannot register with administrative privileges.', 403);
    }

    let user;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found for provided userId', 400);
      }
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || 'Community Volunteer',
            phone: phone || null,
            passwordHash: 'DEMO_COMMUNITY_HASH',
            role: 'COMMUNITY_RESPONDER'
          }
        });
      }
    } else {
      throw new AppError('Either userId or email must be provided to register a community responder', 400);
    }

    // Check for duplicate community responder profile
    const existingProfile = await prisma.responderProfile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      throw new AppError('Community responder profile already exists for this user', 409);
    }

    const uniqueBadge = badgeNumber || `COMM-${Date.now().toString().slice(-4)}`;

    const profile = await prisma.responderProfile.create({
      data: {
        userId: user.id,
        badgeNumber: uniqueBadge,
        responderType: 'COMMUNITY_FIRST_RESPONDER',
        isCommunity: true,
        isVerified: Boolean(isVerified),
        status: 'AVAILABLE',
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        lastLocationTime: latitude !== undefined && longitude !== undefined ? new Date() : null,
        skills: Array.isArray(skills) ? skills : [],
        equipment: Array.isArray(equipment) ? equipment : []
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

    return profile;
  }

  /**
   * Retrieve community responder profile by ID
   */
  async getCommunityResponder(id) {
    const profile = await this._findProfile(id);
    if (!profile || !profile.isCommunity) {
      throw new AppError('Community responder not found', 404);
    }

    return profile;
  }

  /**
   * Update community responder operational availability
   */
  async updateAvailability(id, isAvailable) {
    const profile = await this._findProfile(id);
    if (!profile || !profile.isCommunity) {
      throw new AppError('Community responder not found', 404);
    }

    const targetStatus = isAvailable ? 'AVAILABLE' : 'UNAVAILABLE';

    const updated = await prisma.responderProfile.update({
      where: { id: profile.id },
      data: {
        status: targetStatus
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

    return updated;
  }

  /**
   * Update community responder GPS position
   */
  async updateLocation(id, latitude, longitude) {
    const profile = await this._findProfile(id);
    if (!profile || !profile.isCommunity) {
      throw new AppError('Community responder not found', 404);
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new AppError('Invalid latitude. Must be between -90 and 90 degrees', 400);
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      throw new AppError('Invalid longitude. Must be between -180 and 180 degrees', 400);
    }

    const updated = await prisma.responderProfile.update({
      where: { id: profile.id },
      data: {
        latitude: lat,
        longitude: lon,
        lastLocationTime: new Date()
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

    return updated;
  }

  /**
   * Discover nearby safe tasks eligible for community responders
   */
  async getNearbyTasks(id, options = {}) {
    const profile = await this._findProfile(id);
    if (!profile || !profile.isCommunity) {
      throw new AppError('Community responder not found', 404);
    }

    // Unavailable responders receive no tasks
    if (profile.status === 'UNAVAILABLE' || profile.status === 'OFF_DUTY') {
      return [];
    }

    const radiusKm = Math.max(1, Number(options.radiusKm) || 10);

    // Query open incidents
    const openIncidents = await prisma.incident.findMany({
      where: {
        status: {
          in: ['REPORTED', 'VERIFIED', 'PRIORITIZED', 'DISPATCHING']
        }
      }
    });

    // Apply safety filter & proximity calculation
    const nearbyTasks = [];

    for (const incident of openIncidents) {
      // Safety constraint: Exclude toxic/hazardous emergencies
      if (incident.hasHazmat || incident.incidentType === 'HAZMAT') {
        continue;
      }

      let distanceKm = null;
      if (
        profile.latitude !== null && profile.latitude !== undefined &&
        profile.longitude !== null && profile.longitude !== undefined &&
        incident.latitude !== null && incident.latitude !== undefined &&
        incident.longitude !== null && incident.longitude !== undefined
      ) {
        distanceKm = calculateDistance(
          profile.latitude,
          profile.longitude,
          incident.latitude,
          incident.longitude
        );
      }

      if (distanceKm !== null && distanceKm <= radiusKm) {
        nearbyTasks.push({
          taskId: incident.id,
          title: incident.title,
          description: incident.description,
          incidentType: incident.incidentType,
          severity: incident.severity,
          distanceKm,
          victimCount: incident.victimCount,
          hasInjuries: incident.hasInjuries,
          hasTrapped: incident.hasTrapped,
          createdAt: incident.createdAt
        });
      }
    }

    // Proximity ordering (nearest first)
    nearbyTasks.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    return nearbyTasks;
  }

  /**
   * Atomically accept a task with concurrency / race-condition protection
   */
  async acceptTask(id, incidentId) {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.responderProfile.findFirst({
        where: {
          OR: [{ id }, { userId: id }]
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

      if (!profile || !profile.isCommunity) {
        throw new AppError('Community responder not found', 404);
      }

      const incident = await tx.incident.findUnique({
        where: { id: incidentId }
      });

      if (!incident) {
        throw new AppError('Incident not found', 404);
      }

      if (profile.status !== 'AVAILABLE') {
        throw new AppError(`Community responder is currently '${profile.status}' and cannot accept new tasks`, 400);
      }

      const activeAssignment = await tx.dispatch.findFirst({
        where: {
          responderId: profile.id,
          status: {
            in: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE']
          }
        }
      });

      if (activeAssignment) {
        throw new AppError('Community responder is already handling an active assignment', 400);
      }

      // Safety constraint check
      if (incident.hasHazmat || incident.incidentType === 'HAZMAT') {
        throw new AppError('Incident is not eligible for community response due to hazardous safety restrictions', 400);
      }

      // Concurrency check: Ensure incident is not already accepted
      const existingDispatch = await tx.dispatch.findFirst({
        where: {
          incidentId: incident.id,
          status: {
            in: ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE']
          }
        }
      });

      if (existingDispatch) {
        throw new AppError('Task has already been accepted by another responder', 409);
      }

      // Create Dispatch record
      const dispatch = await tx.dispatch.create({
        data: {
          incidentId: incident.id,
          responderId: profile.id,
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
      const updatedProfile = await tx.responderProfile.update({
        where: { id: profile.id },
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

      // Update Incident status
      const updatedIncident = await tx.incident.update({
        where: { id: incident.id },
        data: {
          status: 'ASSIGNED'
        }
      });

      // Log timeline note
      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          status: 'ASSIGNED',
          title: 'Community Responder Accepted Task',
          description: `Accepted by community volunteer ${profile.user ? profile.user.name : 'Volunteer'}`
        }
      });

      return {
        dispatch,
        responder: updatedProfile,
        incident: updatedIncident
      };
    });
  }

  /**
   * Update community task lifecycle status
   */
  async updateTaskStatus(id, taskId, newStatus) {
    const profile = await this._findProfile(id);
    if (!profile || !profile.isCommunity) {
      throw new AppError('Community responder not found', 404);
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: taskId },
      include: { incident: true }
    });

    if (!dispatch) {
      throw new AppError('Task assignment not found', 404);
    }

    if (dispatch.responderId !== profile.id) {
      throw new AppError('Unauthorized. You cannot update another responder\'s task.', 403);
    }

    if (dispatch.completedAt !== null) {
      throw new AppError('Completed task cannot be modified', 400);
    }

    const currentStatus = dispatch.status;
    const validTransitions = {
      'DISPATCHED': ['EN_ROUTE', 'CANCELLED', 'UNAVAILABLE'],
      'EN_ROUTE': ['ON_SCENE', 'CANCELLED'],
      'ON_SCENE': ['COMPLETED', 'CANCELLED']
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(`Invalid status transition from '${currentStatus}' to '${newStatus}'`, 400);
    }

    const isCompleted = (newStatus === 'COMPLETED');
    const isCancelled = (newStatus === 'CANCELLED' || newStatus === 'UNAVAILABLE');

    // Determine valid Prisma ResponderStatus enum for Dispatch
    let dispatchDbStatus = newStatus;
    if (isCompleted) dispatchDbStatus = 'AVAILABLE';
    else if (isCancelled) dispatchDbStatus = 'OFF_DUTY';

    // Update dispatch
    const updatedDispatch = await prisma.dispatch.update({
      where: { id: dispatch.id },
      data: {
        status: dispatchDbStatus,
        completedAt: isCompleted ? new Date() : undefined
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

    // Formatted response with taskStatus
    const dispatchResult = {
      ...updatedDispatch,
      status: isCompleted ? 'COMPLETED' : (isCancelled ? 'CANCELLED' : updatedDispatch.status)
    };

    // Update responder profile status
    const responderTargetStatus = (isCompleted || isCancelled) ? 'AVAILABLE' : newStatus;

    const updatedProfile = await prisma.responderProfile.update({
      where: { id: profile.id },
      data: {
        status: responderTargetStatus
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

    return {
      dispatch: dispatchResult,
      responder: updatedProfile
    };
  }

  /**
   * Decline or cancel an accepted task
   */
  async declineTask(id, taskId) {
    return await this.updateTaskStatus(id, taskId, 'CANCELLED');
  }
}

module.exports = new CommunityService();
