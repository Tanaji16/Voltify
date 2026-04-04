// ============================================================
//  Voltify — Appliances API Module
//  src/api/appliances.js
// ============================================================

import api from './axios.js';

/**
 * Add a new appliance
 * POST /api/appliances/add
 * @param {Object} data - { applianceName, powerRating, quantity, usageMode,
 *                          basicUsageHours, advancedUsageSlots,
 *                          daysUsedPerMonth, efficiencyType }
 */
export const addAppliance = (data) =>
  api.post('/api/appliances/add', data);

/**
 * Fetch all appliances for a user (graph data included)
 * GET /api/appliances/user/:userId
 * @param {string} userId
 */
export const getUserAppliances = (userId) =>
  api.get(`/api/appliances/user/${userId}`);

/**
 * Delete an appliance by ID
 * DELETE /api/appliances/:id
 * @param {string} applianceId
 */
export const deleteAppliance = (applianceId) =>
  api.delete(`/api/appliances/${applianceId}`);

/**
 * Calculate the monthly electricity bill from all saved appliances
 * POST /api/appliances/calculate-bill
 */
export const calculateBill = () =>
  api.post('/api/appliances/calculate-bill');

/**
 * Get budget optimisation suggestions
 * POST /api/appliances/optimize-budget
 * @param {number} targetBudget - target monthly bill in ₹
 */
export const optimizeBudget = (targetBudget) =>
  api.post('/api/appliances/optimize-budget', { targetBudget });
