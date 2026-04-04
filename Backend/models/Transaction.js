// ============================================================
//  Voltify — Transaction Model
//  models/Transaction.js
// ============================================================

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Subscription Details ──────────────────────────────
    plan: {
      type:     String,
      enum:     ['Pro', 'Annual'],
      required: true,
    },

    amount: {
      type:     Number,     // Amount in Indian Rupees (INR)
      required: true,
    },

    currency: {
      type:    String,
      default: 'INR',
    },

    // ── Payment Gateway Info (Razorpay mock) ──────────────
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    // ── Status ────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },

    // ── Subscription Dates (set on success) ───────────────
    subscriptionStartsAt: { type: Date, default: null },
    subscriptionEndsAt:   { type: Date, default: null },

    // ── Metadata ──────────────────────────────────────────
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
