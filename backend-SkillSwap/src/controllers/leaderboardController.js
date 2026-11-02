const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { isMongoConnected } = require('../config/db');
const { getStore } = require('../config/memoryStore');

const getInitials = (name = 'U') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name).slice(0, 2).toUpperCase();
};

// Feature #49: GET /api/leaderboard/mentors
const getTopMentors = async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const adminUsers = await User.find({ $or: [{ role: 'ADMIN' }, { isBanned: true }] }).select('_id');
      const excludedIds = adminUsers.map((u) => u._id);

      const mentors = await UserProfile.aggregate([
        {
          $match: {
            userId: { $nin: excludedIds },
            'skillsHave.0': { $exists: true }
          }
        },
        { $sort: { totalSessions: -1, rating: -1 } },
        { $limit: 10 }
      ]);

      const formatted = mentors.map((m, idx) => ({
        rank: idx + 1,
        userId: String(m.userId),
        displayName: m.displayName,
        initials: getInitials(m.displayName),
        domain: m.skillsHave?.[0]?.domain || 'Technology',
        sessions: m.totalSessions || 0,
        rating: m.rating || 5.0
      }));

      return res.status(200).json({ success: true, mentors: formatted });
    }

    const store = getStore();
    const excludedIds = new Set(
      store.users
        .filter((u) => u.role === 'ADMIN' || u.isBanned)
        .map((u) => String(u._id))
    );

    const mentors = store.userProfiles
      .filter((p) => !excludedIds.has(String(p.userId)) && Array.isArray(p.skillsHave) && p.skillsHave.length > 0)
      .sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0) || (b.rating || 5) - (a.rating || 5))
      .slice(0, 10)
      .map((m, idx) => ({
        rank: idx + 1,
        userId: String(m.userId),
        displayName: m.displayName,
        initials: m.initials || getInitials(m.displayName),
        domain: m.skillsHave?.[0]?.domain || 'Technology',
        sessions: m.totalSessions || 0,
        rating: m.rating || 5.0
      }));

    return res.status(200).json({ success: true, mentors });
  } catch (err) {
    next(err);
  }
};

// Feature #50: GET /api/leaderboard/learners
const getTopLearners = async (req, res, next) => {
  try {
    const currentUserId = req.user ? String(req.user.userId) : '';

    if (isMongoConnected()) {
      const adminUsers = await User.find({ $or: [{ role: 'ADMIN' }, { isBanned: true }] }).select('_id');
      const excludedIds = adminUsers.map((u) => u._id);

      const learners = await UserProfile.find({
        userId: { $nin: excludedIds }
      })
        .sort({ skillsAcquiredCount: -1, totalSessions: -1 })
        .limit(10);

      const formatted = learners.map((l, idx) => ({
        rank: idx + 1,
        userId: String(l.userId),
        displayName: l.displayName,
        initials: getInitials(l.displayName),
        skillsAcquired: l.skillsAcquiredCount || (l.skillsWant?.length || 0),
        isCurrentUser: String(l.userId) === currentUserId
      }));
      return res.status(200).json({ success: true, learners: formatted });
    }

    const store = getStore();
    const excludedIds = new Set(
      store.users
        .filter((u) => u.role === 'ADMIN' || u.isBanned)
        .map((u) => String(u._id))
    );

    const learners = store.userProfiles
      .filter((p) => !excludedIds.has(String(p.userId)))
      .sort((a, b) => (b.skillsAcquiredCount || 0) - (a.skillsAcquiredCount || 0))
      .slice(0, 10)
      .map((l, idx) => ({
        rank: idx + 1,
        userId: String(l.userId),
        displayName: l.displayName,
        initials: l.initials || getInitials(l.displayName),
        skillsAcquired: l.skillsAcquiredCount || (l.skillsWant?.length || 0),
        isCurrentUser: String(l.userId) === currentUserId
      }));

    return res.status(200).json({ success: true, learners });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTopMentors,
  getTopLearners
};
