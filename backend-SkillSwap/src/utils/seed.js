const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, isMongoConnected } = require('../config/db');
const { resetMemoryStore } = require('../config/memoryStore');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');

const runSeed = async () => {
  await connectDB();
  const state = resetMemoryStore();

  if (isMongoConnected()) {
    await User.deleteMany({});
    await UserProfile.deleteMany({});
    await Session.deleteMany({});
    await Transaction.deleteMany({});
    await ChatLog.deleteMany({});

    await User.insertMany(state.users);
    await UserProfile.insertMany(state.userProfiles);
    await UserProfile.createIndexes().catch(() => {});
    console.log('[SkillSwap Seeder] ✅ Database reset: Only Super Admin (admin@admin.com / 12345678) exists. All fake users removed.');
    process.exit(0);
  } else {
    console.log('[SkillSwap Seeder] ✅ In-memory database reset: Only Super Admin (admin@admin.com / 12345678) exists.');
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
