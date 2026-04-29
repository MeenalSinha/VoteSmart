/**
 * AppContext.test.js
 * Unit tests for AppContext — state management, persistence, i18n helper
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppProvider, useApp } from '../services/AppContext';

// ── Helper component to expose context values ──────────────────────────────
function ContextConsumer({ onMount }) {
  const ctx = useApp();
  React.useEffect(() => {
    onMount(ctx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <span data-testid="language">{ctx.userContext.language}</span>
      <span data-testid="city">{ctx.userContext.city}</span>
      <button data-testid="set-city" onClick={() => ctx.updateUserContext({ city: 'Mumbai' })}>
        Set City
      </button>
      <button data-testid="clear" onClick={() => ctx.clearSession()}>
        Clear
      </button>
      <span data-testid="t-home-badge">{ctx.t('home.hero.badge')}</span>
      <span data-testid="t-nav-home">{ctx.t('nav.home')}</span>
    </div>
  );
}

const renderWithProvider = (onMount = () => {}) =>
  render(
    <AppProvider>
      <ContextConsumer onMount={onMount} />
    </AppProvider>
  );

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default English language', () => {
    renderWithProvider();
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('provides default empty city', () => {
    renderWithProvider();
    expect(screen.getByTestId('city').textContent).toBe('');
  });

  it('updateUserContext merges partial updates', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('set-city'));
    expect(screen.getByTestId('city').textContent).toBe('Mumbai');
    // language should still be 'en'
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('clearSession resets state', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('set-city'));
    expect(screen.getByTestId('city').textContent).toBe('Mumbai');
    fireEvent.click(screen.getByTestId('clear'));
    expect(screen.getByTestId('city').textContent).toBe('');
  });

  it('t() returns English string for home.hero.badge', () => {
    renderWithProvider();
    expect(screen.getByTestId('t-home-badge').textContent).toBe('AI-Powered Civic Tool');
  });

  it('t() returns English string for nav.home', () => {
    renderWithProvider();
    expect(screen.getByTestId('t-nav-home').textContent).toBe('Home');
  });

  it('t() returns the key itself for unknown keys', () => {
    function UnknownKeyConsumer() {
      const { t } = useApp();
      return <span data-testid="unknown">{t('some.unknown.key')}</span>;
    }
    render(
      <AppProvider>
        <UnknownKeyConsumer />
      </AppProvider>
    );
    expect(screen.getByTestId('unknown').textContent).toBe('some.unknown.key');
  });

  it('useApp throws when used outside AppProvider', () => {
    // Suppress React's error boundary console output
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function BadConsumer() {
      useApp(); // should throw
      return null;
    }
    expect(() => render(<BadConsumer />)).toThrow('useApp must be used within AppProvider');
    spy.mockRestore();
  });

  it('persists userContext to localStorage on update', () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId('set-city'));
    const stored = JSON.parse(localStorage.getItem('votesmart_session'));
    expect(stored?.userContext?.city).toBe('Mumbai');
  });
});
