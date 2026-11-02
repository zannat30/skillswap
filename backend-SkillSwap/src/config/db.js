const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

// Configure reliable DNS servers for MongoDB Atlas SRV resolution (fixes ECONNREFUSED on local ISP/Windows DNS)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {
  // Use default if setServers is unavailable
}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let mongoConnected = false;

const ensureSuperAdmin = async () => {
  const adminEmail = 'admin@admin.com';
  const existingAdmin = await User.findOne({ email: adminEmail }).select('+passwordHash');
  const passwordHash = await bcrypt.hash('12345678', 10);

  if (!existingAdmin) {
    const adminUser = await User.create({
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      credits: 1000,
      streakCount: 1,
      lastLogin: new Date(),
      isBanned: false
    });

    await UserProfile.findOneAndUpdate(
      { userId: adminUser._id },
      {
        userId: adminUser._id,
        displayName: 'Super Admin',
        bio: 'SkillSwap Platform Super Administrator.',
        skillsHave: [],
        skillsWant: [],
        availability: [],
        rating: 5.0,
        totalSessions: 0
      },
      { upsert: true, returnDocument: 'after' }
    );
  } else if (existingAdmin.role !== 'ADMIN') {
    existingAdmin.role = 'ADMIN';
    await existingAdmin.save();
  }
};

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

    await ensureSuperAdmin().catch(() => {});
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

module.exports = { connectDB, isMongoConnected, ensureSuperAdmin };
