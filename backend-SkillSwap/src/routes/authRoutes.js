const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, logout } = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', optionalAuth, getMe);
router.put('/password', protect, updatePassword);
router.post('/logout', optionalAuth, logout);

module.exports = router;
