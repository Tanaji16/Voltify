// ============================================================
//  Voltify — Appliance Model
//  models/Appliance.js
// ============================================================

const mongoose = require('mongoose');

// ── Sub-schema: Advanced time-slot usage ───────────────────
//    Allows users to specify usage in morning / afternoon / night slots
const AdvancedUsageSlotSchema = new mongoose.Schema(
  {
    slot:  {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
    },
    hours: { type: Number, min: 0, max: 24, default: 0 },
  },
  { _id: false }
);

// ── Main Appliance Schema ───────────────────────────────────
const ApplianceSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },

    // ── Appliance Identity ────────────────────────────────
    applianceName: {
      type:     String,
      required: [true, 'Appliance name is required'],
      trim:     true,
      maxlength: [100, 'Appliance name cannot exceed 100 characters'],
    },

    // ── Power Specifications ──────────────────────────────
    powerRating: {
      type:     Number,                         // Watts
      required: [true, 'Power rating (Watts) is required'],
      min:      [1, 'Power rating must be at least 1 Watt'],
    },

    quantity: {
      type:    Number,
      default: 1,
      min:     [1, 'Quantity must be at least 1'],
    },

    efficiencyType: {
      type:    String,
      enum:    ['Standard', 'BEE 1-Star', 'BEE 2-Star', 'BEE 3-Star', 'BEE 4-Star', 'BEE 5-Star'],
      default: 'Standard',
    },

    // ── Usage Pattern ─────────────────────────────────────
    //    "basic"    → simple flat hours/day
    //    "advanced" → breakdown by time slot (morning, afternoon, etc.)
    usageMode: {
      type:    String,
      enum:    ['basic', 'advanced'],
      default: 'basic',
    },

    // Basic usage (hours per day, single value)
    basicUsageHours: {
      type:    Number,
      default: 0,
      min:     0,
      max:     24,
    },

    // Advanced usage (array of slot objects)
    advancedUsageSlots: {
      type:    [AdvancedUsageSlotSchema],
      default: [],
    },

    // Days used per month (1-31)
    daysUsedPerMonth: {
      type:    Number,
      default: 30,
      min:     1,
      max:     31,
    },

    // ── Computed Cache (optional, updated on save) ────────
    //    Storing monthly kWh avoids re-calculation on every fetch
    monthlyKwh: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save Hook: Auto-calculate monthlyKwh ───────────────
ApplianceSchema.pre('save', function () {
  const efficiencyMultiplier = {
    'Standard':   1.00,
    'BEE 1-Star': 0.95,
    'BEE 2-Star': 0.90,
    'BEE 3-Star': 0.85,
    'BEE 4-Star': 0.80,
    'BEE 5-Star': 0.75,
  };

  let hoursPerDay = 0;

  if (this.usageMode === 'basic') {
    hoursPerDay = this.basicUsageHours;
  } else {
    // Sum all slot hours for advanced mode
    hoursPerDay = this.advancedUsageSlots.reduce(
      (sum, slot) => sum + (slot.hours || 0),
      0
    );
  }

  const kWhPerDay =
    (this.powerRating / 1000) *
    this.quantity *
    hoursPerDay *
    (efficiencyMultiplier[this.efficiencyType] || 1);

  this.monthlyKwh = parseFloat((kWhPerDay * this.daysUsedPerMonth).toFixed(3));
});

module.exports = mongoose.model('Appliance', ApplianceSchema);
