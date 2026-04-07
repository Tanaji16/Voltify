// ============================================================
//  Voltify — Challenge Model
//  models/Challenge.js
// ============================================================

const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema(
  {
    // Owner of this challenge record
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // Unique key for the challenge type (e.g. 'cut10', 'no_ac_weekend')
    challengeId: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Display info
    title:       { type: String, required: true },
    description: { type: String, required: true },
    emoji:       { type: String, default: '⚡' },

    // Billing cycle this challenge applies to
    targetMonth: { type: Number, required: true }, // 1-12
    targetYear:  { type: Number, required: true },

    // For percentage-reduction challenges: baseline last month's kWh
    baselineUnits: { type: Number, default: null },

    // Target reduction percentage (e.g. 10 means reduce by 10%)
    targetReductionPct: { type: Number, default: null },

    // Fixed threshold for "under X kWh" challenges
    targetMaxUnits: { type: Number, default: null },

    // Status lifecycle
    status: {
      type:    String,
      enum:    ['active', 'completed', 'failed'],
      default: 'active',
    },

    completedAt: { type: Date, default: null },

    // Badge rewarded on completion
    badge: {
      icon:  { type: String, default: '🏅' },
      label: { type: String, default: 'Champion' },
      color: { type: String, default: '#16A34A' }, // hex
    },
  },
  { timestamps: true }
);

// One challenge record per user per challenge type per month/year
ChallengeSchema.index(
  { userId: 1, challengeId: 1, targetMonth: 1, targetYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('Challenge', ChallengeSchema);
