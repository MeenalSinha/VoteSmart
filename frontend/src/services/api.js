/**
 * api.js — Axios API service layer
 *
 * Production features:
 *  - Base URL from REACT_APP_API_URL (dev proxy fallback)
 *  - 30s request timeout with user-friendly error messages
 *  - Response interceptor unwraps { success, data } envelope
 *  - Error interceptor normalises error messages across network/API/timeout
 *  - Optional X-Api-Key header (set REACT_APP_API_KEY env var)
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    // If backend API key auth is enabled, inject it on every request
    ...(process.env.REACT_APP_API_KEY ? { 'X-Api-Key': process.env.REACT_APP_API_KEY } : {}),
  },
});

// ── Response interceptor ───────────────────────────────────────────────────
// Unwrap the { success, data } envelope so callers get data directly.
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // Timeout
    if (err.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error('Request timed out. Please check your connection and try again.')
      );
    }
    // Network error (backend offline)
    if (!err.response) {
      return Promise.reject(
        new Error('Cannot reach the server. Please ensure the backend is running.')
      );
    }
    // AI rate limit
    if (err.response.status === 429) {
      return Promise.reject(
        new Error('AI rate limit reached. Please wait a moment before trying again.')
      );
    }
    // Unauthorised (API key mismatch)
    if (err.response.status === 401) {
      return Promise.reject(new Error('API authentication failed. Check your configuration.'));
    }
    // Backend error with message
    const message =
      err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

// ── API modules ────────────────────────────────────────────────────────────

export const journeyAPI = {
  generate: (location, voterType, language) =>
    api.post('/journey/generate', { location, voterType, language }),
  getVoterTypes: () => api.get('/journey/voter-types'),
};

export const simulationAPI = {
  start: () => api.get('/simulation/start'),
  makeChoice: (currentSceneId, choiceId) =>
    api.post('/simulation/choice', { currentSceneId, choiceId }),
};

export const constituencyAPI = {
  getLocations: () => api.get('/constituency/locations'),
  search: (city, state) => {
    // Use URLSearchParams to safely encode values — prevents injection via special chars
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    return api.get(`/constituency/search?${params.toString()}`);
  },
  getById: (id) => api.get(`/constituency/${id}`),
  getInsights: (id, language) => api.post(`/constituency/${id}/insights`, { language }),
};

export const chatAPI = {
  sendMessage: (messages, userContext, language) =>
    api.post('/chat/message', { messages, userContext, language }),
  getSuggestions: (language) => api.get(`/chat/suggestions?language=${language || 'en'}`),
};

export const mythbusterAPI = {
  checkClaim: (claim, language) => api.post('/mythbuster/check', { claim, language }),
  getExamples: () => api.get('/mythbuster/examples'),
};

export default api;
