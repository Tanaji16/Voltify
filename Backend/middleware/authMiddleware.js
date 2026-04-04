// ============================================================
//  Voltify — JWT Auth Middleware
//  middleware/authMiddleware.js
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect
 * ────────
 * Validates the Bearer JWT in the Authorization header.
 * Attaches the decoded user object to req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Support "Authorization: Bearer <token>" header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user data to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but the user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * requireSubscription
 * ────────────────────
 * Use AFTER protect. Restricts route to Pro / Annual subscribers.
 */
const requireSubscription = (req, res, next) => {
  if (!req.user || req.user.subscriptionStatus === 'Free') {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a Pro or Annual subscription. Upgrade to unlock! ⚡',
    });
  }
  next();
};

module.exports = { protect, requireSubscription };
