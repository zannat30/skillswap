const SESSION_COST = Number(process.env.STANDARD_SESSION_COST_CREDITS) || 50;
const MENTOR_PAYOUT = Number(process.env.MENTOR_RELEASE_CREDITS) || 45;
const PLATFORM_BURN = Number(process.env.PLATFORM_BURN_CREDITS) || 5;

function calculateEscrowSplit(lockedAmount = SESSION_COST) {
  const mentorCredited = lockedAmount === 50 ? MENTOR_PAYOUT : Math.floor(lockedAmount * 0.9);
  const platformBurned = lockedAmount - mentorCredited;
  return {
    lockedAmount,
    mentorCredited,
    platformBurned
  };
}

function validateStateTransition(currentState, targetState, actorRole, isMentor, isLearner) {
  if (currentState === 'NONE' && targetState === 'PENDING') {
    if (!isLearner) return { valid: false, status: 403, code: 'FORBIDDEN_ROLE', message: 'Only a Learner can book a session.' };
    return { valid: true };
  }

  if (targetState === 'ACTIVE') {
    if (!isMentor) {
      return { valid: false, status: 403, code: 'FORBIDDEN_ROLE', message: 'Only the assigned Mentor can start the session.' };
    }
    if (currentState !== 'PENDING') {
      return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: `Cannot transition from ${currentState} to ACTIVE.` };
    }
    return { valid: true };
  }

  if (targetState === 'CANCELLED') {
    if (currentState !== 'PENDING') {
      return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: 'Only PENDING sessions can be cancelled.' };
    }
    return { valid: true };
  }

  if (targetState === 'COMPLETED') {
    if (actorRole === 'ADMIN' && currentState === 'DISPUTED') {
      return { valid: true };
    }
    if (!isLearner) {
      return { valid: false, status: 403, code: 'FORBIDDEN_ROLE', message: 'Only the Learner can mark an active session as learnt.' };
    }
    if (currentState !== 'ACTIVE') {
      return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: 'Session must be ACTIVE before it can be completed.' };
    }
    return { valid: true };
  }

  if (targetState === 'DISPUTED') {
    if (!isLearner) {
      return { valid: false, status: 403, code: 'FORBIDDEN_ROLE', message: 'Only the Learner can raise a session dispute.' };
    }
    if (currentState !== 'ACTIVE') {
      return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: 'Only ACTIVE sessions can be disputed.' };
    }
    return { valid: true };
  }

  if (targetState === 'REFUNDED') {
    if (actorRole !== 'ADMIN') {
      return { valid: false, status: 403, code: 'FORBIDDEN_ROLE', message: 'Only an Administrator can issue a dispute refund.' };
    }
    if (currentState !== 'DISPUTED') {
      return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: 'Only DISPUTED sessions can be refunded by Admin.' };
    }
    return { valid: true };
  }

  return { valid: false, status: 400, code: 'INVALID_STATE_TRANSITION', message: 'Invalid state transition.' };
}

module.exports = {
  SESSION_COST,
  MENTOR_PAYOUT,
  PLATFORM_BURN,
  calculateEscrowSplit,
  validateStateTransition
};
