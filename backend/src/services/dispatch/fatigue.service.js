const prisma = require('../../config/database');
const { AppError } = require('../../utils/errors');

class FatigueService {
  /**
   * Determine operational fatigue level from bounded numerical score
   * Note: This is an operational dispatch indicator, NOT a medical diagnosis.
   */
  getFatigueLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Deterministically calculate operational fatigue score and contributing factors
   * Bounded strictly between 0 and 100.
   */
  calculateScore(dutyHours = 0, consecutiveShifts = 0, incidentsCount = 0) {
    const safeDutyHours = Math.max(0, Number(dutyHours) || 0);
    const safeShifts = Math.max(0, Number(consecutiveShifts) || 0);
    const safeIncidents = Math.max(0, Number(incidentsCount) || 0);

    // Factor weightings:
    // 1. Shift duration (up to 50 pts, based on 12-hour baseline shift)
    const dutyHoursScore = Math.min(50, Math.round(((safeDutyHours / 12) * 50) * 10) / 10);

    // 2. Continuous deployment / consecutive shifts (up to 30 pts, 15 pts per consecutive shift)
    const shiftsScore = Math.min(30, safeShifts * 15);

    // 3. Incident load / operational intensity (up to 20 pts, 4 pts per dispatch/incident handled)
    const incidentsScore = Math.min(20, safeIncidents * 4);

    const rawScore = dutyHoursScore + shiftsScore + incidentsScore;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
    const level = this.getFatigueLevel(finalScore);

    return {
      score: finalScore,
      level,
      factors: {
        dutyHours: safeDutyHours,
        consecutiveShifts: safeShifts,
        incidentsCount: safeIncidents,
        dutyHoursScore,
        shiftsScore,
        incidentsScore
      }
    };
  }

  /**
   * Internal helper to find profile by ID or User ID
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
        dispatches: true
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
          dispatches: true
        }
      });
    }

    return profile;
  }

  /**
   * Retrieve current fatigue state and factors for a responder
   */
  async getResponderFatigue(id) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Responder not found', 404);
    }

    const incidentsCount = profile.dispatches ? profile.dispatches.length : 0;
    const calculation = this.calculateScore(
      profile.dutyHours,
      profile.consecutiveShifts,
      incidentsCount
    );

    const recentHistory = await prisma.fatigueRecord.findMany({
      where: { responderId: profile.id },
      orderBy: { recordedAt: 'desc' },
      take: 5
    });

    return {
      responderId: profile.id,
      userId: profile.userId,
      name: profile.user ? profile.user.name : null,
      score: profile.fatigueScore !== undefined && profile.fatigueScore !== null
        ? profile.fatigueScore
        : calculation.score,
      level: this.getFatigueLevel(profile.fatigueScore || calculation.score),
      factors: calculation.factors,
      recentHistory
    };
  }

  /**
   * Recalculate operational fatigue and persist snapshot to PostgreSQL
   */
  async recalculateFatigue(id, workloadData = {}) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Responder not found', 404);
    }

    const previousScore = profile.fatigueScore || 0;
    const previousLevel = this.getFatigueLevel(previousScore);

    const effectiveDutyHours = workloadData.dutyHours !== undefined
      ? Number(workloadData.dutyHours)
      : profile.dutyHours;

    const effectiveShifts = workloadData.consecutiveShifts !== undefined
      ? Number(workloadData.consecutiveShifts)
      : profile.consecutiveShifts;

    const effectiveIncidents = workloadData.incidentsCount !== undefined
      ? Number(workloadData.incidentsCount)
      : (profile.dispatches ? profile.dispatches.length : 0);

    const calculation = this.calculateScore(
      effectiveDutyHours,
      effectiveShifts,
      effectiveIncidents
    );

    // Update ResponderProfile in PostgreSQL
    const updatedProfile = await prisma.responderProfile.update({
      where: { id: profile.id },
      data: {
        fatigueScore: calculation.score,
        dutyHours: effectiveDutyHours,
        consecutiveShifts: effectiveShifts
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

    // Create historical FatigueRecord snapshot in PostgreSQL
    const fatigueRecord = await prisma.fatigueRecord.create({
      data: {
        responderId: profile.id,
        hoursActive: effectiveDutyHours,
        incidentsCount: effectiveIncidents,
        fatigueScore: calculation.score
      }
    });

    // Determine if Socket.IO alert should trigger (transition into HIGH or CRITICAL without duplicate flooding)
    const isNowHighOrCritical = calculation.level === 'HIGH' || calculation.level === 'CRITICAL';
    const wasAlreadySameHighLevel = (previousLevel === calculation.level);
    const shouldAlert = isNowHighOrCritical && (!wasAlreadySameHighLevel || previousScore < 60);

    return {
      responderId: profile.id,
      userId: profile.userId,
      score: calculation.score,
      level: calculation.level,
      previousScore,
      previousLevel,
      shouldAlert,
      factors: calculation.factors,
      record: fatigueRecord,
      responder: updatedProfile
    };
  }

  /**
   * Record an operational fatigue snapshot and update current fatigue
   */
  async recordFatigueSnapshot(id, data = {}) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Responder not found', 404);
    }

    const { hoursActive, incidentsCount } = data;

    const effectiveDutyHours = hoursActive !== undefined ? Number(hoursActive) : profile.dutyHours;
    const effectiveIncidents = incidentsCount !== undefined ? Number(incidentsCount) : 0;

    return await this.recalculateFatigue(profile.id, {
      dutyHours: effectiveDutyHours,
      incidentsCount: effectiveIncidents
    });
  }

  /**
   * Retrieve historical fatigue records for a responder
   */
  async getFatigueHistory(id, limit = 20) {
    const profile = await this._findProfile(id);
    if (!profile) {
      throw new AppError('Responder not found', 404);
    }

    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    return await prisma.fatigueRecord.findMany({
      where: { responderId: profile.id },
      orderBy: { recordedAt: 'desc' },
      take: safeLimit
    });
  }
}

module.exports = new FatigueService();
