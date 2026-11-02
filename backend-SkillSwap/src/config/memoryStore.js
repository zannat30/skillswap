const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(12).toString('hex');

const DEFAULT_PASS_HASH = bcrypt.hashSync('StrongPassword123!', 10);

const createInitialState = () => {
  const users = [
    {
      _id: '664f1a2b3c4d5e6f7a8b9c01',
      email: 'zannat@ist.edu.bd',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 100,
      streakCount: 7,
      streakClaimedAt: null,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-08-15T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c99',
      email: 'alex.rivera@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 450,
      streakCount: 12,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-06-10T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c98',
      email: 'sarah.chen@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 520,
      streakCount: 9,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-06-12T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c97',
      email: 'david.kim@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 310,
      streakCount: 5,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-07-01T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c96',
      email: 'emily.watson@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 280,
      streakCount: 4,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-07-18T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c95',
      email: 'marcus.johnson@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'USER',
      credits: 190,
      streakCount: 6,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-07-22T10:00:00.000Z')
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9c00',
      email: 'admin@skillswap.io',
      passwordHash: DEFAULT_PASS_HASH,
      role: 'ADMIN',
      credits: 1000,
      streakCount: 30,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date('2026-06-01T10:00:00.000Z')
    }
  ];

  const userProfiles = [
    {
      _id: '664f1a2b3c4d5e6f7a8b9d01',
      userId: '664f1a2b3c4d5e6f7a8b9c01',
      displayName: 'Zannat',
      initials: 'Z',
      bio: 'Passionate peer learner and mentor on SkillSwap.',
      category: 'technology',
      domain: 'Technology',
      skillsHave: [
        { _id: 'sk_z_1', skill: 'React.js', domain: 'Technology', level: 'EXPERT' },
        { _id: 'sk_z_2', skill: 'CSS', domain: 'Technology', level: 'INTERMEDIATE' }
      ],
      skillsWant: [
        { _id: 'sk_z_3', skill: 'Python', domain: 'Technology', level: 'INTERMEDIATE' },
        { _id: 'sk_z_4', skill: 'Machine Learning', domain: 'Technology', level: 'INTERMEDIATE' }
      ],
      availability: [
        { _id: 'av_z_1', date: '2026-11-10', slots: ['14:00-15:00', '16:00-17:00'] }
      ],
      rating: 5.0,
      ratingCount: 11,
      totalSessions: 25,
      skillsAcquiredCount: 11
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9d99',
      userId: '664f1a2b3c4d5e6f7a8b9c99',
      displayName: 'Alex Rivera',
      initials: 'AR',
      bio: 'Senior Full-Stack Engineer specializing in React.js and Node.js distributed systems.',
      category: 'technology',
      domain: 'Technology',
      skillsHave: [
        { _id: 'sk_ar_1', skill: 'React.js', domain: 'Technology', level: 'EXPERT' },
        { _id: 'sk_ar_2', skill: 'Node.js', domain: 'Technology', level: 'EXPERT' }
      ],
      skillsWant: [
        { _id: 'sk_ar_3', skill: 'UI/UX Design', domain: 'Creative Arts', level: 'INTERMEDIATE' }
      ],
      availability: [
        { _id: 'av_ar_1', date: '2026-11-10', slots: ['14:00-15:00', '18:00-19:00'] },
        { _id: 'av_ar_2', date: '2026-11-11', slots: ['15:00-16:00'] }
      ],
      rating: 4.9,
      ratingCount: 64,
      totalSessions: 124,
      leaderboardSessions: 64,
      skillsAcquiredCount: 6
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9d98',
      userId: '664f1a2b3c4d5e6f7a8b9c98',
      displayName: 'Sarah Chen',
      initials: 'SC',
      bio: 'Product Designer & Design Systems Architect teaching Figma and visual storytelling.',
      category: 'creative',
      domain: 'Creative Arts',
      skillsHave: [
        { _id: 'sk_sc_1', skill: 'Figma', domain: 'Creative Arts', level: 'EXPERT' },
        { _id: 'sk_sc_2', skill: 'Graphic Design', domain: 'Creative Arts', level: 'EXPERT' }
      ],
      skillsWant: [
        { _id: 'sk_sc_3', skill: 'English Speaking', domain: 'Languages', level: 'INTERMEDIATE' }
      ],
      availability: [
        { _id: 'av_sc_1', date: '2026-11-10', slots: ['10:00-11:00', '14:00-15:00'] }
      ],
      rating: 5.0,
      ratingCount: 89,
      totalSessions: 89,
      leaderboardSessions: 89,
      skillsAcquiredCount: 5
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9d97',
      userId: '664f1a2b3c4d5e6f7a8b9c97',
      displayName: 'David Kim',
      initials: 'DK',
      bio: 'Bilingual linguist and IELTS coach with 5+ years of conversational training.',
      category: 'languages',
      domain: 'Languages',
      skillsHave: [
        { _id: 'sk_dk_1', skill: 'Korean', domain: 'Languages', level: 'EXPERT' },
        { _id: 'sk_dk_2', skill: 'English IELTS', domain: 'Languages', level: 'EXPERT' }
      ],
      skillsWant: [
        { _id: 'sk_dk_3', skill: 'Python', domain: 'Technology', level: 'BEGINNER' }
      ],
      availability: [
        { _id: 'av_dk_1', date: '2026-11-10', slots: ['12:00-13:00', '19:00-20:00'] }
      ],
      rating: 4.8,
      ratingCount: 56,
      totalSessions: 56,
      leaderboardSessions: 56,
      skillsAcquiredCount: 7
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9d96',
      userId: '664f1a2b3c4d5e6f7a8b9c96',
      displayName: 'Emily Watson',
      initials: 'EW',
      bio: 'Applied Mathematics researcher helping students master Statistics and Calculus.',
      category: 'academic',
      domain: 'Academics',
      skillsHave: [
        { _id: 'sk_ew_1', skill: 'Statistics', domain: 'Academics', level: 'EXPERT' },
        { _id: 'sk_ew_2', skill: 'Calculus', domain: 'Academics', level: 'EXPERT' }
      ],
      skillsWant: [
        { _id: 'sk_ew_3', skill: 'Data Science', domain: 'Technology', level: 'INTERMEDIATE' }
      ],
      availability: [
        { _id: 'av_ew_1', date: '2026-11-12', slots: ['15:00-16:00', '17:00-18:00'] }
      ],
      rating: 4.7,
      ratingCount: 42,
      totalSessions: 42,
      leaderboardSessions: 42,
      skillsAcquiredCount: 8
    },
    {
      _id: '664f1a2b3c4d5e6f7a8b9d95',
      userId: '664f1a2b3c4d5e6f7a8b9c95',
      displayName: 'Marcus Johnson',
      initials: 'MJ',
      bio: 'Lifelong polymath exploring full-stack engineering, AI, and digital design.',
      category: 'technology',
      domain: 'Technology',
      skillsHave: [
        { _id: 'sk_mj_1', skill: 'Docker', domain: 'Technology', level: 'INTERMEDIATE' }
      ],
      skillsWant: [
        { _id: 'sk_mj_2', skill: 'AWS', domain: 'Technology', level: 'EXPERT' }
      ],
      availability: [],
      rating: 4.9,
      ratingCount: 15,
      totalSessions: 18,
      leaderboardSessions: 18,
      skillsAcquiredCount: 14
    }
  ];

  const sessions = [
    {
      _id: '665099aabbccddeeff001122',
      learnerId: '664f1a2b3c4d5e6f7a8b9c01',
      mentorId: '664f1a2b3c4d5e6f7a8b9c99',
      status: 'ACTIVE',
      skillName: 'React.js Mentorship',
      domain: 'Technology',
      scheduledTime: new Date(Date.now() + 3600 * 1000),
      startedAt: new Date(),
      completedAt: null,
      creditsLocked: 50,
      meetingLink: 'https://meet.google.com/new',
      disputeReason: '',
      feedback: null,
      createdAt: new Date()
    }
  ];

  const transactions = [
    {
      _id: '665099aabbccddeeff009901',
      userId: '664f1a2b3c4d5e6f7a8b9c01',
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
      _id: '665099aabbccddeeff008801',
      sessionId: '665099aabbccddeeff001122',
      senderId: '664f1a2b3c4d5e6f7a8b9c99',
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
  generateId
};
