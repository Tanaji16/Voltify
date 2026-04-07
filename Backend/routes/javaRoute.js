/**
 * javaRoute.js
 * 
 * Express route that calls the Java EnergyCalculator utility
 * and returns electricity bill estimates.
 * 
 * POST /api/java/calculate
 * Body: { wattage: number, hoursPerDay: number }
 */

const express = require("express");
const router = express.Router();
const { runJavaCalculator } = require("../utils/javaCalculator");

router.post("/calculate", async (req, res) => {
  try {
    const { wattage, hoursPerDay } = req.body;

    if (!wattage || !hoursPerDay) {
      return res.status(400).json({ error: "wattage and hoursPerDay are required" });
    }

    if (wattage <= 0 || hoursPerDay <= 0 || hoursPerDay > 24) {
      return res.status(400).json({ error: "Invalid input values" });
    }

    // ✅ This calls the Java program via Node's child_process
    const result = await runJavaCalculator(wattage, hoursPerDay);

    res.json({
      success: true,
      source: "Java EnergyCalculator (Maharashtra Slab Rates)",
      input: { wattage, hoursPerDay },
      ...result,
    });
  } catch (err) {
    console.error("Java calculator error:", err.message);
    res.status(500).json({ error: "Java calculation failed", details: err.message });
  }
});

module.exports = router;
