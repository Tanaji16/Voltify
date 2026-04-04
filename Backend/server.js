// ============================================================
//  Voltify — Main Server Entry Point
//  server.js
// ============================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST before anything else
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const applianceRoutes = require('./routes/applianceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ── Initialise App ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Global Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health-check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Voltify API is running ⚡' });
});

// ── Route Mounting ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/appliances', applianceRoutes);
app.use('/api/payment', paymentRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ── Start Listening ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ Voltify API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}\n`);
});
