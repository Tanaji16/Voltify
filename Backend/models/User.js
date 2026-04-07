// ============================================================
//  Voltify — User Model
//  models/User.js
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    // ── Personal Info ───────────────────────────────────────
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },

    city: {
      type:     String,
      trim:     true,
    },

    // ── MSEDCL / Mahavitaran Details ────────────────────────
    consumerId: {
      type:     String,
      required: [true, 'Consumer ID is required'],
      unique:   true,
      trim:     true,
      match:    [/^\d{12}$/, 'Consumer ID must be exactly 12 digits'],
    },

    buCode: {
      type:     String,
      required: [true, 'BU Code is required'],
      trim:     true,
      uppercase: true,
    },

    // ── Authentication ──────────────────────────────────────
    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:   false,   // Never return password in queries by default
    },

    // OTP fields (stored temporarily, cleared after verification)
    otp:           { type: String,  select: false },
    otpExpiresAt:  { type: Date,    select: false },
    isVerified:    { type: Boolean, default: false },

    // ── Subscription ────────────────────────────────────────
    subscriptionStatus: {
      type:    String,
      enum:    ['Free', 'Pro', 'Annual'],
      default: 'Free',
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    // ── Freemium Usage Tracking ─────────────────────────────
    freemiumAdviceUses: {
      type:    Number,
      default: 0,
    },

    // ── Payment History Reference ───────────────────────────
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Transaction',
      },
    ],
  },
  {
    timestamps: true,   // Adds createdAt & updatedAt automatically
  }
);

// ── Pre-save Hook: Hash password before storing ─────────────
UserSchema.pre('save', async function () {
  // Only hash if the password field was actually modified
  if (!this.isModified('password')) return;

  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Method: Compare passwords ──────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Instance Method: Check if subscription is active ────────
UserSchema.methods.isSubscribed = function () {
  if (this.subscriptionStatus === 'Free') return false;
  if (!this.subscriptionExpiresAt) return true;
  return new Date() < this.subscriptionExpiresAt;
};

module.exports = mongoose.model('User', UserSchema);
