// ============================================================
//  Voltify — Auth API Module
//  src/api/auth.js
// ============================================================

import api from './axios.js';

/**
 * Register a new user (Step 1 of signup — creates the account)
 * POST /api/auth/register
 */
export const register = (data) =>
  api.post('/api/auth/register', data);

/**
 * Send OTP to an email
 * POST /api/auth/send-otp
 * @param {string} email
 */
export const sendOTP = (email) =>
  api.post('/api/auth/send-otp', { email });

/**
 * Verify the OTP and receive a JWT
 * POST /api/auth/verify-otp
 * @param {string} email
 * @param {string} otp
 */
export const verifyOTP = (email, otp) =>
  api.post('/api/auth/verify-otp', { email, otp });

/**
 * Login with email + password → returns JWT
 * POST /api/auth/login
 * @param {string} email
 * @param {string} password
 */
export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

/**
 * Get the current logged-in user's profile
 * GET /api/auth/me
 * (Token is attached automatically by the Axios interceptor)
 */
export const getMe = () =>
  api.get('/api/auth/me');

/**
 * Set a new password and optional city for the current logged-in user
 * POST /api/auth/set-password
 * @param {string} password 
 * @param {string} city
 * @param {string} [overrideToken] - Optional token if not yet stored in localStorage
 */
export const setPassword = (password, city, overrideToken) =>
  api.post('/api/auth/set-password', { password, city }, overrideToken ? { headers: { Authorization: `Bearer ${overrideToken}` } } : undefined);
