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
 * Fetch all appliances for a user (graph data included) for a specfic meter
 * GET /api/appliances/user/:userId?meterId=...
 * @param {string} userId
 * @param {string} meterId
 */
export const getUserAppliances = (userId, meterId) =>
  api.get(`/api/appliances/user/${userId}?meterId=${meterId}`);

/**
 * Delete an appliance by ID
 * DELETE /api/appliances/:id
 * @param {string} applianceId
 */
export const deleteAppliance = (applianceId) =>
  api.delete(`/api/appliances/${applianceId}`);

/**
 * Calculate the monthly electricity bill from all saved appliances for a specific meter
 * POST /api/appliances/calculate-bill
 */
export const calculateBill = (meterId) =>
  api.post('/api/appliances/calculate-bill', { meterId });

/**
 * Get budget optimisation suggestions for specific meter
 * POST /api/appliances/optimize-budget
 * @param {number} targetBudget - target monthly bill in ₹
 * @param {string} meterId
 */
export const optimizeBudget = (targetBudget, meterId) =>
  api.post('/api/appliances/optimize-budget', { targetBudget, meterId });
