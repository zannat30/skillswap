const { isMongoConnected } = require('../config/db');
const { getStore } = require('../config/memoryStore');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');

const LOCKED_STATUSES = ['PENDING', 'ACTIVE', 'DISPUTED'];
const STREAK_MILESTONE = () => Number(process.env.STREAK_MILESTONE_DAYS) || 7;

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

const plain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

const getInitials = (name = 'U') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const sanitizeText = (str = '') => String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();

const normalizeDomain = (domain = 'Technology') => {
  const d = String(domain).toLowerCase();
  if (d.includes('creative')) return 'Creative Arts';
  if (d.includes('language')) return 'Languages';
  if (d.includes('academic')) return 'Academics';
  return 'Technology';
};

const domainToCategory = (domain = 'Technology') => {
  const d = String(domain).toLowerCase();
  if (d.includes('creative')) return 'creative';
  if (d.includes('language')) return 'languages';
  if (d.includes('academic')) return 'academic';
  return 'technology';
};

const normalizeLevel = (level) => {
  const upper = String(level || '').toUpperCase();
  return ['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(upper) ? upper : 'INTERMEDIATE';
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Data-access helpers (single code path for MongoDB and in-memory store)
// ---------------------------------------------------------------------------
const getUserDoc = async (userId) => {
  const user = isMongoConnected()
    ? await User.findById(userId)
    : getStore().users.find((u) => String(u._id) === String(userId));
  if (!user) throw httpError(404, 'USER_NOT_FOUND', 'User not found.');
  return user;
};

const getProfileDoc = async (userId) => {
  const profile = isMongoConnected()
    ? await UserProfile.findOne({ userId })
    : getStore().userProfiles.find((p) => String(p.userId) === String(userId));
  if (!profile) throw httpError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return profile;
};

const saveDoc = async (doc) => {
  if (isMongoConnected() && doc && typeof doc.save === 'function') await doc.save();
};

const findSessions = async (predicate, mongoQuery) => {
  if (isMongoConnected()) return (await Session.find(mongoQuery)).map(plain);
  return getStore().sessions.filter(predicate);
};

const computeLockedInEscrow = async (userId) => {
  const sessions = await findSessions(
    (s) => String(s.learnerId) === String(userId) && LOCKED_STATUSES.includes(s.status),
    { learnerId: userId, status: { $in: LOCKED_STATUSES } }
  );
  return sessions.reduce((sum, s) => sum + (s.creditsLocked || 50), 0);
};

const listTransactions = async (userId) => {
  if (isMongoConnected()) {
    return (await Transaction.find({ userId }).sort({ createdAt: -1 })).map(plain);
  }
  return getStore()
    .transactions.filter((t) => String(t.userId) === String(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getAllProfiles = async () => {
  if (isMongoConnected()) return (await UserProfile.find({})).map(plain);
  return getStore().userProfiles;
};

const getBannedIds = async () => {
  const users = isMongoConnected()
    ? await User.find({ isBanned: true }).select('_id')
    : getStore().users.filter((u) => u.isBanned);
  return new Set(users.map((u) => String(u._id)));
};

const upcomingAvailability = (availability = []) =>
  availability
    .map(plain)
    .filter((a) => a.date >= todayISO() && Array.isArray(a.slots) && a.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

const toMentorCard = (p) => {
  const primaryDomain = p.skillsHave?.[0]?.domain || 'Technology';
  return {
    _id: String(p.userId),
    userId: String(p.userId),
    name: p.displayName,
    displayName: p.displayName,
    initials: getInitials(p.displayName),
    bio: p.bio,
    rating: p.rating,
    sessions: p.totalSessions,
    totalSessions: p.totalSessions,
    domain: primaryDomain,
    category: domainToCategory(primaryDomain),
    skillsHave: (p.skillsHave || []).map((s) => s.skill),
    skillsWant: (p.skillsWant || []).map((s) => s.skill),
    skillsHaveDetailed: (p.skillsHave || []).map(plain),
    skillsWantDetailed: (p.skillsWant || []).map(plain),
    availability: upcomingAvailability(p.availability)
  };
};

// ---------------------------------------------------------------------------
// Feature #8: POST /api/profile
// ---------------------------------------------------------------------------
const initializeProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { displayName, bio } = req.body || {};

    try {
      const existing = await getProfileDoc(userId);
      return res.status(200).json({ success: true, profile: plain(existing) });
    } catch (_) {
      // not found -> create below
    }

    const data = {
      userId,
      displayName: sanitizeText(displayName || 'SkillSwap User').slice(0, 60),
      bio: sanitizeText(bio || 'Passionate peer learner and mentor on SkillSwap.').slice(0, 500),
      skillsHave: [],
      skillsWant: [],
      availability: [],
      rating: 5.0,
      totalSessions: 0
    };

    let profile;
    if (isMongoConnected()) {
      profile = plain(await UserProfile.create(data));
    } else {
      profile = { _id: require('../config/memoryStore').generateId(), ...data };
      getStore().userProfiles.push(profile);
    }
    return res.status(201).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// Feature #9: GET /api/profile/me
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = plain(await getUserDoc(userId));
    const profile = plain(await getProfileDoc(userId));
    const lockedInEscrow = await computeLockedInEscrow(userId);
    const transactions = await listTransactions(userId);
    const streakProgress = (user.streakCount || 0) - (user.streakBonusClaimedAtCount || 0);

    return res.status(200).json({
      success: true,
      profile: {
        _id: String(profile._id),
        userId: String(user._id),
        displayName: profile.displayName,
        initials: getInitials(profile.displayName),
        email: user.email,
        bio: profile.bio,
        role: user.role,
        credits: user.credits,
        availableCredits: user.credits,
        lockedInEscrow,
        streakCount: user.streakCount,
        streakBonusEligible: streakProgress >= STREAK_MILESTONE(),
        streakDaysToNextBonus: Math.max(0, STREAK_MILESTONE() - streakProgress),
        rating: profile.rating,
        totalSessions: profile.totalSessions,
        skillsHave: (profile.skillsHave || []).map(plain),
        skillsWant: (profile.skillsWant || []).map(plain),
        availability: (profile.availability || [])
          .map(plain)
          .sort((a, b) => a.date.localeCompare(b.date)),
        joinedAt: user.createdAt,
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #10: GET /api/profile/:userId (public)
const getPublicProfile = async (req, res, next) => {
  try {
    const profile = plain(await getProfileDoc(req.params.userId));
    return res.status(200).json({ success: true, profile: toMentorCard(profile) });
  } catch (err) {
    next(err);
  }
};

// Feature #11: PUT /api/profile/bio
const updateBio = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body || {};
    const profile = await getProfileDoc(req.user.userId);

    if (displayName !== undefined) {
      const cleanName = sanitizeText(displayName).slice(0, 60);
      if (cleanName.length < 2) {
        throw httpError(400, 'VALIDATION_ERROR', 'Display name must be at least 2 characters.');
      }
      profile.displayName = cleanName;
    }
    if (bio !== undefined) profile.bio = sanitizeText(bio).slice(0, 500);

    await saveDoc(profile);
    return res.status(200).json({
      success: true,
      profile: { displayName: profile.displayName, bio: profile.bio }
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Features #12–#19: Skills I Have / Skills I Want CRUD (shared factory)
// ---------------------------------------------------------------------------
const makeSkillHandlers = (field) => {
  const add = async (req, res, next) => {
    try {
      const { skill, domain, level } = req.body || {};
      const name = sanitizeText(skill || '').slice(0, 60);
      if (!name) throw httpError(400, 'VALIDATION_ERROR', 'Skill name is required.');

      const profile = await getProfileDoc(req.user.userId);
      const duplicate = profile[field].some((s) => s.skill.toLowerCase() === name.toLowerCase());
      if (duplicate) throw httpError(400, 'DUPLICATE_SKILL', `"${name}" is already in your list.`);

      profile[field].push({
        _id: require('../config/memoryStore').generateId(),
        skill: name,
        domain: normalizeDomain(domain),
        level: normalizeLevel(level)
      });
      await saveDoc(profile);
      return res.status(201).json({ success: true, [field]: profile[field].map(plain) });
    } catch (err) {
      next(err);
    }
  };

  const list = async (req, res, next) => {
    try {
      const profile = await getProfileDoc(req.user.userId);
      return res.status(200).json({ success: true, [field]: profile[field].map(plain) });
    } catch (err) {
      next(err);
    }
  };

  const update = async (req, res, next) => {
    try {
      const { level, skill, domain } = req.body || {};
      const profile = await getProfileDoc(req.user.userId);
      const item = profile[field].find((s) => String(s._id) === String(req.params.skillId));
      if (!item) throw httpError(404, 'SKILL_NOT_FOUND', 'Skill not found.');

      if (level) item.level = normalizeLevel(level);
      if (skill) item.skill = sanitizeText(skill).slice(0, 60);
      if (domain) item.domain = normalizeDomain(domain);
      await saveDoc(profile);
      return res.status(200).json({ success: true, [field]: profile[field].map(plain) });
    } catch (err) {
      next(err);
    }
  };

  const remove = async (req, res, next) => {
    try {
      const profile = await getProfileDoc(req.user.userId);
      const before = profile[field].length;
      profile[field] = profile[field].filter((s) => String(s._id) !== String(req.params.skillId));
      if (profile[field].length === before) throw httpError(404, 'SKILL_NOT_FOUND', 'Skill not found.');
      await saveDoc(profile);
      return res.status(200).json({ success: true, [field]: profile[field].map(plain) });
    } catch (err) {
      next(err);
    }
  };

  return { add, list, update, remove };
};

const skillsHaveHandlers = makeSkillHandlers('skillsHave');
const skillsWantHandlers = makeSkillHandlers('skillsWant');

// ---------------------------------------------------------------------------
// Features #20–#23: Mentor Availability CRUD
// ---------------------------------------------------------------------------
const SLOT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateDate = (date) => {
  if (!DATE_REGEX.test(String(date || ''))) {
    throw httpError(400, 'VALIDATION_ERROR', 'Date must use the YYYY-MM-DD format.');
  }
  if (date < todayISO()) throw httpError(400, 'VALIDATION_ERROR', 'Availability date cannot be in the past.');
};

const validateSlots = (slots) => {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw httpError(400, 'VALIDATION_ERROR', 'At least one 1-hour slot (e.g. "14:00-15:00") is required.');
  }
  slots.forEach((slot) => {
    const m = SLOT_REGEX.exec(slot);
    if (!m) throw httpError(400, 'VALIDATION_ERROR', `Invalid slot "${slot}". Use HH:MM-HH:MM.`);
    const start = Number(m[1]) * 60 + Number(m[2]);
    const end = Number(m[3]) * 60 + Number(m[4]);
    if (end - start !== 60) throw httpError(400, 'VALIDATION_ERROR', `Slot "${slot}" must be exactly 1 hour.`);
  });
  return [...new Set(slots)].sort();
};

const sortedAvailability = (profile) =>
  profile.availability.map(plain).sort((a, b) => a.date.localeCompare(b.date));

// Feature #20: POST /api/profile/availability (merges into an existing day)
const addAvailability = async (req, res, next) => {
  try {
    const { date, slots } = req.body || {};
    validateDate(date);
    const cleanSlots = validateSlots(slots);

    const profile = await getProfileDoc(req.user.userId);
    const existingDay = profile.availability.find((a) => a.date === date);
    if (existingDay) {
      existingDay.slots = [...new Set([...existingDay.slots, ...cleanSlots])].sort();
    } else {
      profile.availability.push({ _id: require('../config/memoryStore').generateId(), date, slots: cleanSlots });
    }
    await saveDoc(profile);
    return res.status(201).json({ success: true, availability: sortedAvailability(profile) });
  } catch (err) {
    next(err);
  }
};

// Feature #21: GET /api/profile/:userId/availability (future, unbooked slots only)
const getAvailability = async (req, res, next) => {
  try {
    const profile = await getProfileDoc(req.params.userId);
    return res.status(200).json({ success: true, availability: upcomingAvailability(profile.availability) });
  } catch (err) {
    next(err);
  }
};

// Feature #22: PUT /api/profile/availability/:slotId
const updateAvailability = async (req, res, next) => {
  try {
    const { date, slots } = req.body || {};
    const profile = await getProfileDoc(req.user.userId);
    const day = profile.availability.find((a) => String(a._id) === String(req.params.slotId));
    if (!day) throw httpError(404, 'SLOT_NOT_FOUND', 'Availability slot not found.');

    if (date !== undefined) {
      validateDate(date);
      day.date = date;
    }
    if (slots !== undefined) day.slots = validateSlots(slots);
    await saveDoc(profile);
    return res.status(200).json({ success: true, availability: sortedAvailability(profile) });
  } catch (err) {
    next(err);
  }
};

// Feature #23: DELETE /api/profile/availability/:slotId[?slot=HH:MM-HH:MM]
const deleteAvailability = async (req, res, next) => {
  try {
    const { slot } = req.query;
    const profile = await getProfileDoc(req.user.userId);
    const day = profile.availability.find((a) => String(a._id) === String(req.params.slotId));
    if (!day) throw httpError(404, 'SLOT_NOT_FOUND', 'Availability slot not found.');

    if (slot) {
      day.slots = day.slots.filter((s) => s !== slot);
    }
    if (!slot || day.slots.length === 0) {
      profile.availability = profile.availability.filter((a) => String(a._id) !== String(req.params.slotId));
    }
    await saveDoc(profile);
    return res.status(200).json({ success: true, availability: sortedAvailability(profile) });
  } catch (err) {
    next(err);
  }
};

// Feature #38: GET /api/profile/:userId/reviews
const getMentorReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const sessions = await findSessions(
      (s) => String(s.mentorId) === String(userId) && s.status === 'COMPLETED' && s.feedback?.rating,
      { mentorId: userId, status: 'COMPLETED', 'feedback.rating': { $exists: true } }
    );

    const profiles = await getAllProfiles();
    const nameOf = (id) => profiles.find((p) => String(p.userId) === String(id))?.displayName || 'Learner';

    const reviews = sessions
      .map((s) => ({
        sessionId: String(s._id),
        skillName: s.skillName,
        learnerName: nameOf(s.learnerId),
        rating: s.feedback.rating,
        comment: s.feedback.comment || '',
        submittedAt: s.feedback.submittedAt || s.completedAt
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// Features #24, #25, #26: GET /api/marketplace
const getMarketplace = async (req, res, next) => {
  try {
    const { domain, category, search, page = 1, limit = 50 } = req.query;
    const filterVal = String(domain || category || 'all').toLowerCase().trim();
    const searchVal = String(search || '').toLowerCase().trim();
    const currentUserId = req.user ? String(req.user.userId) : null;

    const bannedIds = await getBannedIds();
    let profiles = (await getAllProfiles()).filter(
      (p) =>
        !bannedIds.has(String(p.userId)) &&
        String(p.userId) !== currentUserId &&
        (p.skillsHave || []).length > 0
    );

    if (filterVal !== 'all') {
      const wanted = domainToCategory(filterVal);
      profiles = profiles.filter((p) => p.skillsHave.some((s) => domainToCategory(s.domain) === wanted));
    }

    if (searchVal) {
      profiles = profiles.filter(
        (p) =>
          p.displayName.toLowerCase().includes(searchVal) ||
          p.skillsHave.some(
            (s) => s.skill.toLowerCase().includes(searchVal) || s.domain.toLowerCase().includes(searchVal)
          ) ||
          (p.skillsWant || []).some((s) => s.skill.toLowerCase().includes(searchVal))
      );
    }

    profiles.sort((a, b) => b.rating - a.rating || b.totalSessions - a.totalSessions);

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 50));
    const paged = profiles.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    return res.status(200).json({
      success: true,
      total: profiles.length,
      page: pageNum,
      mentors: paged.map(toMentorCard)
    });
  } catch (err) {
    next(err);
  }
};

// Feature #27: GET /api/marketplace/matches
// Perfect barter = they teach what I want AND want what I teach (readme definition).
// One-way matches are returned separately and clearly labelled.
const getBarterMatches = async (req, res, next) => {
  try {
    const userId = String(req.user.userId);
    const myProfile = plain(await getProfileDoc(userId));
    const lower = (arr) => new Set((arr || []).map((s) => s.skill.toLowerCase()));
    const myWant = lower(myProfile.skillsWant);
    const myHave = lower(myProfile.skillsHave);

    const bannedIds = await getBannedIds();
    const candidates = (await getAllProfiles()).filter(
      (p) => String(p.userId) !== userId && !bannedIds.has(String(p.userId))
    );

    const perfect = [];
    const oneWay = [];

    candidates.forEach((p) => {
      const theyTeach = (p.skillsHave || []).filter((s) => myWant.has(s.skill.toLowerCase())).map((s) => s.skill);
      const theyWant = (p.skillsWant || []).filter((s) => myHave.has(s.skill.toLowerCase())).map((s) => s.skill);
      if (theyTeach.length === 0 && theyWant.length === 0) return;

      const card = { ...toMentorCard(p), matchDetails: { theyTeach, theyWant } };
      if (theyTeach.length > 0 && theyWant.length > 0) perfect.push({ ...card, matchType: 'PERFECT' });
      else if (theyTeach.length > 0 && (p.skillsHave || []).length > 0) oneWay.push({ ...card, matchType: 'THEY_TEACH' });
      else oneWay.push({ ...card, matchType: 'THEY_WANT' });
    });

    return res.status(200).json({ success: true, matches: perfect, oneWayMatches: oneWay });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initializeProfile,
  getMyProfile,
  getPublicProfile,
  updateBio,
  addSkillHave: skillsHaveHandlers.add,
  getSkillsHave: skillsHaveHandlers.list,
  updateSkillHave: skillsHaveHandlers.update,
  deleteSkillHave: skillsHaveHandlers.remove,
  addSkillWant: skillsWantHandlers.add,
  getSkillsWant: skillsWantHandlers.list,
  updateSkillWant: skillsWantHandlers.update,
  deleteSkillWant: skillsWantHandlers.remove,
  addAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getMentorReviews,
  getMarketplace,
  getBarterMatches,
  // shared helpers for other controllers
  computeLockedInEscrow,
  listTransactions,
  getInitials,
  httpError,
  plain
};
