// ============================================================
//  Voltify — Payment Controller
//  controllers/paymentController.js
//
//  Integrates a mock Razorpay flow:
//   1. createOrder   → create a Razorpay order / mock order
//   2. verifyPayment → HMAC-SHA256 signature verification
//   3. getMyTransactions → fetch user's payment history
// ============================================================

const crypto      = require('crypto');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');

// ── Subscription plan catalogue ─────────────────────────────
const PLANS = {
  Pro: {
    name:       'Pro',
    amount:     19900,       // ₹199 in paise (Razorpay uses paise)
    amountINR:  199,
    durationDays: 30,
    description: 'Voltify Pro – Monthly Plan',
  },
  Annual: {
    name:       'Annual',
    amount:     149900,      // ₹1499 in paise
    amountINR:  1499,
    durationDays: 365,
    description: 'Voltify Annual Plan – Best Value',
  },
};

// ── Helper: Add N days to today ──────────────────────────────
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

// ============================================================
//  @desc    Create a Razorpay order for subscription upgrade
//  @route   POST /api/payment/create-order
//  @access  Private
// ============================================================
exports.createOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Choose one of: ${Object.keys(PLANS).join(', ')}`,
      });
    }

    const selectedPlan = PLANS[plan];

    // ── Create a pending transaction entry ──────────────────
    const transaction = await Transaction.create({
      userId: req.user.id,
      plan:   selectedPlan.name,
      amount: selectedPlan.amountINR,
      status: 'pending',
    });

    // ── Mock Razorpay order (replace with live SDK in prod) ──
    //  In production:
    //  const Razorpay = require('razorpay');
    //  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    //  const order = await razorpay.orders.create({ amount: selectedPlan.amount, currency: 'INR', receipt: transaction._id.toString() });

    const mockOrderId = `order_MOCK_${Date.now()}`;

    // Persist the mock order id
    transaction.razorpayOrderId = mockOrderId;
    await transaction.save();

    res.status(201).json({
      success: true,
      order: {
        id:       mockOrderId,
        amount:   selectedPlan.amount,
        currency: 'INR',
        plan:     selectedPlan.name,
      },
      transactionId: transaction._id,
      key:           process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      prefill: {
        // Will be used in the Razorpay checkout form
        name:    req.user.fullName || '',
        contact: req.user.phoneNumber || '',
      },
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

// ============================================================
//  @desc    Verify Razorpay payment signature & activate sub
//  @route   POST /api/payment/verify
//  @access  Private
// ============================================================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      transactionId,
    } = req.body;

    // ── Retrieve pending transaction ─────────────────────────
    const transaction = await Transaction.findById(transactionId);

    if (!transaction || transaction.userId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (transaction.status === 'success') {
      return res.status(409).json({
        success: false,
        message: 'This transaction has already been processed.',
      });
    }

    // ── Signature Verification (HMAC-SHA256) ─────────────────
    //  Razorpay signs the payload as: orderId + "|" + paymentId
    //  In mock / dev mode, skip verification when signature is "MOCK_SUCCESS"
    let isSignatureValid = false;

    if (razorpaySignature === 'MOCK_SUCCESS') {
      isSignatureValid = true;
    } else {
      const body           = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSig    = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');
      isSignatureValid     = expectedSig === razorpaySignature;
    }

    if (!isSignatureValid) {
      transaction.status = 'failed';
      await transaction.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // ── Activate Subscription ─────────────────────────────────
    const plan         = PLANS[transaction.plan];
    const startsAt     = new Date();
    const endsAt       = addDays(plan.durationDays);

    transaction.razorpayOrderId   = razorpayOrderId;
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    transaction.status            = 'success';
    transaction.subscriptionStartsAt = startsAt;
    transaction.subscriptionEndsAt   = endsAt;
    await transaction.save();

    // ── Update User subscription ─────────────────────────────
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        subscriptionStatus:    transaction.plan,
        subscriptionExpiresAt: endsAt,
        $push:                 { transactions: transaction._id },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `🎉 Payment successful! You are now on the ${transaction.plan} plan.`,
      subscription: {
        plan:      updatedUser.subscriptionStatus,
        expiresAt: updatedUser.subscriptionExpiresAt,
      },
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

// ============================================================
//  @desc    Get all transactions for the authenticated user
//  @route   GET /api/payment/my-transactions
//  @access  Private
// ============================================================
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count:        transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
};

// ============================================================
//  @desc    Get available subscription plans
//  @route   GET /api/payment/plans
//  @access  Public
// ============================================================
exports.getPlans = async (_req, res) => {
  const publicPlans = Object.values(PLANS).map((p) => ({
    name:        p.name,
    amountINR:   p.amountINR,
    durationDays: p.durationDays,
    description: p.description,
  }));

  res.status(200).json({ success: true, plans: publicPlans });
};
