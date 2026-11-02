const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Transaction = require('../models/Transaction');
const { isMongoConnected } = require('../config/db');
const { getStore, generateId } = require('../config/memoryStore');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const signToken = (user) => {
  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      role: user.role || 'USER'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const getInitials = (name = 'U') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
};

// Feature #1, #2, #8: POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { displayName, name, email, password, role } = req.body || {};
    const finalName = (displayName || name || 'SkillSwap Learner').trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          httpStatus: 400,
          message: 'Email and password are required.'
        }
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          httpStatus: 400,
          message: 'Please provide a valid email address.'
        }
      });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const onboardingCredits = Number(process.env.ONBOARDING_BONUS_CREDITS) || 100;

    if (isMongoConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            httpStatus: 400,
            message: 'An account with this email already exists.'
          }
        });
      }

      const passwordHash = await bcrypt.hash(password, saltRounds);
      const user = await User.create({
        email: normalizedEmail,
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        credits: onboardingCredits,
        streakCount: 1,
        lastLogin: new Date(),
        isBanned: false
      });

      await UserProfile.create({
        userId: user._id,
        displayName: finalName,
        bio: 'Passionate peer learner and mentor on SkillSwap.',
        skillsHave: [],
        skillsWant: [],
        availability: [],
        rating: 5.0,
        totalSessions: 0
      });

      await Transaction.create({
        userId: user._id,
        sessionId: null,
        type: 'BONUS',
        amount: onboardingCredits,
        balanceAfter: onboardingCredits,
        description: 'Registration Bonus'
      });

      const token = signToken(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: String(user._id),
          displayName: finalName,
          initials: getInitials(finalName),
          email: user.email,
          role: user.role,
          credits: user.credits,
          streakCount: user.streakCount
        }
      });
    }

    // High-Availability In-Memory Store path
    const store = getStore();
    const existing = store.users.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          httpStatus: 400,
          message: 'An account with this email already exists.'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUserId = generateId();
    const newUser = {
      _id: newUserId,
      email: normalizedEmail,
      passwordHash,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      credits: onboardingCredits,
      streakCount: 1,
      streakClaimedAt: null,
      lastLogin: new Date(),
      isBanned: false,
      createdAt: new Date()
    };
    store.users.push(newUser);

    store.userProfiles.push({
      _id: generateId(),
      userId: newUserId,
      displayName: finalName,
      initials: getInitials(finalName),
      bio: 'Passionate peer learner and mentor on SkillSwap.',
      category: 'technology',
      domain: 'Technology',
      skillsHave: [],
      skillsWant: [],
      availability: [],
      rating: 5.0,
      ratingCount: 1,
      totalSessions: 0,
      skillsAcquiredCount: 0
    });

    store.transactions.unshift({
      _id: generateId(),
      userId: newUserId,
      sessionId: null,
      type: 'BONUS',
      amount: onboardingCredits,
      balanceAfter: onboardingCredits,
      description: 'Registration Bonus',
      createdAt: new Date()
    });

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: newUserId,
        displayName: finalName,
        initials: getInitials(finalName),
        email: newUser.email,
        role: newUser.role,
        credits: newUser.credits,
        streakCount: newUser.streakCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #3 & #5: POST /api/auth/login (with 24-48h streak calculation)
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          httpStatus: 400,
          message: 'Email and password are required.'
        }
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const now = new Date();

    if (isMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_REGISTERED',
            httpStatus: 401,
            message: 'This email was not registered.'
          }
        });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_BANNED',
            httpStatus: 403,
            message: 'Account has been banned by an Administrator.'
          }
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            httpStatus: 401,
            message: 'Incorrect password. Please try again.'
          }
        });
      }

      // Feature #5: Daily Login Timestamp & Streak Counter
      if (user.lastLogin) {
        const hoursElapsed = (now.getTime() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60);
        if (hoursElapsed >= 24 && hoursElapsed <= 48) {
          user.streakCount = (user.streakCount || 1) + 1;
        } else if (hoursElapsed > 48) {
          user.streakCount = 1;
        }
      }
      user.lastLogin = now;
      await user.save();

      const profile = await UserProfile.findOne({ userId: user._id });
      const displayName = profile ? profile.displayName : user.email.split('@')[0];
      const token = signToken(user);

      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: String(user._id),
          displayName,
          initials: getInitials(displayName),
          email: user.email,
          role: user.role,
          credits: user.credits,
          streakCount: user.streakCount
        }
      });
    }

    // In-Memory Store path
    const store = getStore();
    const user = store.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_REGISTERED',
          httpStatus: 401,
          message: 'This email was not registered.'
        }
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BANNED',
          httpStatus: 403,
          message: 'Account has been banned by an Administrator.'
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          httpStatus: 401,
          message: 'Incorrect password. Please try again.'
        }
      });
    }

    if (user.lastLogin) {
      const hoursElapsed = (now.getTime() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed >= 24 && hoursElapsed <= 48) {
        user.streakCount = (user.streakCount || 1) + 1;
      } else if (hoursElapsed > 48) {
        user.streakCount = 1;
      }
    }
    user.lastLogin = now;

    const profile = store.userProfiles.find((p) => String(p.userId) === String(user._id));
    const displayName = profile ? profile.displayName : user.email.split('@')[0];
    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: String(user._id),
        displayName,
        initials: getInitials(displayName),
        email: user.email,
        role: user.role,
        credits: user.credits,
        streakCount: user.streakCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #4: GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const user = await User.findById(userId);
      const profile = await UserProfile.findOne({ userId });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
        });
      }
      const displayName = profile ? profile.displayName : user.email.split('@')[0];
      return res.status(200).json({
        success: true,
        user: {
          _id: String(user._id),
          displayName,
          initials: getInitials(displayName),
          email: user.email,
          role: user.role,
          credits: user.credits,
          streakCount: user.streakCount,
          createdAt: user.createdAt
        }
      });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId));
    const profile = store.userProfiles.find((p) => String(p.userId) === String(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', httpStatus: 404, message: 'User not found.' }
      });
    }
    const displayName = profile ? profile.displayName : user.email.split('@')[0];

    return res.status(200).json({
      success: true,
      user: {
        _id: String(user._id),
        displayName,
        initials: getInitials(displayName),
        email: user.email,
        role: user.role,
        credits: user.credits,
        streakCount: user.streakCount,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// Feature #6: PUT /api/auth/password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          httpStatus: 400,
          message: 'Both currentPassword and newPassword are required.'
        }
      });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const userId = req.user.userId;

    if (isMongoConnected()) {
      const user = await User.findById(userId).select('+passwordHash');
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', httpStatus: 401, message: 'Current password is incorrect.' }
        });
      }
      user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      await user.save();
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    }

    const store = getStore();
    const user = store.users.find((u) => String(u._id) === String(userId));
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', httpStatus: 401, message: 'Current password is incorrect.' }
      });
    }
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// Feature #7: POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const userId = req.user ? req.user.userId : null;

    if (io && userSockets && userId && userSockets.has(userId)) {
      const socketId = userSockets.get(userId);
      const sock = io.sockets.sockets.get(socketId);
      if (sock) sock.disconnect(true);
      userSockets.delete(userId);
    }

    return res.status(200).json({
      success: true,
      message: 'Session logged out and active sockets disconnected.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  logout
};
