const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generates a valid 24-char hex id so the same seed works for both the
// in-memory store and MongoDB (Mongoose casts these to ObjectId).
const generateId = () => crypto.randomBytes(12).toString('hex');
const oid = (prefix, n) => `${prefix}${String(n).padStart(24 - prefix.length, '0')}`;

const DEFAULT_PASS_HASH = bcrypt.hashSync('StrongPassword123!', 10);

// Stable ids used across seed, tests and demo account switcher
const IDS = {
  ZANNAT: '664f1a2b3c4d5e6f7a8b9c01',
  ALEX: '664f1a2b3c4d5e6f7a8b9c99',
  SARAH: '664f1a2b3c4d5e6f7a8b9c98',
  DAVID: '664f1a2b3c4d5e6f7a8b9c97',
  EMILY: '664f1a2b3c4d5e6f7a8b9c96',
  MARCUS: '664f1a2b3c4d5e6f7a8b9c95',
  ADMIN: '664f1a2b3c4d5e6f7a8b9c00',
  SEED_SESSION: '665099aabbccddeeff001122'
};

const skill = (n, name, domain, level) => ({ _id: oid('5a11', n), skill: name, domain, level });
const slotDay = (n, date, slots) => ({ _id: oid('a7a1', n), date, slots });

const makeUser = (_id, email, extra = {}) => ({
  _id,
  email,
  passwordHash: DEFAULT_PASS_HASH,
  role: 'USER',
  credits: 100,
  streakCount: 1,
  streakBonusClaimedAtCount: 0,
  streakClaimedAt: null,
  lastLogin: new Date(),
  isBanned: false,
  createdAt: new Date('2026-07-01T10:00:00.000Z'),
  ...extra
});

const createInitialState = () => {
  const users = [
    // Zannat: +100 registration bonus, then booked the React.js session (-50 locked in escrow)
    makeUser(IDS.ZANNAT, 'zannat@ist.edu.bd', {
      credits: 50,
      streakCount: 7,
      createdAt: new Date('2026-08-15T10:00:00.000Z')
    }),
    makeUser(IDS.ALEX, 'alex.rivera@skillswap.io', { credits: 450, streakCount: 12, createdAt: new Date('2026-06-10T10:00:00.000Z') }),
    makeUser(IDS.SARAH, 'sarah.chen@skillswap.io', { credits: 520, streakCount: 9, createdAt: new Date('2026-06-12T10:00:00.000Z') }),
    makeUser(IDS.DAVID, 'david.kim@skillswap.io', { credits: 310, streakCount: 5 }),
    makeUser(IDS.EMILY, 'emily.watson@skillswap.io', { credits: 280, streakCount: 4, createdAt: new Date('2026-07-18T10:00:00.000Z') }),
    makeUser(IDS.MARCUS, 'marcus.johnson@skillswap.io', { credits: 190, streakCount: 6, createdAt: new Date('2026-07-22T10:00:00.000Z') }),
    makeUser(IDS.ADMIN, 'admin@skillswap.io', { role: 'ADMIN', credits: 1000, streakCount: 30, createdAt: new Date('2026-06-01T10:00:00.000Z') })
  ];

  const userProfiles = [
    {
      _id: oid('d0f1', 1),
      userId: IDS.ZANNAT,
      displayName: 'Zannat',
      bio: 'Passionate peer learner and mentor on SkillSwap.',
      skillsHave: [
        skill(1, 'React.js', 'Technology', 'EXPERT'),
        skill(2, 'CSS', 'Technology', 'INTERMEDIATE')
      ],
      skillsWant: [
        skill(3, 'Python', 'Technology', 'INTERMEDIATE'),
        skill(4, 'Machine Learning', 'Technology', 'INTERMEDIATE')
      ],
      availability: [slotDay(1, '2026-11-10', ['14:00-15:00', '16:00-17:00'])],
      rating: 5.0,
      totalSessions: 25,
      skillsAcquiredCount: 11
    },
    {
      _id: oid('d0f1', 2),
      userId: IDS.ALEX,
      displayName: 'Alex Rivera',
      bio: 'Senior Full-Stack Engineer specializing in React.js and Node.js distributed systems.',
      skillsHave: [
        skill(5, 'React.js', 'Technology', 'EXPERT'),
        skill(6, 'Node.js', 'Technology', 'EXPERT')
      ],
      skillsWant: [skill(7, 'UI/UX Design', 'Creative Arts', 'INTERMEDIATE')],
      availability: [
        slotDay(2, '2026-11-10', ['14:00-15:00', '18:00-19:00']),
        slotDay(3, '2026-11-11', ['15:00-16:00'])
      ],
      rating: 4.9,
      totalSessions: 124,
      leaderboardSessions: 64,
      skillsAcquiredCount: 6
    },
    {
      _id: oid('d0f1', 3),
      userId: IDS.SARAH,
      displayName: 'Sarah Chen',
      bio: 'Product Designer & Design Systems Architect teaching Figma and visual storytelling.',
      skillsHave: [
        skill(8, 'Figma', 'Creative Arts', 'EXPERT'),
        skill(9, 'Graphic Design', 'Creative Arts', 'EXPERT')
      ],
      skillsWant: [skill(10, 'English Speaking', 'Languages', 'INTERMEDIATE')],
      availability: [slotDay(4, '2026-11-10', ['10:00-11:00', '14:00-15:00'])],
      rating: 5.0,
      totalSessions: 89,
      leaderboardSessions: 89,
      skillsAcquiredCount: 5
    },
    {
      _id: oid('d0f1', 4),
      userId: IDS.DAVID,
      displayName: 'David Kim',
      bio: 'Bilingual linguist and IELTS coach with 5+ years of conversational training.',
      skillsHave: [
        skill(11, 'Korean', 'Languages', 'EXPERT'),
        skill(12, 'English IELTS', 'Languages', 'EXPERT')
      ],
      skillsWant: [skill(13, 'Python', 'Technology', 'BEGINNER')],
      availability: [slotDay(5, '2026-11-10', ['12:00-13:00', '19:00-20:00'])],
      rating: 4.8,
      totalSessions: 56,
      leaderboardSessions: 56,
      skillsAcquiredCount: 7
    },
    {
      _id: oid('d0f1', 5),
      userId: IDS.EMILY,
      displayName: 'Emily Watson',
      bio: 'Applied Mathematics researcher helping students master Statistics and Calculus.',
      skillsHave: [
        skill(14, 'Statistics', 'Academics', 'EXPERT'),
        skill(15, 'Calculus', 'Academics', 'EXPERT')
      ],
      skillsWant: [skill(16, 'Data Science', 'Technology', 'INTERMEDIATE')],
      availability: [slotDay(6, '2026-11-12', ['15:00-16:00', '17:00-18:00'])],
      rating: 4.7,
      totalSessions: 42,
      leaderboardSessions: 42,
      skillsAcquiredCount: 8
    },
    {
      // Marcus is a pure learner (no teaching skills) so he does not appear in the Marketplace
      _id: oid('d0f1', 6),
      userId: IDS.MARCUS,
      displayName: 'Marcus Johnson',
      bio: 'Lifelong polymath exploring full-stack engineering, AI, and digital design.',
      skillsHave: [],
      skillsWant: [skill(17, 'AWS', 'Technology', 'EXPERT')],
      availability: [],
      rating: 5.0,
      totalSessions: 0,
      skillsAcquiredCount: 14
    },
    {
      _id: oid('d0f1', 7),
      userId: IDS.ADMIN,
      displayName: 'Platform Admin',
      bio: 'SkillSwap moderation & dispute arbitration team.',
      skillsHave: [],
      skillsWant: [],
      availability: [],
      rating: 5.0,
      totalSessions: 0,
      skillsAcquiredCount: 0
    }
  ];

  const sessions = [
    {
      _id: IDS.SEED_SESSION,
      learnerId: IDS.ZANNAT,
      mentorId: IDS.ALEX,
      status: 'ACTIVE',
      skillName: 'React.js Mentorship',
      domain: 'Technology',
      scheduledTime: new Date(),
      startedAt: new Date(),
      completedAt: null,
      creditsLocked: 50,
      meetingLink: 'https://meet.google.com/new',
      disputeReason: '',
      bookedSlot: null,
      feedback: null,
      createdAt: new Date()
    }
  ];

  const transactions = [
    {
      _id: oid('7c0', 2),
      userId: IDS.ZANNAT,
      sessionId: IDS.SEED_SESSION,
      type: 'ESCROW_LOCK',
      amount: -50,
      balanceAfter: 50,
      description: 'Locked 50 CR in Escrow (React.js Mentorship)',
      createdAt: new Date('2026-11-01T10:00:00.000Z')
    },
    {
      _id: oid('7c0', 1),
      userId: IDS.ZANNAT,
      sessionId: null,
      type: 'BONUS',
      amount: 100,
      balanceAfter: 100,
      description: 'Registration Bonus',
      createdAt: new Date('2026-08-15T10:00:00.000Z')
    }
  ];

  const chatLogs = [
    {
      _id: oid('c4a7', 1),
      sessionId: IDS.SEED_SESSION,
      senderId: IDS.ALEX,
      senderName: 'Alex Rivera',
      text: 'Hey Zannat! Welcome to our React.js Mentorship session. Ready to dive into Hooks and state architecture?',
      timestamp: new Date()
    }
  ];

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
  IDS
};
