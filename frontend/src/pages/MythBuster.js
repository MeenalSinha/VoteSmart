import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mythbusterAPI } from '../services/api';
import { useApp } from '../services/AppContext';
import { analyticsEvents } from '../services/firebase';
import './MythBuster.css';

// Verdict config outside component — stable reference, no recreation on render
const VERDICT_CONFIG = {
  'True': {
    color: 'green',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  'False': {
    color: 'red',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  'Misleading': {
    color: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3L18.66 17H1.34L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 8v4M10 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  'Partially True': {
    color: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v5M10 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
};

export default function MythBuster() {
  const { userContext, t } = useApp();
  const [claim, setClaim]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [examples, setExamples] = useState([]);
  const [history, setHistory]   = useState([]);

  useEffect(() => {
    mythbusterAPI.getExamples().then(res => setExamples(res.data)).catch(() => {});
  }, []);

  const handleCheck = useCallback(async () => {
    if (!claim.trim() || claim.trim().length < 10) {
      setError('Please enter a claim of at least 10 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await mythbusterAPI.checkClaim(claim.trim(), userContext.language);
      setResult(res.data);
      setHistory(prev => [{ claim: claim.trim(), result: res.data }, ...prev.slice(0, 4)]);
      analyticsEvents.mythChecked(claim.trim().length);
    } catch (e) {
      setError(e.message || 'Could not analyze the claim. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [claim, userContext.language]);

  const handleExample = useCallback((ex) => {
    setClaim(ex);
    setResult(null);
    setError('');
  }, []);

  const handleClaimChange = useCallback((e) => {
    setClaim(e.target.value);
    setError('');
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) handleCheck();
  }, [handleCheck]);

  const config = result ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['Misleading']) : null;

  return (
    <main className="mythbuster-page" role="main">
      <div className="mythbuster-page__header">
        <div className="container">
          <h1>{t('myth.title')}</h1>
          <p className="text-muted">{t('myth.subtitle')}</p>
        </div>
      </div>

      <div className="container">
        <div className="mythbuster-layout">
          <div className="mythbuster-main">
            {/* Input card */}
            <div className="mythbuster-input-card card">
              <div className="mythbuster-input-header">
                <div className="mythbuster-input-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2l2 6h6l-4.8 3.5 1.8 6L10 14l-5 3.5 1.8-6L2 8h6l2-6z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h2>Fact-Check a Claim</h2>
                  <p className="text-small text-muted">Paste any election-related claim to verify its accuracy</p>
                </div>
              </div>

              <label htmlFor="myth-claim" className="sr-only">
                Election claim to fact-check
              </label>
              <textarea
                id="myth-claim"
                className="mythbuster-textarea"
                placeholder={t('myth.placeholder')}
                value={claim}
                onChange={handleClaimChange}
                onKeyDown={handleKeyDown}
                rows={3}
                maxLength={500}
                aria-describedby={error ? 'myth-error' : 'myth-char-count'}
                aria-invalid={!!error}
              />

              {error && (
                <div
                  id="myth-error"
                  className="mythbuster-error"
                  role="alert"
                  aria-live="assertive"
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="mythbuster-input-footer">
                <span id="myth-char-count" className="text-xs text-muted" aria-live="polite">
                  {claim.length}/500 characters
                </span>
                <button
                  className="btn-primary"
                  onClick={handleCheck}
                  disabled={loading || !claim.trim()}
                  aria-busy={loading}
                  aria-label={loading ? 'Analyzing claim…' : t('myth.check')}
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner"
                        style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                        aria-hidden="true"
                      />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      {t('myth.check')}
                      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M7.5 1.5L9.5 6l5 .5-3.5 3.5 1 5L7.5 12.5l-4.5 2.5 1-5L.5 6.5l5-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result — aria-live so screen readers announce the verdict */}
            <div aria-live="polite" aria-atomic="true">
              <AnimatePresence>
                {result && config && (
                  <motion.div
                    className={`mythbuster-result card mythbuster-result--${config.color}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="region"
                    aria-label={`Fact-check result: ${result.verdict}`}
                  >
                    <div className="mythbuster-verdict">
                      <div className={`mythbuster-verdict-icon verdict-${config.color}`} aria-hidden="true">
                        {config.icon}
                      </div>
                      <div className="mythbuster-verdict-info">
                        <div className={`mythbuster-verdict-label verdict-text-${config.color}`}>
                          {result.verdict}
                        </div>
                        <div className="mythbuster-confidence">
                          <div
                            className="mythbuster-confidence-bar"
                            role="meter"
                            aria-valuenow={result.confidence}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Confidence: ${result.confidence}%`}
                          >
                            <div
                              className={`mythbuster-confidence-fill fill-${config.color}`}
                              style={{ width: `${result.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted">{result.confidence}% confidence</span>
                        </div>
                      </div>
                    </div>

                    <div className="mythbuster-claim-echo">
                      <span className="text-xs text-muted">Claim analyzed</span>
                      <p className="text-small">{claim}</p>
                    </div>

                    <div className="mythbuster-explanation">
                      <h3>Explanation</h3>
                      <p>{result.explanation}</p>
                    </div>

                    {result.context && (
                      <div className="mythbuster-context">
                        <h3>Context</h3>
                        <p>{result.context}</p>
                      </div>
                    )}

                    {result.sources && result.sources.length > 0 && (
                      <div className="mythbuster-sources">
                        <h3>Where to verify</h3>
                        <div className="mythbuster-sources-list">
                          {result.sources.map((s, i) => (
                            <div key={`src-${i}`} className="mythbuster-source-item">
                              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M2 6.5C2 4.015 4.015 2 6.5 2M6.5 11C8.985 11 11 8.985 11 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <path d="M4 4l5 5M9 4v5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History */}
            {history.length > 1 && (
              <div className="mythbuster-history card">
                <h3>Recent Checks</h3>
                <div className="mythbuster-history-list">
                  {history.slice(1).map((h, i) => {
                    const c = VERDICT_CONFIG[h.result.verdict] || VERDICT_CONFIG['Misleading'];
                    return (
                      <button
                        key={`hist-${i}`}
                        className="mythbuster-history-item"
                        onClick={() => handleExample(h.claim)}
                        aria-label={`Re-check: ${h.claim.substring(0, 70)}`}
                      >
                        <div className={`mythbuster-history-dot dot-${c.color}`} aria-hidden="true" />
                        <div>
                          <div className="text-small">
                            {h.claim.substring(0, 70)}{h.claim.length > 70 ? '...' : ''}
                          </div>
                          <div className={`text-xs verdict-text-${c.color}`}>{h.result.verdict}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="mythbuster-sidebar" aria-label="MythBuster tools">
            <div className="card">
              <h2>{t('myth.examples')}</h2>
              <div className="mythbuster-examples">
                {examples.map((ex, i) => (
                  <button key={`ex-${i}`} className="mythbuster-example-btn" onClick={() => handleExample(ex)}>
                    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5h9M8 3l3.5 3.5L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Verdict Guide</h2>
              <div className="mythbuster-guide">
                {Object.entries(VERDICT_CONFIG).map(([verdict, cfg]) => (
                  <div key={verdict} className={`mythbuster-guide-item guide-${cfg.color}`}>
                    <div className={`mythbuster-guide-icon verdict-${cfg.color}`} aria-hidden="true">
                      {cfg.icon}
                    </div>
                    <div>
                      <div className={`text-small font-medium verdict-text-${cfg.color}`}>{verdict}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
