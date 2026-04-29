/**
 * Home.test.js
 * Unit tests for the Home page — hero, stats, demo flow, feature cards
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../services/AppContext';
import Home from './Home';

// Suppress framer-motion in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  const m = new Proxy(
    {},
    {
      get: (_, tag) =>
        React.forwardRef(({ children, ...props }, ref) =>
          React.createElement('div', { ...props, ref }, children)
        ),
    }
  );
  return { motion: m, AnimatePresence: ({ children }) => children };
});

const renderHome = () =>
  render(
    <AppProvider>
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    </AppProvider>
  );

describe('Home page', () => {
  it('renders the hero section with a heading', () => {
    renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it('renders the hero subtitle text', () => {
    renderHome();
    expect(screen.getByText(/VoteSmart combines AI/i)).toBeInTheDocument();
  });

  it('renders "Start Your Journey" primary CTA button', () => {
    renderHome();
    const ctaButtons = screen.getAllByText('Start Your Journey');
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Try Simulation" secondary CTA button', () => {
    renderHome();
    expect(screen.getByText('Try Simulation')).toBeInTheDocument();
  });

  it('renders all 4 stat cards', () => {
    renderHome();
    expect(screen.getByText('900M+')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('543')).toBeInTheDocument();
  });

  it('renders all 5 feature cards', () => {
    renderHome();
    expect(screen.getByText('Guided Voter Journey')).toBeInTheDocument();
    expect(screen.getByText('Voter Simulation')).toBeInTheDocument();
    expect(screen.getByText('Constituency Insights')).toBeInTheDocument();
    expect(screen.getByText('AI Election Coach')).toBeInTheDocument();
    expect(screen.getByText('MythBuster')).toBeInTheDocument();
  });

  it('renders the 6-step demo flow section', () => {
    renderHome();
    expect(screen.getByText('From zero to confident voter in 6 steps')).toBeInTheDocument();
    expect(screen.getByText('Enter your location')).toBeInTheDocument();
    expect(screen.getByText('Ask the AI coach')).toBeInTheDocument();
  });

  it('renders the bottom CTA banner', () => {
    renderHome();
    expect(screen.getByText('Ready to become an informed voter?')).toBeInTheDocument();
  });

  it('hero CTA navigates to /journey on click', () => {
    renderHome();
    const [primaryBtn] = screen.getAllByText('Start Your Journey');
    fireEvent.click(primaryBtn);
    expect(window.location.pathname).toBe('/journey');
  });
});
