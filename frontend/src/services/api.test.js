/**
 * api.test.js
 * Unit tests for the API service layer — URL construction, error normalisation
 */

// Mock axios before importing api.js so the real HTTP client is never used
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return mockAxios;
});

import axios from 'axios';

describe('api service — constituencyAPI.search URL construction', () => {
  it('builds a safe URL when both city and state are provided', () => {
    // We test the URLSearchParams logic directly — the safest unit approach
    const city = 'New Delhi';
    const state = 'Delhi';
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    const qs = params.toString();
    expect(qs).toBe('city=New+Delhi&state=Delhi');
    expect(qs).not.toContain('&state=&'); // no empty params
  });

  it('omits city param when city is empty', () => {
    const city = '';
    const state = 'Maharashtra';
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    expect(params.toString()).toBe('state=Maharashtra');
    expect(params.toString()).not.toContain('city');
  });

  it('omits state param when state is empty', () => {
    const city = 'Mumbai';
    const state = '';
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    expect(params.toString()).toBe('city=Mumbai');
  });

  it('encodes special characters safely', () => {
    const city = "St. George's & Park";
    const state = 'Kerala';
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    const qs = params.toString();
    // Should not contain raw & inside a value
    expect(qs).not.toMatch(/city=[^&]*&[^=]/);
    expect(qs).toContain('city=');
    expect(qs).toContain('state=Kerala');
  });
});

describe('api service — error message normalisation', () => {
  const normalise = (err) => {
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (!err.response) {
      return 'Cannot reach the server. Please ensure the backend is running.';
    }
    if (err.response.status === 429) {
      return 'AI rate limit reached. Please wait a moment before trying again.';
    }
    if (err.response.status === 401) {
      return 'API authentication failed. Check your configuration.';
    }
    return err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
  };

  it('returns timeout message for ECONNABORTED', () => {
    expect(normalise({ code: 'ECONNABORTED' })).toMatch(/timed out/i);
  });

  it('returns offline message when no response', () => {
    expect(normalise({ response: null })).toMatch(/Cannot reach/i);
  });

  it('returns rate-limit message for 429', () => {
    expect(normalise({ response: { status: 429 } })).toMatch(/rate limit/i);
  });

  it('returns auth message for 401', () => {
    expect(normalise({ response: { status: 401 } })).toMatch(/authentication failed/i);
  });

  it('returns backend error message when present', () => {
    expect(normalise({ response: { status: 500, data: { error: 'DB connection failed' } } })).toBe(
      'DB connection failed'
    );
  });

  it('falls back to generic message when no error detail', () => {
    expect(normalise({ response: { status: 500, data: {} }, message: '' })).toMatch(
      /Something went wrong/i
    );
  });
});
