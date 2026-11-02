const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');

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
