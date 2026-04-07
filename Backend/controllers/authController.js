// ============================================================
//  Voltify — Auth Controller
//  controllers/authController.js
// ============================================================

const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const User       = require('../models/User');
const nodemailer = require('nodemailer');

// ── Helper: Generate signed JWT ─────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── Helper: Generate a 6-digit OTP ──────────────────────────
const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();

const sanitizeUser = (user) => ({
  _id:                user._id,
  fullName:           user.fullName,
  email:              user.email,
  meters:             user.meters,
  isVerified:         user.isVerified,
  subscriptionStatus: user.subscriptionStatus,
  freemiumAdviceUses: user.freemiumAdviceUses,
  createdAt:          user.createdAt,
});

// ============================================================
//  @desc    Register a new user (step 1 of OTP flow)
//  @route   POST /api/auth/register
//  @access  Public
// ============================================================
exports.register = async (req, res) => {
  try {
    const { fullName, email, consumerId, buCode, password } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!fullName || !email || !consumerId || !buCode || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }

    // ── Check for duplicates ────────────────────────────────
    const existingUser = await User.findOne({
      $or: [
        { email },
        { 'meters.consumerId': consumerId }
      ],
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? 'Email' : 'Consumer ID';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`,
      });
    }

    // ── Create user (password auto-hashed via pre-save hook) ─
    const user = await User.create({
      fullName,
      email,
      password,
      meters: [{
        meterName: 'Primary Home',
        consumerId,
        buCode,
      }],
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ============================================================
//  @desc    Send OTP to the user's email
//  @route   POST /api/auth/send-otp
//  @access  Public
// ============================================================
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // ── Find or create user entry (for login vs register) ──
    let user = await User.findOne({ email }).select('+otp +otpExpiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.',
      });
    }

    // ── Throttle: Allow only 1 OTP per minute ───────────────
    if (user.otpExpiresAt && user.otpExpiresAt > new Date(Date.now() - 55_000)) {
      return res.status(429).json({
        success: false,
        message: 'An OTP was recently sent. Please wait a minute before requesting again.',
      });
    }

    // ── Generate & persist OTP (expires in 10 minutes) ──────
    const otp = generateOTP();
    user.otp          = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // ── Send via Nodemailer ─────────────────────────────────
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Voltify" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Your Voltify Verification OTP',
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #2563eb, #4338ca); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Volt<span style="color: #93c5fd;">ify</span> ⚡</h1>
                <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Secure Account Verification</p>
              </div>
              <div style="padding: 32px 24px;">
                <p style="margin-top: 0; color: #334155; font-size: 16px;">Hello <strong style="color: #0f172a;">${user.fullName.split(' ')[0]}</strong>,</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">You're almost there! To verify your email address and secure your account, please enter the confirmation code below.</p>
                <div style="margin: 32px 0; padding: 24px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
                  <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e40af;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px; text-align: center; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
              </div>
              <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Voltify Technologies. All rights reserved.</p>
              </div>
            </div>
          `,
        });
        console.log(`[Email] Sent OTP to ${email}`);
      } else {
        // Developer fallback if no API keys exist
        console.log(`\n==========================================`);
        console.log(` 📧 DEVELOPER MODE OTP for ${email}: ${otp}`);
        console.log(` (Add SMTP config to .env to send real emails)`);
        console.log(`==========================================\n`);
      }
    } catch (emailError) {
      console.error('Email Gateway Error:', emailError);
      // We log but don't strictly crash so the user isn't stuck if the gateway hiccups
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for 10 minutes.`,
      // In production NEVER send the OTP in the response
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// ============================================================
//  @desc    Verify OTP and complete email verification
//  @route   POST /api/auth/verify-otp
//  @access  Public
// ============================================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiresAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // ── Check OTP match ─────────────────────────────────────
    if (user.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // ── Check OTP expiry ────────────────────────────────────
    if (user.otpExpiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // ── Mark as verified and clear OTP fields ───────────────
    user.isVerified   = true;
    user.otp          = undefined;
    user.otpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! ⚡',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};

// ============================================================
//  @desc    Login with email + password (returns JWT)
//  @route   POST /api/auth/login
//  @access  Public
// ============================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // ── Fetch user with password (select: false by default) ──
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        // Generic message prevents user enumeration
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful! ⚡',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ============================================================
//  @desc    Get currently logged-in user profile
//  @route   GET /api/auth/me
//  @access  Private (requires JWT)
// ============================================================
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch user profile.' });
  }
};

// ============================================================
//  @desc    Set/Update password for a logged-in user
//  @route   POST /api/auth/set-password
//  @access  Private (requires JWT)
// ============================================================
exports.setPassword = async (req, res) => {
  try {
    const { password, city } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Assign the new password; the Mongoose pre-save hook handles hashing
    user.password = password;
    if (city && user.meters && user.meters.length > 0) {
      user.meters[0].city = city;
    }
    await user.save();

    res.status(200).json({ success: true, message: 'Password configured successfully!', user: sanitizeUser(user) });
  } catch (error) {
    console.error('SetPassword Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

// ============================================================
//  @desc    Add an additional Meter to User's Profile
//  @route   POST /api/auth/add-meter
//  @access  Private (requires JWT)
// ============================================================
exports.addMeter = async (req, res) => {
  try {
    const { meterName, consumerId, buCode, city } = req.body;
    
    if (!meterName || !consumerId || !buCode) {
      return res.status(400).json({ success: false, message: 'Meter Name, Consumer ID, and BU Code are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if consumerId already linked anywhere in DB
    const existingMeter = await User.findOne({ 'meters.consumerId': consumerId });
    if (existingMeter) {
       return res.status(409).json({ success: false, message: 'This Consumer ID is already registered to an account.' });
    }

    user.meters.push({
      meterName,
      consumerId,
      buCode,
      city: city || user.meters[0]?.city || ''
    });

    await user.save();

    res.status(201).json({ success: true, message: `Meter "${meterName}" added successfully!`, user: sanitizeUser(user) });
  } catch (error) {
    console.error('AddMeter Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add meter.' });
  }
};
