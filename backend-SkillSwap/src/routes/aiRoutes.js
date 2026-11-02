const express = require('express');
const router = express.Router();
const { askSkillBot, generateRoadmap } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');
const domainFilterMiddleware = require('../middleware/domainFilterMiddleware');

router.post('/ask', optionalAuth, domainFilterMiddleware, askSkillBot);
router.post('/roadmap', optionalAuth, domainFilterMiddleware, generateRoadmap);

module.exports = router;
