// ============================================================
//  Voltify — Challenge Routes
//  routes/challengeRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  getChallenges,
  getCatalogue,
  joinChallenge,
  verifyChallenge,
  getBadges,
} = require('../controllers/challengeController');

const { protect } = require('../middleware/authMiddleware');

// All challenge routes require authentication
router.use(protect);

// GET  /api/challenges           → get all user's challenges (history)
router.get('/', getChallenges);

// GET  /api/challenges/catalogue → get available challenge presets + join status
router.get('/catalogue', getCatalogue);

// GET  /api/challenges/badges    → get all earned badges
router.get('/badges', getBadges);

// POST /api/challenges/join      → join a challenge
router.post('/join', joinChallenge);

// POST /api/challenges/:id/verify → verify/complete a challenge
router.post('/:id/verify', verifyChallenge);

module.exports = router;
