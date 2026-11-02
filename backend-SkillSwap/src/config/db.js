const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Session = require('../models/Session');
const Transaction = require('../models/Transaction');
const ChatLog = require('../models/ChatLog');
const { getStore } = require('./memoryStore');

let mongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';

  if (process.env.NODE_ENV === 'test' || uri.includes('YourPassword123')) {
    mongoConnected = false;
    return false;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'skillswap',
      serverSelectionTimeoutMS: 5000
    });
    mongoConnected = true;

    // Auto-seed initial demo data if MongoDB Atlas collection is empty
    const existingUsers = await User.countDocuments().catch(() => 0);
    if (existingUsers === 0) {
      const state = getStore();
      await User.insertMany(state.users).catch(() => {});
      await UserProfile.insertMany(state.userProfiles).catch(() => {});
      await Session.insertMany(state.sessions).catch(() => {});
      await Transaction.insertMany(state.transactions).catch(() => {});
      await ChatLog.insertMany(state.chatLogs).catch(() => {});
      console.log(`[MongoDB Atlas]    🌱 Auto-seeded initial mentors, learner (Zannat), admin & escrow ledger.`);
    }

    await UserProfile.createIndexes().catch(() => {});
    console.log(`[MongoDB Atlas]    ✅ Connected successfully to ${mongoose.connection.host}/skillswap`);
    return true;
  } catch (error) {
    mongoConnected = false;
    console.log(`[MongoDB Atlas]    ⚡ Cloud/Local daemon unreachable (${error.message}). Operating with High-Availability In-Memory Store.`);
    return false;
  }
};

const isMongoConnected = () => mongoConnected && mongoose.connection.readyState === 1;

module.exports = { connectDB, isMongoConnected };
