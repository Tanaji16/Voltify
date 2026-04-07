// ============================================================
//  Voltify — Challenges API Module
//  src/api/challenges.js
// ============================================================

import api from './axios.js';

/** GET /api/challenges — all user challenges (history) */
export const getChallenges = () =>
  api.get('/api/challenges');

/** GET /api/challenges/catalogue — available presets + join status */
export const getCatalogue = () =>
  api.get('/api/challenges/catalogue');

/** GET /api/challenges/badges — all earned badges */
export const getBadges = () =>
  api.get('/api/challenges/badges');

/**
 * POST /api/challenges/join
 * @param {string} challengeId
 * @param {number|null} baselineUnits  (required for cut10 / under200)
 */
export const joinChallenge = (challengeId, baselineUnits = null) =>
  api.post('/api/challenges/join', { challengeId, baselineUnits });

/**
 * POST /api/challenges/:id/verify
 * @param {string} id           - Challenge document _id
 * @param {number|null} currentUnits
 */
export const verifyChallenge = (id, currentUnits = null) =>
  api.post(`/api/challenges/${id}/verify`, { currentUnits });
