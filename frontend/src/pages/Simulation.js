import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulationAPI } from '../services/api';
import { useApp } from '../services/AppContext';
import './Simulation.css';

export default function Simulation() {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const { t } = useApp();
  const feedbackTimer = useRef(null);

  useEffect(() => {
    simulationAPI.start()
      .then(res => { setScene(res.data); setLoading(false); })
      .catch(() => {
        setLoadError('Could not connect to server. Please ensure the backend is running.');
        setLoading(false);
      });
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, []);

  const handleChoice = async (choice) => {
    setChoiceLoading(true);
    setLastFeedback(null);
    try {
      const res = await simulationAPI.makeChoice(scene.id, choice.id);
      const { choice: feedback, nextScene } = res.data;

      const stepMax = Math.max(...(scene.choices || []).map(c => c.score || 0));
      setScore(prev => Math.max(0, prev + feedback.score));
      setMaxScore(prev => prev + Math.max(0, stepMax));
      setLastFeedback(feedback);
      setHistory(prev => [...prev, {
        scene: scene.scene,
        choice: choice.text,
        score: feedback.score,
        correct: feedback.correct,
        feedback: feedback.feedback
      }]);

      feedbackTimer.current = setTimeout(() => {
        setScene(nextScene);
        setLastFeedback(null);
        if (nextScene.isEnd) setGameOver(true);
        setChoiceLoading(false);
      }, 1800);
    } catch (e) {
      setChoiceLoading(false);
      setLastFeedback({ score: 0, correct: false, feedback: 'Could not process your choice. Please try again.' });
    }
  };

  const restart = async () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setLoading(true);
    setGameOver(false);
    setHistory([]);
    setScore(0);
    setMaxScore(0);
    setLastFeedback(null);
    setLoadError('');
    try {
      const res = await simulationAPI.start();
      setScene(res.data);
    } catch {
      setLoadError('Could not reload simulation. Please refresh the page.');
    }
    setLoading(false);
    setStarted(true);
  };

  const scorePercent = maxScore > 0 ? Math.min(100, Math.round((score / maxScore) * 100)) : 0;

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'green';
    if (pct >= 50) return 'amber';
    return 'red';
  };

  if (loading) {
    return (
      <div className="simulation-page">
        <div className="container">
          <div className="sim-loading card">
            <div className="spinner"></div>
            <p className="text-muted">Loading simulation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="simulation-page">
        <div className="container">
          <div className="sim-loading card">
            <p style={{ color: 'var(--color-error)' }}>{loadError}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="simulation-page">
        <div className="simulation-page__header">
          <div className="container">
            <h1>{t('sim.title')}</h1>
            <p className="text-muted">{t('sim.subtitle')}</p>
          </div>
        </div>
        <div className="container">
          <div className="sim-intro card">
            <div className="sim-intro__icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="4" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 14l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Election Day Rehearsal</h2>
            <p className="text-muted">Navigate real-world polling scenarios. Make decisions, face consequences, and learn the right way to vote. Your choices determine the outcome.</p>

            <div className="sim-intro__features">
              {[
                { label: 'Branching scenarios', desc: 'Your choices lead to different paths' },
                { label: 'Real-world situations', desc: 'Based on actual election day challenges' },
                { label: 'Scored feedback', desc: 'Learn what you did right or wrong' }
              ].map(f => (
                <div key={f.label} className="sim-intro__feature">
                  <div className="sim-intro__feature-dot"></div>
                  <div>
                    <div className="sim-intro__feature-label">{f.label}</div>
                    <div className="sim-intro__feature-desc text-small text-muted">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary sim-start-btn" onClick={() => setStarted(true)}>
              {t('sim.start')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l5 4-5 4V4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation-page">
      <div className="simulation-page__header">
        <div className="container">
          <div className="sim-header-row">
            <div>
              <h1>Voter Simulation</h1>
              <p className="text-muted">Navigate election day decisions</p>
            </div>
            <div className="sim-score-display">
              <div className="sim-score-label text-small text-muted">{t('sim.score')}</div>
              <div className="sim-score-value">{score}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="sim-layout">
          <div className="sim-main">
            <AnimatePresence mode="wait">
              {gameOver ? (
                <motion.div key="gameover" className="sim-gameover card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className={`sim-gameover__score badge-${getScoreColor(scorePercent)}`}>
                    <div className="sim-gameover__pct">{scorePercent}%</div>
                    <div className="sim-gameover__label text-small">Simulation Score</div>
                  </div>
                  <h2>{scene?.narrative || 'Simulation Complete'}</h2>
                  <p className="text-muted">
                    {scorePercent >= 80 ? 'Excellent! You are well-prepared for election day.' :
                     scorePercent >= 50 ? 'Good effort. Review the areas where you lost points.' :
                     'Keep learning. Review the feedback below and try again.'}
                  </p>

                  <div className="sim-history">
                    <h4>Decision Review</h4>
                    {history.map((h, i) => (
                      <div key={i} className={`sim-history-item ${h.correct ? 'correct' : h.score < 0 ? 'wrong' : 'partial'}`}>
                        <div className={`sim-history-badge badge badge-${h.correct ? 'green' : h.score < 0 ? 'red' : 'amber'}`}>
                          {h.score > 0 ? `+${h.score}` : h.score}
                        </div>
                        <div>
                          <div className="sim-history-scene text-xs text-muted">{h.scene}</div>
                          <div className="sim-history-choice text-small">{h.choice}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-primary" onClick={restart}>{t('sim.retry')}</button>
                </motion.div>
              ) : (
                <motion.div
                  key={scene?.id}
                  className="sim-scene card"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                >
                  <div className="sim-scene__tag badge badge-blue">{scene?.scene}</div>
                  <div className="sim-scene__narrative-wrap">
                    <div className="sim-narrator-avatar">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="5" r="2.5" stroke="white" strokeWidth="1.3"/>
                        <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="sim-bubble">
                      <div className="sim-bubble-label text-xs">Election Day Narrator</div>
                      <p>{scene?.narrative}</p>
                    </div>
                  </div>

                  {scene?.question && (
                    <div className="sim-scene__question">{scene.question}</div>
                  )}

                  {lastFeedback && (
                    <motion.div
                      className={`sim-feedback ${lastFeedback.correct ? 'sim-feedback--good' : lastFeedback.score < 0 ? 'sim-feedback--bad' : 'sim-feedback--ok'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* FIX: was a broken non-template string: className="badge badge-${...}" */}
                      <span className={`badge badge-${lastFeedback.correct ? 'green' : lastFeedback.score < 0 ? 'red' : 'amber'}`}>
                        {lastFeedback.score > 0 ? `+${lastFeedback.score}` : lastFeedback.score} pts
                      </span>
                      {lastFeedback.feedback}
                    </motion.div>
                  )}

                  <div className="sim-choices">
                    {scene?.choices?.map((choice) => (
                      <button
                        key={choice.id}
                        className="sim-choice-btn"
                        onClick={() => handleChoice(choice)}
                        disabled={choiceLoading}
                      >
                        <span className="sim-choice-letter">{choice.id.charAt(0).toUpperCase()}</span>
                        <span className="sim-choice-text">{choice.text}</span>
                        {choiceLoading && <div className="spinner" style={{ width: 14, height: 14 }}></div>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {history.length > 0 && (
            <div className="sim-sidebar">
              <div className="sim-sidebar__header">
                <h4>Decision History</h4>
                <span className="badge badge-blue">{history.length} decisions</span>
              </div>
              <div className="sim-sidebar__list">
                {history.map((h, i) => (
                  <div key={i} className="sim-sidebar__item">
                    <div className={`sim-sidebar__dot ${h.correct ? 'green' : h.score < 0 ? 'red' : 'amber'}`}></div>
                    <div>
                      <div className="text-xs text-muted">{h.scene}</div>
                      <div className="text-small" style={{ marginTop: 2 }}>{h.score > 0 ? '+' : ''}{h.score} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
