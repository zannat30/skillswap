const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');

const sanitizeText = (str = '') =>
  String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

const getInitials = (name = 'U') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

const domainToCategory = (domain = 'Technology') => {
  const d = String(domain).toLowerCase();
  if (d.includes('creative')) return 'creative';
  if (d.includes('language')) return 'languages';
  if (d.includes('academic')) return 'academic';
  return 'technology';
};

const normalizeDomain = (domain = 'Technology') => {
  const d = String(domain).toLowerCase();
  if (d.includes('creative')) return 'Creative Arts';
  if (d.includes('language')) return 'Languages';
  if (d.includes('academic')) return 'Academics';
  return 'Technology';
};

// Feature #8: POST /api/profile
const initializeProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { displayName, bio } = req.body || {};

    if (isMongoConnected()) {
      let profile = await UserProfile.findOne({ userId });
      if (!profile) {
        profile = await UserProfile.create({
          userId,
          displayName: sanitizeText(displayName || 'SkillSwap User'),
          bio: sanitizeText(bio || 'Passionate peer learner and mentor on SkillSwap.'),
          skillsHave: [],
          skillsWant: [],
          availability: [],
          rating: 5.0,
          totalSessions: 0
        });
      }
      return res.status(201).json({ success: true, profile });
    }

    const store = getStore();
    let profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    if (!profile) {
      profile = {
        _id: generateId(),
        userId,
        displayName: sanitizeText(displayName || 'SkillSwap User'),
        initials: getInitials(displayName || 'U'),
        bio: sanitizeText(bio || 'Passionate peer learner and mentor on SkillSwap.'),
        category: 'technology',
        domain: 'Technology',
        skillsHave: [],
        skillsWant: [],
        availability: [],
        rating: 5.0,
        ratingCount: 1,
        totalSessions: 0
      };
      store.userProfiles.push(profile);
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

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      let profile = await UserProfile.findOne({ userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
        });
      }
      if (!profile) {
        profile = await UserProfile.create({
          userId,
          displayName: user.email.split('@')[0],
          skillsHave: [],
          skillsWant: [],
          availability: []
        });
      }

      const lockedSessions = await Session.find({
        learnerId: userId,
        status: { $in: ['PENDING', 'ACTIVE', 'DISPUTED'] }
      });
      const lockedInEscrow = lockedSessions.reduce((acc, s) => acc + (s.creditsLocked || 50), 0);
      const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

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
          rating: profile.rating,
          totalSessions: profile.totalSessions,
          skillsHave: profile.skillsHave,
          skillsWant: profile.skillsWant,
          availability: profile.availability,
          joinedAt: user.createdAt,
          transactions
        }
      });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId)) || store.users[0];
    const profile =
      store.userProfiles.find((p) => String(p.userId) === String(user._id)) || store.userProfiles[0];

    const lockedSessions = store.sessions.filter(
      (s) =>
        String(s.learnerId) === String(user._id) &&
        ['PENDING', 'ACTIVE', 'DISPUTED'].includes(s.status)
    );
    // Note: For the initial demo state where Zannat has 100 available CR and 0 locked in profile.html,
    // only count sessions explicitly created via booking or non-seed locks if needed, or compute dynamically:
    const lockedTxs = store.transactions.filter(
      (t) => String(t.userId) === String(user._id) && t.type === 'ESCROW_LOCK'
    );
    const lockedInEscrow =
      lockedTxs.length > 0
        ? lockedSessions.reduce((acc, s) => acc + (s.creditsLocked || 50), 0)
        : 0;

    const transactions = store.transactions.filter(
      (t) => String(t.userId) === String(user._id)
    );

    return res.status(200).json({
      success: true,
      profile: {
        _id: String(profile._id),
        userId: String(user._id),
        displayName: profile.displayName,
        initials: profile.initials || getInitials(profile.displayName),
        email: user.email,
        bio: profile.bio,
        role: user.role,
        credits: user.credits,
        availableCredits: user.credits,
        lockedInEscrow,
        streakCount: user.streakCount,
        rating: profile.rating,
        totalSessions: profile.totalSessions,
        skillsHave: profile.skillsHave,
        skillsWant: profile.skillsWant,
        availability: profile.availability,
        joinedAt: user.createdAt,
        transactions
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #10: GET /api/profile/:userId
const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (isMongoConnected()) {
      const profile =
        (await UserProfile.findOne({ userId })) || (await UserProfile.findById(userId));
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', httpStatus: 404, message: 'Mentor profile not found.' }
        });
      }
      return res.status(200).json({ success: true, profile });
    }

    const store = getStore();
    const profile = store.userProfiles.find(
      (p) => String(p.userId) === String(userId) || String(p._id) === String(userId)
    );
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', httpStatus: 404, message: 'Mentor profile not found.' }
      });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// Feature #11: PUT /api/profile/bio
const updateBio = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { displayName, bio } = req.body || {};

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', httpStatus: 404, message: 'Profile not found.' }
        });
      }
      if (displayName) profile.displayName = sanitizeText(displayName).slice(0, 60);
      if (bio !== undefined) profile.bio = sanitizeText(bio).slice(0, 500);
      await profile.save();
      return res.status(200).json({ success: true, profile });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROFILE_NOT_FOUND', httpStatus: 404, message: 'Profile not found.' }
      });
    }
    if (displayName) {
      profile.displayName = sanitizeText(displayName).slice(0, 60);
      profile.initials = getInitials(profile.displayName);
    }
    if (bio !== undefined) profile.bio = sanitizeText(bio).slice(0, 500);

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// Feature #12: POST /api/profile/skills-have
const addSkillHave = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skill, domain = 'Technology', level = 'INTERMEDIATE' } = req.body || {};

    if (!skill || !String(skill).trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', httpStatus: 400, message: 'Skill name is required.' }
      });
    }

    const skillItem = {
      _id: generateId(),
      skill: sanitizeText(skill),
      domain: normalizeDomain(domain),
      level: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(String(level).toUpperCase())
        ? String(level).toUpperCase()
        : 'INTERMEDIATE'
    };

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      profile.skillsHave.push({
        skill: skillItem.skill,
        domain: skillItem.domain,
        level: skillItem.level
      });
      await profile.save();
      return res.status(201).json({ success: true, skillsHave: profile.skillsHave });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.skillsHave.push(skillItem);
    return res.status(201).json({ success: true, skillsHave: profile.skillsHave });
  } catch (err) {
    next(err);
  }
};

// Feature #13: GET /api/profile/skills-have
const getSkillsHave = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      return res.status(200).json({ success: true, skillsHave: profile ? profile.skillsHave : [] });
    }
    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    return res.status(200).json({ success: true, skillsHave: profile ? profile.skillsHave : [] });
  } catch (err) {
    next(err);
  }
};

// Feature #14: PUT /api/profile/skills-have/:skillId
const updateSkillHave = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;
    const { level, skill, domain } = req.body || {};

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      const item = profile.skillsHave.id(skillId);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: 'SKILL_NOT_FOUND', httpStatus: 404, message: 'Skill not found.' }
        });
      }
      if (level) item.level = String(level).toUpperCase();
      if (skill) item.skill = sanitizeText(skill);
      if (domain) item.domain = normalizeDomain(domain);
      await profile.save();
      return res.status(200).json({ success: true, skillsHave: profile.skillsHave });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    const item = profile.skillsHave.find(
      (s) => String(s._id) === String(skillId) || s.skill.toLowerCase() === String(skillId).toLowerCase()
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'SKILL_NOT_FOUND', httpStatus: 404, message: 'Skill not found.' }
      });
    }
    if (level) item.level = String(level).toUpperCase();
    if (skill) item.skill = sanitizeText(skill);
    if (domain) item.domain = normalizeDomain(domain);
    return res.status(200).json({ success: true, skillsHave: profile.skillsHave });
  } catch (err) {
    next(err);
  }
};

// Feature #15: DELETE /api/profile/skills-have/:skillId
const deleteSkillHave = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;

    if (isMongoConnected()) {
      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { $pull: { skillsHave: { _id: skillId } } },
        { new: true }
      );
      return res.status(200).json({ success: true, skillsHave: profile.skillsHave });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.skillsHave = profile.skillsHave.filter(
      (s) => String(s._id) !== String(skillId) && s.skill.toLowerCase() !== String(skillId).toLowerCase()
    );
    return res.status(200).json({ success: true, skillsHave: profile.skillsHave });
  } catch (err) {
    next(err);
  }
};

// Feature #16: POST /api/profile/skills-want
const addSkillWant = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skill, domain = 'Technology', level = 'INTERMEDIATE' } = req.body || {};

    if (!skill || !String(skill).trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', httpStatus: 400, message: 'Skill name is required.' }
      });
    }

    const skillItem = {
      _id: generateId(),
      skill: sanitizeText(skill),
      domain: normalizeDomain(domain),
      level: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(String(level).toUpperCase())
        ? String(level).toUpperCase()
        : 'INTERMEDIATE'
    };

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      profile.skillsWant.push({
        skill: skillItem.skill,
        domain: skillItem.domain,
        level: skillItem.level
      });
      await profile.save();
      return res.status(201).json({ success: true, skillsWant: profile.skillsWant });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.skillsWant.push(skillItem);
    return res.status(201).json({ success: true, skillsWant: profile.skillsWant });
  } catch (err) {
    next(err);
  }
};

// Feature #17: GET /api/profile/skills-want
const getSkillsWant = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      return res.status(200).json({ success: true, skillsWant: profile ? profile.skillsWant : [] });
    }
    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    return res.status(200).json({ success: true, skillsWant: profile ? profile.skillsWant : [] });
  } catch (err) {
    next(err);
  }
};

// Feature #18: PUT /api/profile/skills-want/:skillId
const updateSkillWant = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;
    const { level, skill, domain } = req.body || {};

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      const item = profile.skillsWant.id(skillId);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: 'SKILL_NOT_FOUND', httpStatus: 404, message: 'Skill not found.' }
        });
      }
      if (level) item.level = String(level).toUpperCase();
      if (skill) item.skill = sanitizeText(skill);
      if (domain) item.domain = normalizeDomain(domain);
      await profile.save();
      return res.status(200).json({ success: true, skillsWant: profile.skillsWant });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    const item = profile.skillsWant.find(
      (s) => String(s._id) === String(skillId) || s.skill.toLowerCase() === String(skillId).toLowerCase()
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'SKILL_NOT_FOUND', httpStatus: 404, message: 'Skill not found.' }
      });
    }
    if (level) item.level = String(level).toUpperCase();
    if (skill) item.skill = sanitizeText(skill);
    if (domain) item.domain = normalizeDomain(domain);
    return res.status(200).json({ success: true, skillsWant: profile.skillsWant });
  } catch (err) {
    next(err);
  }
};

// Feature #19: DELETE /api/profile/skills-want/:skillId
const deleteSkillWant = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;

    if (isMongoConnected()) {
      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { $pull: { skillsWant: { _id: skillId } } },
        { new: true }
      );
      return res.status(200).json({ success: true, skillsWant: profile.skillsWant });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.skillsWant = profile.skillsWant.filter(
      (s) => String(s._id) !== String(skillId) && s.skill.toLowerCase() !== String(skillId).toLowerCase()
    );
    return res.status(200).json({ success: true, skillsWant: profile.skillsWant });
  } catch (err) {
    next(err);
  }
};

// Feature #20: POST /api/profile/availability
const addAvailability = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { date, slots } = req.body || {};
    if (!date || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          httpStatus: 400,
          message: 'Date (YYYY-MM-DD) and an array of 1-hour slots are required.'
        }
      });
    }

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      profile.availability.push({ date, slots });
      await profile.save();
      return res.status(201).json({ success: true, availability: profile.availability });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.availability.push({ _id: generateId(), date, slots });
    return res.status(201).json({ success: true, availability: profile.availability });
  } catch (err) {
    next(err);
  }
};

// Feature #21: GET /api/profile/:userId/availability
const getAvailability = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      return res.status(200).json({
        success: true,
        availability: profile ? profile.availability : []
      });
    }
    const store = getStore();
    const profile = store.userProfiles.find(
      (p) => String(p.userId) === String(userId) || String(p._id) === String(userId)
    );
    return res.status(200).json({
      success: true,
      availability: profile ? profile.availability : []
    });
  } catch (err) {
    next(err);
  }
};

// Feature #22: PUT /api/profile/availability/:slotId
const updateAvailability = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { slotId } = req.params;
    const { date, slots } = req.body || {};

    if (isMongoConnected()) {
      const profile = await UserProfile.findOne({ userId });
      const slot = profile.availability.id(slotId);
      if (!slot) {
        return res.status(404).json({
          success: false,
          error: { code: 'SLOT_NOT_FOUND', httpStatus: 404, message: 'Availability slot not found.' }
        });
      }
      if (date) slot.date = date;
      if (Array.isArray(slots)) slot.slots = slots;
      await profile.save();
      return res.status(200).json({ success: true, availability: profile.availability });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    const slot = profile.availability.find((a) => String(a._id) === String(slotId));
    if (!slot) {
      return res.status(404).json({
        success: false,
        error: { code: 'SLOT_NOT_FOUND', httpStatus: 404, message: 'Availability slot not found.' }
      });
    }
    if (date) slot.date = date;
    if (Array.isArray(slots)) slot.slots = slots;
    return res.status(200).json({ success: true, availability: profile.availability });
  } catch (err) {
    next(err);
  }
};

// Feature #23: DELETE /api/profile/availability/:slotId
const deleteAvailability = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { slotId } = req.params;

    if (isMongoConnected()) {
      const profile = await UserProfile.findOneAndUpdate(
        { userId },
        { $pull: { availability: { _id: slotId } } },
        { new: true }
      );
      return res.status(200).json({ success: true, availability: profile.availability });
    }

    const store = getStore();
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    profile.availability = profile.availability.filter((a) => String(a._id) !== String(slotId));
    return res.status(200).json({ success: true, availability: profile.availability });
  } catch (err) {
    next(err);
  }
};

// Feature #38: GET /api/profile/:userId/reviews
const getMentorReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (isMongoConnected()) {
      const completed = await Session.find({
        mentorId: userId,
        status: 'COMPLETED',
        'feedback.rating': { $exists: true }
      }).sort({ completedAt: -1 });
      const reviews = completed.map((s) => ({
        sessionId: s._id,
        skillName: s.skillName,
        rating: s.feedback.rating,
        comment: s.feedback.comment,
        submittedAt: s.feedback.submittedAt || s.completedAt
      }));
      return res.status(200).json({ success: true, reviews });
    }

    const store = getStore();
    const completed = store.sessions.filter(
      (s) => String(s.mentorId) === String(userId) && s.status === 'COMPLETED' && s.feedback
    );
    const reviews = completed.map((s) => ({
      sessionId: s._id,
      skillName: s.skillName,
      rating: s.feedback.rating,
      comment: s.feedback.comment,
      submittedAt: s.feedback.submittedAt || s.completedAt
    }));
    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
};

// Feature #24, #25, #26: GET /api/marketplace
const getMarketplace = async (req, res, next) => {
  try {
    const { domain, category, search, page = 1, limit = 20 } = req.query;
    const filterVal = (domain || category || 'all').toLowerCase().trim();
    const searchVal = (search || '').toLowerCase().trim();

    if (isMongoConnected()) {
      const bannedUsers = await User.find({ isBanned: true }).select('_id');
      const bannedIds = bannedUsers.map((u) => u._id);

      const query = {
        userId: { $nin: bannedIds },
        'skillsHave.0': { $exists: true }
      };

      if (filterVal && filterVal !== 'all') {
        const mappedDomain = normalizeDomain(filterVal);
        query['skillsHave.domain'] = mappedDomain;
      }

      if (searchVal) {
        query.$or = [
          { displayName: { $regex: searchVal, $options: 'i' } },
          { 'skillsHave.skill': { $regex: searchVal, $options: 'i' } },
          { 'skillsHave.domain': { $regex: searchVal, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const profiles = await UserProfile.find(query)
        .sort({ totalSessions: -1, rating: -1 })
        .skip(skip)
        .limit(Number(limit));

      const mentors = profiles.map((p) => {
        const primaryDomain = p.skillsHave[0]?.domain || 'Technology';
        return {
          _id: String(p.userId),
          userId: String(p.userId),
          name: p.displayName,
          displayName: p.displayName,
          initials: getInitials(p.displayName),
          rating: p.rating,
          sessions: p.totalSessions,
          totalSessions: p.totalSessions,
          domain: primaryDomain,
          category: domainToCategory(primaryDomain),
          skillsHave: p.skillsHave.map((s) => s.skill),
          skillsWant: p.skillsWant.map((s) => s.skill),
          skillsHaveDetailed: p.skillsHave,
          skillsWantDetailed: p.skillsWant,
          availability: p.availability
        };
      });

      return res.status(200).json({ success: true, mentors });
    }

    const store = getStore();
    const bannedIds = new Set(
      store.users.filter((u) => u.isBanned).map((u) => String(u._id))
    );

    // Filter out banned users and select active mentors (Alex Rivera, Sarah Chen, David Kim, Emily Watson, plus any newly added mentors)
    let profiles = store.userProfiles.filter(
      (p) =>
        !bannedIds.has(String(p.userId)) &&
        String(p.userId) !== '664f1a2b3c4d5e6f7a8b9c01' &&
        String(p.userId) !== '664f1a2b3c4d5e6f7a8b9c95' &&
        p.skillsHave &&
        p.skillsHave.length > 0
    );

    if (filterVal && filterVal !== 'all') {
      profiles = profiles.filter((p) => {
        const cat = (p.category || domainToCategory(p.domain)).toLowerCase();
        const dom = (p.domain || 'Technology').toLowerCase();
        return (
          cat === filterVal ||
          dom === filterVal ||
          dom.includes(filterVal) ||
          p.skillsHave.some((s) => s.domain.toLowerCase().includes(filterVal))
        );
      });
    }

    if (searchVal) {
      profiles = profiles.filter((p) => {
        const inName = p.displayName.toLowerCase().includes(searchVal);
        const inDomain = (p.domain || '').toLowerCase().includes(searchVal);
        const inHave = p.skillsHave.some((s) => s.skill.toLowerCase().includes(searchVal));
        const inWant = p.skillsWant.some((s) => s.skill.toLowerCase().includes(searchVal));
        return inName || inDomain || inHave || inWant;
      });
    }

    const mentors = profiles.map((p) => ({
      _id: String(p.userId),
      userId: String(p.userId),
      name: p.displayName,
      displayName: p.displayName,
      initials: p.initials || getInitials(p.displayName),
      rating: p.rating,
      sessions: p.totalSessions,
      totalSessions: p.totalSessions,
      domain: p.domain || 'Technology',
      category: p.category || domainToCategory(p.domain),
      skillsHave: p.skillsHave.map((s) => (typeof s === 'string' ? s : s.skill)),
      skillsWant: p.skillsWant.map((s) => (typeof s === 'string' ? s : s.skill)),
      skillsHaveDetailed: p.skillsHave,
      skillsWantDetailed: p.skillsWant,
      availability: p.availability || []
    }));

    return res.status(200).json({ success: true, mentors });
  } catch (err) {
    next(err);
  }
};

// Feature #27: GET /api/marketplace/matches (Bidirectional Barter Matchmaking)
const getBarterMatches = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const myProfile = await UserProfile.findOne({ userId });
      if (!myProfile) {
        return res.status(200).json({ success: true, matches: [] });
      }
      const myWantNames = myProfile.skillsWant.map((s) => s.skill);
      const myHaveNames = myProfile.skillsHave.map((s) => s.skill);

      const matches = await UserProfile.find({
        userId: { $ne: userId },
        $or: [
          { 'skillsHave.skill': { $in: myWantNames } },
          { 'skillsWant.skill': { $in: myHaveNames } }
        ]
      });

      return res.status(200).json({ success: true, matches });
    }

    const store = getStore();
    const myProfile =
      store.userProfiles.find((p) => String(p.userId) === String(userId)) || store.userProfiles[0];
    const myWantSet = new Set(myProfile.skillsWant.map((s) => s.skill.toLowerCase()));
    const myHaveSet = new Set(myProfile.skillsHave.map((s) => s.skill.toLowerCase()));

    const matches = store.userProfiles
      .filter((p) => String(p.userId) !== String(myProfile.userId))
      .filter((p) => {
        const teachesWhatIWant = p.skillsHave.some((s) => myWantSet.has(s.skill.toLowerCase()));
        const wantsWhatITeach = p.skillsWant.some((s) => myHaveSet.has(s.skill.toLowerCase()));
        return teachesWhatIWant || wantsWhatITeach;
      })
      .map((p) => ({
        _id: String(p.userId),
        userId: String(p.userId),
        name: p.displayName,
        displayName: p.displayName,
        initials: p.initials || getInitials(p.displayName),
        rating: p.rating,
        sessions: p.totalSessions,
        totalSessions: p.totalSessions,
        domain: p.domain || 'Technology',
        category: p.category || domainToCategory(p.domain),
        skillsHave: p.skillsHave.map((s) => s.skill),
        skillsWant: p.skillsWant.map((s) => s.skill)
      }));

    return res.status(200).json({ success: true, matches });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initializeProfile,
  getMyProfile,
  getPublicProfile,
  updateBio,
  addSkillHave,
  getSkillsHave,
  updateSkillHave,
  deleteSkillHave,
  addSkillWant,
  getSkillsWant,
  updateSkillWant,
  deleteSkillWant,
  addAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getMentorReviews,
  getMarketplace,
  getBarterMatches
};
