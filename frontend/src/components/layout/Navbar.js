import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../services/AppContext';
import './Navbar.css';

// Static — defined once outside the component so it is never recreated on re-renders
const NAV_LINKS = [
  { path: '/',             key: 'nav.home' },
  { path: '/journey',      key: 'nav.journey' },
  { path: '/simulation',   key: 'nav.simulation' },
  { path: '/constituency', key: 'nav.constituency' },
  { path: '/chat',         key: 'nav.chat' },
  { path: '/mythbuster',   key: 'nav.mythbuster' },
];

export default function Navbar() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { userContext, updateUserContext, t } = useApp();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLanguageToggle = useCallback(() => {
    updateUserContext({ language: userContext.language === 'en' ? 'hi' : 'en' });
  }, [updateUserContext, userContext.language]);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleStartJourney = useCallback(() => {
    navigate('/journey');
  }, [navigate]);

  const currentLang      = userContext.language === 'en' ? 'en' : 'hi';
  const alternateLangLabel = currentLang === 'en' ? 'हिंदी में बदलें' : 'Switch to English';

  return (
    <nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      aria-label="Main navigation"
    >
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" aria-label="VoteSmart — Go to home">
          <div className="navbar__logo" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect width="20" height="20" rx="5" fill="var(--color-accent)" />
              <path d="M5 10l3.5 3.5L15 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="navbar__brand-name">VoteSmart</span>
        </Link>

        <div
          className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}
          role="menubar"
          aria-label="Site links"
        >
          {NAV_LINKS.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                role="menuitem"
                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </div>

        <div className="navbar__actions">
          <button
            className="navbar__lang-btn"
            onClick={handleLanguageToggle}
            aria-label={alternateLangLabel}
            title={alternateLangLabel}
          >
            {currentLang === 'en' ? 'हिं' : 'EN'}
          </button>

          <button className="btn-primary navbar__cta" onClick={handleStartJourney}>
            {t('nav.start')}
          </button>

          <button
            className="navbar__hamburger"
            onClick={handleMobileToggle}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="navbar-links"
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
