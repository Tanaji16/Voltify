// ============================================================
//  Voltify — Payment Routes
//  routes/paymentRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  createOrder,
  verifyPayment,
  getMyTransactions,
  getPlans,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

// ── Public Routes ────────────────────────────────────────────
// GET  /api/payment/plans           → List available subscription plans
router.get('/plans', getPlans);

// ── Protected Routes ─────────────────────────────────────────
router.use(protect);

// POST /api/payment/create-order    → Initiate Razorpay order
router.post('/create-order', createOrder);

// POST /api/payment/verify          → Verify signature & activate plan
router.post('/verify', verifyPayment);

// GET  /api/payment/my-transactions → User's payment history
router.get('/my-transactions', getMyTransactions);

module.exports = router;
