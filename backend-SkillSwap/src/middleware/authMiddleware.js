const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const { getStore } = require('../config/memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || '8f9d2a7b4c6e1f0a3b5d8c9e2f4a6b8d0c1e3f5a7b9d2e4f6a8b0c2e4f6a8b0c';

const unauthorized = (res, message) =>
  res.status(401).json({
    success: false,
    error: { code: 'TOKEN_EXPIRED_OR_MISSING', httpStatus: 401, message }
  });

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

const findUserById = async (userId) => {
  if (isMongoConnected()) return User.findById(userId);
  return getStore().users.find((u) => String(u._id) === String(userId)) || null;
};

/**
 * Verifies a JWT and returns the live user record (or null).
 * Shared by REST middleware and the Socket.io handshake.
 */
const resolveUserFromToken = async (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.userId || decoded.id || decoded._id);
    return user || null;
  } catch (_) {
    return null;
  }
};

const toReqUser = (user) => ({
  _id: String(user._id),
  userId: String(user._id),
  email: user.email,
  role: user.role
});

// Strict guard: requires a valid Bearer JWT and non-banned user
const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return unauthorized(res, 'Authentication required. Please sign in or create an account.');
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    return unauthorized(res, 'Invalid or expired JWT Bearer token. Please sign in again.');
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

  req.user = toReqUser(user);
  next();
};

// Kept as an alias to protect so no route ever leaks unauthenticated data
const optionalAuth = protect;

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

module.exports = { protect, optionalAuth, requireAdmin, resolveUserFromToken, JWT_SECRET };
