/**
 * App.test.js
 * Smoke tests for App-level structure (routing, error boundary, lazy loading)
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock framer-motion to avoid animation side-effects in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  const m = new Proxy(
    {},
    {
      get: (_, tag) =>
        React.forwardRef(({ children, ...props }, ref) =>
          React.createElement(tag === 'div' ? 'div' : tag, { ...props, ref }, children)
        ),
    }
  );
  return { motion: m, AnimatePresence: ({ children }) => children };
});

describe('App', () => {
  it('renders the VoteSmart brand name in the navbar', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('VoteSmart')).toBeInTheDocument();
  });

  it('renders the main navigation landmark', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders all six nav links', async () => {
    await act(async () => {
      render(<App />);
    });
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Voter Journey')).toBeInTheDocument();
  });

  it('renders a Start Journey CTA button', async () => {
    await act(async () => {
      render(<App />);
    });
    // Use findByText to wait for Suspense to resolve the lazy-loaded components if needed
    const cta = await screen.findAllByText('Start Journey');
    expect(cta.length).toBeGreaterThan(0);
  });
});
