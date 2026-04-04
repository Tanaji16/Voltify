// ============================================================
//  Voltify — Appliance Controller
//  controllers/applianceController.js
//
//  Responsibilities:
//   ✅  Add / fetch appliances
//   ✅  Calculate bill with Mahavitaran slab rates
//   ✅  Budget optimiser (freemium-gated advice engine)
// ============================================================

const Appliance = require('../models/Appliance');
const User      = require('../models/User');

// ────────────────────────────────────────────────────────────
//  MAHAVITARAN SLAB RATE ENGINE (Maharashtra, LT-I Domestic)
//  Source: MERC Order 2023-24 (updated periodically)
//
//  Slabs (cumulative units per month):
//   0   – 100  units → ₹3.77 / kWh
//   101 – 300  units → ₹7.73 / kWh  (on units above 100)
//   301 – 500  units → ₹10.21/ kWh  (on units above 300)
//   500+       units → ₹11.26/ kWh  (on units above 500)
//
//  Fixed charges (per month):
//   0-100  → ₹75
//   101-300→ ₹165
//   301-500→ ₹260
//   500+   → ₹355
// ────────────────────────────────────────────────────────────
const MAHAVITARAN_SLABS = [
  { upTo: 100, rate: 3.77,  fixedCharge: 75  },
  { upTo: 300, rate: 7.73,  fixedCharge: 165 },
  { upTo: 500, rate: 10.21, fixedCharge: 260 },
  { upTo: Infinity, rate: 11.26, fixedCharge: 355 },
];

/**
 * calculateSlabBill(totalKwh)
 * ────────────────────────────
 * Applies Mahavitaran progressive slab rates and returns
 * an itemised breakdown plus the total bill in ₹.
 *
 * @param {number} totalKwh - Total monthly consumption in kWh
 * @returns {{ slabBreakdown: Array, energyCharge: number, fixedCharge: number, totalBill: number }}
 */
const calculateSlabBill = (totalKwh) => {
  const units = parseFloat(totalKwh.toFixed(2));

  let remaining     = units;
  let energyCharge  = 0;
  let fixedCharge   = 0;
  const slabBreakdown = [];

  let previousLimit = 0;

  for (const slab of MAHAVITARAN_SLABS) {
    if (remaining <= 0) break;

    const slabCapacity  = slab.upTo === Infinity ? Infinity : slab.upTo - previousLimit;
    const unitsInSlab   = Math.min(remaining, slabCapacity);
    const chargeForSlab = parseFloat((unitsInSlab * slab.rate).toFixed(2));

    slabBreakdown.push({
      range:   slab.upTo === Infinity
                 ? `${previousLimit + 1}+ units`
                 : `${previousLimit + 1}–${slab.upTo} units`,
      units:   parseFloat(unitsInSlab.toFixed(2)),
      rate:    slab.rate,
      charge:  chargeForSlab,
    });

    energyCharge += chargeForSlab;
    fixedCharge   = slab.fixedCharge;   // Only the slab the user falls into
    remaining    -= unitsInSlab;
    previousLimit = slab.upTo === Infinity ? previousLimit : slab.upTo;
  }

  // Electricity Duty (Maharashtra) ≈ 16% on energy charges for domestic
  const electricityDuty = parseFloat((energyCharge * 0.16).toFixed(2));

  const totalBill = parseFloat(
    (energyCharge + fixedCharge + electricityDuty).toFixed(2)
  );

  return {
    totalKwh:      units,
    slabBreakdown,
    energyCharge:  parseFloat(energyCharge.toFixed(2)),
    fixedCharge,
    electricityDuty,
    totalBill,
  };
};

// ============================================================
//  @desc    Add a new appliance for the authenticated user
//  @route   POST /api/appliances/add
//  @access  Private
// ============================================================
exports.addAppliance = async (req, res) => {
  try {
    const {
      applianceName,
      powerRating,
      quantity,
      efficiencyType,
      usageMode,
      basicUsageHours,
      advancedUsageSlots,
      daysUsedPerMonth,
    } = req.body;

    if (!applianceName || !powerRating) {
      return res.status(400).json({
        success: false,
        message: 'Appliance name and power rating are required.',
      });
    }

    const appliance = await Appliance.create({
      userId:             req.user.id,
      applianceName,
      powerRating,
      quantity:           quantity           || 1,
      efficiencyType:     efficiencyType     || 'Standard',
      usageMode:          usageMode          || 'basic',
      basicUsageHours:    basicUsageHours    || 0,
      advancedUsageSlots: advancedUsageSlots || [],
      daysUsedPerMonth:   daysUsedPerMonth   || 30,
    });

    res.status(201).json({
      success: true,
      message: `"${appliance.applianceName}" added successfully ⚡`,
      appliance,
    });
  } catch (error) {
    console.error('Add Appliance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add appliance.' });
  }
};

// ============================================================
//  @desc    Get all appliances for a specific user (dashboard)
//  @route   GET /api/appliances/user/:id
//  @access  Private
// ============================================================
exports.getUserAppliances = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Authorisation: users can only view their own appliances
    if (req.user.id !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorised to view another user\'s appliances.',
      });
    }

    const appliances = await Appliance.find({ userId: targetUserId }).sort({
      createdAt: -1,
    });

    // Prepare graph-ready data (kWh per appliance for recharts)
    const graphData = appliances.map((a) => ({
      name:       a.applianceName,
      kWh:        a.monthlyKwh,
      wattage:    a.powerRating,
      quantity:   a.quantity,
    }));

    res.status(200).json({
      success: true,
      count:      appliances.length,
      appliances,
      graphData,
    });
  } catch (error) {
    console.error('Get Appliances Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appliances.' });
  }
};

// ============================================================
//  @desc    Delete an appliance by ID
//  @route   DELETE /api/appliances/:id
//  @access  Private
// ============================================================
exports.deleteAppliance = async (req, res) => {
  try {
    const appliance = await Appliance.findById(req.params.id);

    if (!appliance) {
      return res.status(404).json({ success: false, message: 'Appliance not found.' });
    }

    if (appliance.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorised to delete this appliance.',
      });
    }

    await appliance.deleteOne();

    res.status(200).json({ success: true, message: 'Appliance deleted successfully.' });
  } catch (error) {
    console.error('Delete Appliance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete appliance.' });
  }
};

// ============================================================
//  @desc    Calculate monthly electricity bill from saved appliances
//  @route   POST /api/calculate-bill
//  @access  Private
// ============================================================
exports.calculateBill = async (req, res) => {
  try {
    const appliances = await Appliance.find({ userId: req.user.id });

    if (!appliances.length) {
      return res.status(400).json({
        success: false,
        message: 'No appliances found. Please add appliances first.',
      });
    }

    // Sum up all monthly kWh values (pre-computed on save)
    const totalKwh = appliances.reduce((sum, a) => sum + (a.monthlyKwh || 0), 0);

    const billDetails = calculateSlabBill(totalKwh);

    // Build per-appliance contribution data
    const applianceContributions = appliances.map((a) => ({
      name:            a.applianceName,
      monthlyKwh:      a.monthlyKwh,
      percentShare:    totalKwh > 0
                         ? parseFloat(((a.monthlyKwh / totalKwh) * 100).toFixed(1))
                         : 0,
    }));

    res.status(200).json({
      success: true,
      ...billDetails,
      applianceContributions,
    });
  } catch (error) {
    console.error('Calculate Bill Error:', error);
    res.status(500).json({ success: false, message: 'Bill calculation failed.' });
  }
};

// ============================================================
//  @desc    Budget optimiser — suggests hour reductions to hit target
//  @route   POST /api/optimize-budget
//  @access  Private (Free users get max 3 uses)
// ============================================================
exports.optimizeBudget = async (req, res) => {
  try {
    const { targetBudget } = req.body;

    if (!targetBudget || targetBudget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid target budget in ₹.',
      });
    }

    // ── Freemium gate (Free tier = max 3 uses) ───────────────
    const user = await User.findById(req.user.id);

    const FREE_TIER_LIMIT = 3;

    if (
      user.subscriptionStatus === 'Free' &&
      user.freemiumAdviceUses >= FREE_TIER_LIMIT
    ) {
      return res.status(403).json({
        success: false,
        freemiumLimitReached: true,
        message: `You've used all ${FREE_TIER_LIMIT} free optimisation suggestions. Upgrade to Pro or Annual for unlimited access!`,
        currentUses: user.freemiumAdviceUses,
        limit:       FREE_TIER_LIMIT,
      });
    }

    // ── Fetch appliances & current bill ─────────────────────
    const appliances = await Appliance.find({ userId: req.user.id });

    if (!appliances.length) {
      return res.status(400).json({
        success: false,
        message: 'No appliances found to optimise.',
      });
    }

    const totalKwh      = appliances.reduce((s, a) => s + (a.monthlyKwh || 0), 0);
    const currentBill   = calculateSlabBill(totalKwh);

    if (currentBill.totalBill <= targetBudget) {
      return res.status(200).json({
        success: true,
        message:      `Great news! Your current bill (₹${currentBill.totalBill}) is already within your target budget of ₹${targetBudget}. No changes needed! 🎉`,
        alreadyWithin: true,
        currentBill:   currentBill.totalBill,
        targetBudget,
        suggestions: [],
      });
    }

    const savingsNeeded = currentBill.totalBill - targetBudget;

    // ── Optimisation Algorithm ───────────────────────────────
    //  Strategy: Sort appliances by power consumption (highest first)
    //  and suggest proportional reductions to the heaviest consumers.
    //  Only appliances using > 5 hours/day are candidates for reduction.

    const EFFECTIVE_RATE = currentBill.energyCharge / (totalKwh || 1); // ₹ per kWh

    const candidates = appliances
      .map((a) => ({
        _id:         a._id,
        name:        a.applianceName,
        powerRating: a.powerRating,
        quantity:    a.quantity,
        currentHours: a.usageMode === 'basic'
          ? a.basicUsageHours
          : a.advancedUsageSlots.reduce((s, sl) => s + sl.hours, 0),
        daysUsedPerMonth: a.daysUsedPerMonth,
        monthlyKwh:  a.monthlyKwh,
      }))
      .filter((a) => a.currentHours > 1)       // Must have reduction room
      .sort((a, b) => b.monthlyKwh - a.monthlyKwh); // Heaviest first

    let remainingSavings = savingsNeeded;
    const suggestions    = [];

    for (const appliance of candidates) {
      if (remainingSavings <= 0) break;

      // kWh saved per hour reduced per day over a month
      const kwhPerHourReduced =
        (appliance.powerRating / 1000) * appliance.quantity * appliance.daysUsedPerMonth;

      // ₹ saved per hour reduced
      const savingsPerHour = kwhPerHourReduced * EFFECTIVE_RATE;

      if (savingsPerHour <= 0) continue;

      // Hours that need to be cut to cover remaining savings
      const hoursToReduce = Math.min(
        remainingSavings / savingsPerHour,
        appliance.currentHours - 0.5  // Always leave at least 30 min
      );

      if (hoursToReduce <= 0.1) continue;  // Skip negligible suggestions

      const roundedHours  = parseFloat(hoursToReduce.toFixed(1));
      const estimatedSave = parseFloat((roundedHours * savingsPerHour).toFixed(2));

      suggestions.push({
        applianceId:       appliance._id,
        applianceName:     appliance.name,
        powerRating:       appliance.powerRating,
        currentHoursPerDay: appliance.currentHours,
        suggestedHoursPerDay: parseFloat(
          (appliance.currentHours - roundedHours).toFixed(1)
        ),
        reduceByHours:     roundedHours,
        estimatedMonthlySaving: estimatedSave,
        impact: appliance.monthlyKwh > totalKwh * 0.3 ? 'High' : 'Medium',
      });

      remainingSavings -= estimatedSave;
    }

    // ── Increment freemium counter ───────────────────────────
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { freemiumAdviceUses: 1 },
    });

    const newUses      = user.freemiumAdviceUses + 1;
    const usesLeft     = user.subscriptionStatus === 'Free'
      ? Math.max(0, FREE_TIER_LIMIT - newUses)
      : null;

    res.status(200).json({
      success:      true,
      currentBill:  currentBill.totalBill,
      targetBudget: parseFloat(targetBudget),
      savingsNeeded: parseFloat(savingsNeeded.toFixed(2)),
      achievable:   remainingSavings <= 0,
      suggestions,
      freemium: {
        usesThisSession: newUses,
        usesLeft,
        isSubscribed:    user.subscriptionStatus !== 'Free',
      },
    });
  } catch (error) {
    console.error('Optimize Budget Error:', error);
    res.status(500).json({ success: false, message: 'Budget optimisation failed.' });
  }
};
