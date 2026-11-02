const express = require('express');
const router = express.Router();
const {
  initializeProfile,
  getMyProfile,
  getPublicProfile,
  updateBio,
  addSkillHave,
  getSkillsHave,
  updateSkillHave,
  deleteSkillHave,
  addSkillWant,
  getSkillsWant,
  updateSkillWant,
  deleteSkillWant,
  addAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
  getMentorReviews
} = require('../controllers/profileController');
const { optionalAuth } = require('../middleware/authMiddleware');
const domainFilterMiddleware = require('../middleware/domainFilterMiddleware');

router.post('/', optionalAuth, initializeProfile);
router.get('/me', optionalAuth, getMyProfile);
router.put('/bio', optionalAuth, updateBio);

// Skills I Have CRUD (Features #12-#15)
router.post('/skills-have', optionalAuth, domainFilterMiddleware, addSkillHave);
router.get('/skills-have', optionalAuth, getSkillsHave);
router.put('/skills-have/:skillId', optionalAuth, domainFilterMiddleware, updateSkillHave);
router.delete('/skills-have/:skillId', optionalAuth, deleteSkillHave);

// Skills I Want CRUD (Features #16-#19)
router.post('/skills-want', optionalAuth, domainFilterMiddleware, addSkillWant);
router.get('/skills-want', optionalAuth, getSkillsWant);
router.put('/skills-want/:skillId', optionalAuth, domainFilterMiddleware, updateSkillWant);
router.delete('/skills-want/:skillId', optionalAuth, deleteSkillWant);

// Availability CRUD (Features #20-#23)
router.post('/availability', optionalAuth, addAvailability);
router.put('/availability/:slotId', optionalAuth, updateAvailability);
router.delete('/availability/:slotId', optionalAuth, deleteAvailability);

// Public Profile & Reviews & Mentor Availability (Features #10, #21, #38)
router.get('/:userId/availability', getAvailability);
router.get('/:userId/reviews', getMentorReviews);
router.get('/:userId', getPublicProfile);

module.exports = router;
