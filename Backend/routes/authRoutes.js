// ============================================================
//  Voltify — Auth Routes
//  routes/authRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  register,
  sendOTP,
  verifyOTP,
  login,
  getMe,
  setPassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ── Public Routes ────────────────────────────────────────────
// POST /api/auth/register   → Create account
router.post('/register', register);

// POST /api/auth/send-otp   → Send OTP to phone
router.post('/send-otp', sendOTP);

// POST /api/auth/verify-otp → Verify OTP, returns JWT
router.post('/verify-otp', verifyOTP);

// POST /api/auth/login      → Password login, returns JWT
router.post('/login', login);

// ── Protected Routes ─────────────────────────────────────────
// GET  /api/auth/me         → Get current user profile
router.get('/me', protect, getMe);

// POST /api/auth/set-password → Set password during signup step 2
router.post('/set-password', protect, setPassword);

module.exports = router;
