// ============================================================
//  Voltify — Challenge Controller
//  controllers/challengeController.js
// ============================================================

const Challenge = require('../models/Challenge');

// ── Preset challenge catalogue ────────────────────────────────
const CHALLENGE_CATALOGUE = {
  cut10: {
    challengeId:        'cut10',
    title:              'Cut Usage by 10%',
    description:        'Reduce your monthly electricity usage by at least 10% compared to last month.',
    emoji:              '⚡',
    targetReductionPct: 10,
    targetMaxUnits:     null,
    badge: { icon: '⚡', label: '10% Reducer', color: '#2563EB' },
  },
  under200: {
    challengeId:        'under200',
    title:              'Night Owl Saver',
    description:        'Keep your total monthly usage under 200 kWh this billing cycle.',
    emoji:              '🌙',
    targetReductionPct: null,
    targetMaxUnits:     200,
    badge: { icon: '🌙', label: 'Night Owl', color: '#7C3AED' },
  },
  no_ac_weekend: {
    challengeId:        'no_ac_weekend',
    title:              'No-AC Weekend',
    description:        'Log at least one weekend where you skipped AC usage entirely.',
    emoji:              '❄️',
    targetReductionPct: null,
    targetMaxUnits:     null,
    badge: { icon: '❄️', label: 'Cool Without AC', color: '#0EA5E9' },
  },
  green_streak: {
    challengeId:        'green_streak',
    title:              'Green Streak',
    description:        'Stay under your personal monthly average for 3 consecutive months.',
    emoji:              '🌿',
    targetReductionPct: null,
    targetMaxUnits:     null,
    badge: { icon: '🌿', label: 'Green Streaker', color: '#16A34A' },
  },
};

// ── Helper: current month/year ────────────────────────────────
function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// ============================================================
//  @desc   List all challenges for the logged-in user
//  @route  GET /api/challenges
//  @access Private
// ============================================================
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, challenges });
  } catch (err) {
    console.error('GetChallenges Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch challenges.' });
  }
};

// ============================================================
//  @desc   Return all available preset challenges
//  @route  GET /api/challenges/catalogue
//  @access Private
// ============================================================
exports.getCatalogue = async (req, res) => {
  try {
    const { month, year } = currentPeriod();
    // Find which ones the user already joined this month
    const joined = await Challenge.find({
      userId:      req.user._id,
      targetMonth: month,
      targetYear:  year,
    }).select('challengeId status');

    const joinedMap = {};
    joined.forEach(c => { joinedMap[c.challengeId] = c.status; });

    const catalogue = Object.values(CHALLENGE_CATALOGUE).map(c => ({
      ...c,
      joinedStatus: joinedMap[c.challengeId] || null,
    }));

    res.status(200).json({ success: true, catalogue });
  } catch (err) {
    console.error('GetCatalogue Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch catalogue.' });
  }
};

// ============================================================
//  @desc   Join a challenge
//  @route  POST /api/challenges/join
//  @body   { challengeId, baselineUnits? }
//  @access Private
// ============================================================
exports.joinChallenge = async (req, res) => {
  try {
    const { challengeId, baselineUnits } = req.body;

    if (!challengeId) {
      return res.status(400).json({ success: false, message: 'challengeId is required.' });
    }

    const preset = CHALLENGE_CATALOGUE[challengeId];
    if (!preset) {
      return res.status(404).json({ success: false, message: 'Unknown challenge.' });
    }

    const { month, year } = currentPeriod();

    // Prevent duplicate for same month
    const existing = await Challenge.findOne({
      userId: req.user._id, challengeId, targetMonth: month, targetYear: year,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already joined this challenge for this month.',
        challenge: existing,
      });
    }

    const challenge = await Challenge.create({
      userId:             req.user._id,
      challengeId:        preset.challengeId,
      title:              preset.title,
      description:        preset.description,
      emoji:              preset.emoji,
      targetMonth:        month,
      targetYear:         year,
      baselineUnits:      baselineUnits ?? null,
      targetReductionPct: preset.targetReductionPct,
      targetMaxUnits:     preset.targetMaxUnits,
      badge:              preset.badge,
      status:             'active',
    });

    res.status(201).json({ success: true, message: `You joined "${preset.title}"! 🎯`, challenge });
  } catch (err) {
    console.error('JoinChallenge Error:', err);
    res.status(500).json({ success: false, message: 'Failed to join challenge.' });
  }
};

// ============================================================
//  @desc   Verify / manually complete a challenge
//  @route  POST /api/challenges/:id/verify
//  @body   { currentUnits? }   (provide units for reduction challenges)
//  @access Private
// ============================================================
exports.verifyChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Challenge is already ${challenge.status}.`,
      });
    }

    const { currentUnits } = req.body;
    let passed = true;
    let reason = '';

    // Percentage reduction check
    if (challenge.targetReductionPct !== null && challenge.baselineUnits) {
      if (currentUnits == null) {
        return res.status(400).json({ success: false, message: 'currentUnits is required for this challenge.' });
      }
      const required = challenge.baselineUnits * (1 - challenge.targetReductionPct / 100);
      if (currentUnits > required) {
        passed = false;
        reason = `You used ${currentUnits} kWh but needed to stay under ${Math.round(required)} kWh.`;
      }
    }

    // Max units check
    if (challenge.targetMaxUnits !== null && currentUnits != null) {
      if (currentUnits > challenge.targetMaxUnits) {
        passed = false;
        reason = `You used ${currentUnits} kWh but needed to stay under ${challenge.targetMaxUnits} kWh.`;
      }
    }

    // For manual challenges (no_ac_weekend, green_streak) — user self-certifies
    if (passed) {
      challenge.status      = 'completed';
      challenge.completedAt = new Date();
      await challenge.save();

      return res.status(200).json({
        success:   true,
        message:   `🎉 Challenge "${challenge.title}" completed! You earned the ${challenge.badge.label} badge!`,
        challenge,
        badge:     challenge.badge,
      });
    } else {
      challenge.status = 'failed';
      await challenge.save();

      return res.status(200).json({
        success:  false,
        message:  `Challenge not met. ${reason}`,
        challenge,
      });
    }
  } catch (err) {
    console.error('VerifyChallenge Error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify challenge.' });
  }
};

// ============================================================
//  @desc   Get all earned badges for the user
//  @route  GET /api/challenges/badges
//  @access Private
// ============================================================
exports.getBadges = async (req, res) => {
  try {
    const completed = await Challenge.find({
      userId: req.user._id,
      status: 'completed',
    }).select('badge title completedAt emoji');

    const badges = completed.map(c => ({
      ...c.badge,
      title:       c.title,
      emoji:       c.emoji,
      completedAt: c.completedAt,
    }));

    res.status(200).json({ success: true, badges });
  } catch (err) {
    console.error('GetBadges Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch badges.' });
  }
};
