// ============================================================
//  Voltify — Appliance Routes
//  routes/applianceRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  addAppliance,
  getUserAppliances,
  deleteAppliance,
  calculateBill,
  optimizeBudget,
} = require('../controllers/applianceController');

const { protect } = require('../middleware/authMiddleware');

// All appliance routes require authentication
router.use(protect);

// ── Appliance CRUD ───────────────────────────────────────────
// POST   /api/appliances/add          → Add a new appliance
router.post('/add', addAppliance);

// GET    /api/appliances/user/:id     → Fetch all appliances for dashboard
router.get('/user/:id', getUserAppliances);

// DELETE /api/appliances/:id          → Remove an appliance
router.delete('/:id', deleteAppliance);

// ── Math Engine ──────────────────────────────────────────────
// POST   /api/appliances/calculate-bill   → Calculate slab-rate bill
router.post('/calculate-bill', calculateBill);

// ── Budget Planner ───────────────────────────────────────────
// POST   /api/appliances/optimize-budget  → AI-style freemium advice
router.post('/optimize-budget', optimizeBudget);

module.exports = router;
