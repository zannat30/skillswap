const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { getStore } = require('../config/memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || '8f9d2a7b4c6e1f0a3b5d8c9e2f4a6b8d0c1e3f5a7b9d2e4f6a8b0c2e4f6a8b0c';

const protect = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED_OR_MISSING',
          httpStatus: 401,
          message: 'Missing or expired JWT Bearer token.'
        }
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id || decoded._id;

    let user = null;
    if (isMongoConnected()) {
      user = await User.findById(userId);
    } else {
      user = getStore().users.find((u) => String(u._id) === String(userId));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED_OR_MISSING',
          httpStatus: 401,
          message: 'Authenticated user no longer exists.'
        }
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BANNED',
          httpStatus: 403,
          message: 'Your account has been suspended by an Administrator due to policy violations.'
        }
      });
    }

    req.user = {
      _id: String(user._id),
      userId: String(user._id),
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED_OR_MISSING',
        httpStatus: 401,
        message: 'Invalid or expired JWT Bearer token.'
      }
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId || decoded.id || decoded._id;
      req.user = {
        _id: String(userId),
        userId: String(userId),
        email: decoded.email,
        role: decoded.role || 'USER'
      };
    } else {
      // Default to seeded demo user Zannat when unauthenticated on public/hybrid UI queries
      req.user = {
        _id: '664f1a2b3c4d5e6f7a8b9c01',
        userId: '664f1a2b3c4d5e6f7a8b9c01',
        email: 'zannat@ist.edu.bd',
        role: 'USER'
      };
    }
  } catch (_) {
    req.user = {
      _id: '664f1a2b3c4d5e6f7a8b9c01',
      userId: '664f1a2b3c4d5e6f7a8b9c01',
      email: 'zannat@ist.edu.bd',
      role: 'USER'
    };
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_ROLE',
        httpStatus: 403,
        message: 'Access denied. Administrator privileges required.'
      }
    });
  }
  next();
};

module.exports = { protect, optionalAuth, requireAdmin, JWT_SECRET };
