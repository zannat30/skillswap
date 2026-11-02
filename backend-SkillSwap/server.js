const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { connectDB } = require('./src/config/db');
const corsOptions = require('./src/config/corsOptions');
const errorHandler = require('./src/middleware/errorHandler');
const { setupSessionSocket } = require('./src/sockets/sessionSocket');

const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { getMarketplace, getBarterMatches } = require('./src/controllers/profileController');
const { getTopMentors, getTopLearners } = require('./src/controllers/leaderboardController');
const { sweepExpiredPendingSessions } = require('./src/controllers/sessionController');
const { optionalAuth } = require('./src/middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

const userSockets = new Map();
app.set('io', io);
app.set('userSockets', userSockets);

setupSessionSocket(io, userSockets);

// Security & Core Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiter on Auth & AI routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', apiLimiter);
app.use('/api/ai', apiLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'backend-SkillSwap',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Marketplace Discovery & Matchmaking Routes (Module 4)
app.get('/api/marketplace', optionalAuth, getMarketplace);
app.get('/api/marketplace/matches', optionalAuth, getBarterMatches);
app.get('/api/mentors', optionalAuth, getMarketplace);

// Leaderboard Routes (Module 10)
app.get('/api/leaderboard/mentors', getTopMentors);
app.get('/api/leaderboard/learners', getTopLearners);

// Centralized Error Handler
app.use(errorHandler);

// Background 24-Hour Pending Session Auto-Cancel & Escrow Refund Timer (Section 5.3 / Gap 2)
const pendingTimeoutInterval = setInterval(() => {
  sweepExpiredPendingSessions().catch(() => {});
}, 60 * 1000);
if (typeof pendingTimeoutInterval.unref === 'function') {
  pendingTimeoutInterval.unref();
}

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(async () => {
    await sweepExpiredPendingSessions().catch(() => {});
    server.listen(PORT, () => {
      console.log(`[SkillSwap Server] 🚀 Express REST API listening on http://localhost:${PORT}`);
      console.log(`[Socket.io Engine] ⚡ WebSocket Server initialized and awaiting room connections`);
      console.log(`[Escrow Watchdog] ⏱️ 24-Hour PENDING session auto-cancel & refund timer active`);
    });
  });
}

module.exports = { app, server, io };
