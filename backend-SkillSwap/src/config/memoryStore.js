const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generates a valid 24-char hex id so the same id format works for both
// the in-memory store and MongoDB ObjectId.
const generateId = () => crypto.randomBytes(12).toString('hex');
const oid = (prefix, n) => `${prefix}${String(n).padStart(24 - prefix.length, '0')}`;

const SUPER_ADMIN_PASS_HASH = bcrypt.hashSync('12345678', 10);

const IDS = {
  ADMIN: '664f1a2b3c4d5e6f7a8b9c00'
};

const createInitialState = () => {
  // Only 1 user by default: Super Admin (admin@admin.com / 12345678)
  // All mentors and students are created dynamically via Create Account (/register).
  const users = [
    {
      _id: IDS.ADMIN,
      email: 'admin@admin.com',
      passwordHash: SUPER_ADMIN_PASS_HASH,
      role: 'ADMIN',
      credits: 1000,
      streakCount: 1,
      streakBonusClaimedAtCount: 0,
      streakClaimedAt: null,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date()
    }
  ];

  const userProfiles = [
    {
      _id: oid('d0f1', 1),
      userId: IDS.ADMIN,
      displayName: 'Super Admin',
      bio: 'SkillSwap Platform Super Administrator.',
      skillsHave: [],
      skillsWant: [],
      availability: [],
      rating: 5.0,
      totalSessions: 0,
      leaderboardSessions: 0,
      skillsAcquiredCount: 0
    }
  ];

  const sessions = [];
  const transactions = [];
  const chatLogs = [];

  return { users, userProfiles, sessions, transactions, chatLogs };
};

let store = createInitialState();

const resetMemoryStore = () => {
  store = createInitialState();
  return store;
};

module.exports = {
  getStore: () => store,
  resetMemoryStore,
  generateId,
  IDS,
  SUPER_ADMIN_PASS_HASH
};
