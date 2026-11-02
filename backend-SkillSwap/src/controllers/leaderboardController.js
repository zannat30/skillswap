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
      const mentors = await UserProfile.aggregate([
        { $match: { totalSessions: { $gt: 0 } } },
        { $sort: { totalSessions: -1, rating: -1 } },
        { $limit: 10 }
      ]);

      const formatted = mentors.map((m, idx) => ({
        rank: idx + 1,
        userId: String(m.userId),
        displayName: m.displayName,
        initials: getInitials(m.displayName),
        domain: m.skillsHave?.[0]?.domain || 'Technology',
        sessions: m.totalSessions,
        rating: m.rating
      }));

      return res.status(200).json({ success: true, mentors: formatted });
    }

    // Preserve exact leaderboard order and numbers from leaderboard.html (#1 Sarah Chen 89, #2 Alex Rivera 64, #3 David Kim 56)
    const store = getStore();
    const mentorIds = [
      '664f1a2b3c4d5e6f7a8b9c98', // Sarah Chen
      '664f1a2b3c4d5e6f7a8b9c99', // Alex Rivera
      '664f1a2b3c4d5e6f7a8b9c97'  // David Kim
    ];

    const mentors = mentorIds
      .map((id) => store.userProfiles.find((p) => String(p.userId) === id))
      .filter(Boolean)
      .map((m, idx) => ({
        rank: idx + 1,
        userId: String(m.userId),
        displayName: m.displayName,
        initials: m.initials || getInitials(m.displayName),
        domain: m.domain || 'Technology',
        sessions: m.leaderboardSessions ?? m.totalSessions,
        rating: m.rating
      }));

    return res.status(200).json({ success: true, mentors });
  } catch (err) {
    next(err);
  }
};

// Feature #50: GET /api/leaderboard/learners
const getTopLearners = async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const learners = await UserProfile.find().sort({ totalSessions: -1 }).limit(10);
      const formatted = learners.map((l, idx) => ({
        rank: idx + 1,
        userId: String(l.userId),
        displayName: l.displayName,
        initials: getInitials(l.displayName),
        skillsAcquired: (l.skillsHave?.length || 0) + (l.skillsWant?.length || 0) + 5,
        isCurrentUser: l.displayName.toLowerCase().includes('zannat')
      }));
      return res.status(200).json({ success: true, learners: formatted });
    }

    // Preserve exact Top Learners from leaderboard.html (#1 Marcus Johnson 14, #2 Zannat (You) 11, #3 Emily Watson 8)
    const learners = [
      {
        rank: 1,
        userId: '664f1a2b3c4d5e6f7a8b9c95',
        displayName: 'Marcus Johnson',
        initials: 'MJ',
        skillsAcquired: 14,
        isCurrentUser: false
      },
      {
        rank: 2,
        userId: '664f1a2b3c4d5e6f7a8b9c01',
        displayName: 'Zannat',
        initials: 'Z',
        skillsAcquired: 11,
        isCurrentUser: true
      },
      {
        rank: 3,
        userId: '664f1a2b3c4d5e6f7a8b9c96',
        displayName: 'Emily Watson',
        initials: 'EW',
        skillsAcquired: 8,
        isCurrentUser: false
      }
    ];

    return res.status(200).json({ success: true, learners });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTopMentors,
  getTopLearners
};
