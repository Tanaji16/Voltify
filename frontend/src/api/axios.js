// ============================================================
//  Voltify — Axios Base Instance
//  src/api/axios.js
//
//  All API calls go through this file. It automatically:
//   ✅  Points to the backend base URL
//   ✅  Attaches the JWT token from localStorage on every request
//   ✅  Handles 401 (token expired) → clears storage, reloads to /login
// ============================================================

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,          // 10 s timeout — surface dead-server errors quickly
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────
// Attach Bearer token before every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voltify_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────────────
// Handle 401 globally (expired / invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and force the user back to login
      localStorage.removeItem('voltify_token');
      localStorage.removeItem('voltify_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
