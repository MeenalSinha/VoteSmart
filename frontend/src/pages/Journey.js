import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../services/AppContext';
import { journeyAPI, constituencyAPI } from '../services/api';
import { analyticsEvents } from '../services/firebase';
import jsPDF from 'jspdf';
import './Journey.css';

const STEPS = [
  { id: 'location', label: 'Location', desc: 'Where do you vote?' },
  { id: 'voter-type', label: 'Voter Type', desc: 'Tell us about yourself' },
  { id: 'generating', label: 'Generating', desc: 'Building your journey' },
  { id: 'journey', label: 'Your Journey', desc: 'Personalized guide' },
];

const CARD_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function Journey() {
  const { userContext, updateUserContext, setJourneyData, journeyData, t } = useApp();
  const [step, setStep] = useState(userContext.city && journeyData ? 3 : 0);
  const [locations, setLocations] = useState({ countries: [], states: {}, cities: {} });
  const [voterTypes, setVoterTypes] = useState([]);
  const [selectedVoterType, setSelectedVoterType] = useState(userContext.voterType || '');
  const [country, setCountry] = useState(userContext.country || '');
  const [state, setState] = useState(userContext.state || '');
  const [city, setCity] = useState(userContext.city || '');
  const [activeJourneyStep, setActiveJourneyStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    constituencyAPI
      .getLocations()
      .then((res) => setLocations(res.data))
      .catch(() => {});
    journeyAPI
      .getVoterTypes()
      .then((res) => setVoterTypes(res.data.types))
      .catch(() => {});
  }, []);

  const handleCountryChange = useCallback((e) => {
    setCountry(e.target.value);
    setState('');
    setCity('');
  }, []);

  const handleStateChange = useCallback((e) => {
    setState(e.target.value);
    setCity('');
  }, []);

  const handleGenerateJourney = useCallback(async () => {
    setStep(2);
    setError('');
    try {
      const location = `${city}, ${state}, ${country}`;
      updateUserContext({ country, state, city, voterType: selectedVoterType });
      analyticsEvents.journeyStarted(selectedVoterType, location);
      const res = await journeyAPI.generate(location, selectedVoterType, userContext.language);
      setJourneyData(res.data);
      analyticsEvents.journeyCompleted(selectedVoterType);
      setStep(3);
    } catch (e) {
      setError(e.message);
      setStep(1);
    }
  }, [
    city,
    state,
    country,
    selectedVoterType,
    userContext.language,
    updateUserContext,
    setJourneyData,
  ]);

  const downloadPDF = useCallback(() => {
    if (!journeyData) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('VoteSmart — Personalized Voting Checklist', 20, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${city}, ${state} | ${selectedVoterType.replace('-', ' ')} voter`, 20, 30);

    let y = 45;
    journeyData.steps.forEach((s, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 78, 216);
      doc.setFontSize(13);
      doc.text(`Step ${i + 1}: ${s.title}`, 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(s.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
      s.checklist.forEach((item) => {
        doc.text(`  [ ]  ${item}`, 20, y);
        y += 6;
      });
      if (s.tip) {
        doc.setTextColor(100);
        doc.text(`  Tip: ${s.tip}`, 20, y);
        y += 8;
      }
      y += 6;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    });

    if (journeyData.urgentNote) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(11);
      doc.text('Important: ' + journeyData.urgentNote, 20, y);
    }
    doc.save(`VoteSmart-Checklist-${city.replace(/\s/g, '-')}.pdf`);
    analyticsEvents.pdfDownloaded();
  }, [journeyData, city, state, selectedVoterType]);

  const progressWidth = step === 0 ? 10 : step === 1 ? 40 : step === 2 ? 70 : 100;

  return (
    <main className="journey-page" role="main">
      <div className="journey-page__header">
        <div className="container">
          <div className="journey-page__title-row">
            <div>
              <h1>{t('journey.title')}</h1>
              <p className="text-muted">{t('journey.subtitle')}</p>
            </div>
            {step < 3 && (
              <div className="journey-page__progress" aria-label="Journey progress">
                <div className="journey-page__step-labels">
                  {STEPS.slice(0, 3).map((s, i) => (
                    <div
                      key={s.id}
                      className={`journey-step-label-item ${step === i ? 'active' : step > i ? 'done' : ''}`}
                    >
                      <div className="journey-step-label-dot" aria-hidden="true">
                        {step > i ? (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M2 5l2.5 2.5L8 2.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="journey-step-label-text">
                        <div className="journey-step-label-name">{s.label}</div>
                        <div className="journey-step-label-desc text-xs">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="journey-page__bar"
                  role="progressbar"
                  aria-valuenow={progressWidth}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Journey progress: ${progressWidth}%`}
                >
                  <div className="journey-page__bar-fill" style={{ width: `${progressWidth}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="journey-page__content">
          <AnimatePresence mode="wait">
            {/* Step 0: Location */}
            {step === 0 && (
              <motion.div key="location" className="journey-card card" {...CARD_VARIANTS}>
                <div className="journey-card__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <path
                      d="M11 2C7.686 2 5 4.686 5 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.314-2.686-6-6-6z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="11" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h2>{t('journey.location.heading')}</h2>
                <p className="text-muted">{t('journey.location.sub')}</p>

                <div className="journey-form">
                  <div className="journey-form__group">
                    <label htmlFor="journey-country">Country</label>
                    <select
                      id="journey-country"
                      value={country}
                      onChange={handleCountryChange}
                      className="journey-form__select"
                    >
                      <option value="">Select country</option>
                      {locations.countries?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {country && (
                    <div className="journey-form__group">
                      <label htmlFor="journey-state">State</label>
                      <select
                        id="journey-state"
                        value={state}
                        onChange={handleStateChange}
                        className="journey-form__select"
                      >
                        <option value="">Select state</option>
                        {locations.states?.[country]?.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {state && (
                    <div className="journey-form__group">
                      <label htmlFor="journey-city">Constituency / City</label>
                      <select
                        id="journey-city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="journey-form__select"
                      >
                        <option value="">Select city</option>
                        {locations.cities?.[state]?.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button className="btn-primary" onClick={() => setStep(1)} disabled={!city}>
                  Continue
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </motion.div>
            )}

            {/* Step 1: Voter Type */}
            {step === 1 && (
              <motion.div key="voter-type" className="journey-card card" {...CARD_VARIANTS}>
                <div className="journey-card__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                    <circle cx="11" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2>{t('journey.votertype.heading')}</h2>
                <p className="text-muted">{t('journey.votertype.sub')}</p>

                {error && (
                  <div className="journey-error" role="alert" aria-live="assertive">
                    {error}
                  </div>
                )}

                <div
                  className="journey-voter-types"
                  role="group"
                  aria-label="Select your voter type"
                >
                  {voterTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`journey-voter-type-btn ${selectedVoterType === type.id ? 'selected' : ''}`}
                      onClick={() => setSelectedVoterType(type.id)}
                      aria-pressed={selectedVoterType === type.id}
                    >
                      <div className="journey-voter-type-name">{type.label}</div>
                      <div className="journey-voter-type-desc text-small text-muted">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="journey-card__actions">
                  <button className="btn-secondary" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleGenerateJourney}
                    disabled={!selectedVoterType}
                  >
                    Generate My Journey
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 2l1.5 3.5L14 7l-3.5 3 1 4L8 12l-3.5 2 1-4L2 7l4.5-1.5L8 2z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Generating */}
            {step === 2 && (
              <motion.div
                key="generating"
                className="journey-card card journey-loading-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-busy="true"
                aria-live="polite"
              >
                <div className="journey-spinner-wrap" aria-hidden="true">
                  <div className="journey-ai-loader">
                    <div className="journey-ai-ring" />
                    <div className="journey-ai-ring journey-ai-ring--2" />
                  </div>
                </div>
                <h2>Building your journey</h2>
                <p className="text-muted">
                  AI is generating a personalized guide for a {selectedVoterType?.replace('-', ' ')}{' '}
                  voter in {city}...
                </p>
                <div className="journey-loading-steps" aria-hidden="true">
                  {[
                    'Analyzing location data',
                    'Personalizing for your voter type',
                    'Generating checklist',
                  ].map((s, i) => (
                    <div
                      key={s}
                      className="journey-loading-step"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    >
                      <div className="spinner" style={{ width: 14, height: 14 }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Journey Result */}
            {step === 3 && journeyData && (
              <motion.div
                key="journey-result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="journey-result-header">
                  <div className="journey-result-meta">
                    <span className="badge badge-green">Journey Ready</span>
                    <span className="text-small text-muted">
                      {city}, {state} — {selectedVoterType?.replace('-', ' ')} voter
                    </span>
                  </div>
                  <div className="journey-result-actions">
                    <button
                      className="btn-secondary"
                      onClick={downloadPDF}
                      aria-label="Download PDF checklist"
                    >
                      <svg
                        aria-hidden="true"
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                      >
                        <path
                          d="M7.5 2v8M4 7l3.5 3.5L11 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 12h11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Download PDF
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setStep(0);
                        setJourneyData(null);
                      }}
                    >
                      Start Over
                    </button>
                  </div>
                </div>

                {journeyData.urgentNote && (
                  <div className="journey-urgent-note" role="alert">
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                      <path
                        d="M8 4.5v4M8 10.5v.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <strong>Important:</strong> {journeyData.urgentNote}
                  </div>
                )}

                {journeyData.summary && (
                  <div className="journey-summary card">
                    <p>{journeyData.summary}</p>
                  </div>
                )}

                <nav className="journey-steps-nav" aria-label="Journey steps navigation">
                  {journeyData.steps?.map((s, i) => (
                    <button
                      key={s.id}
                      className={`journey-step-nav-btn ${activeJourneyStep === i ? 'active' : i < activeJourneyStep ? 'done' : ''}`}
                      onClick={() => setActiveJourneyStep(i)}
                      aria-current={activeJourneyStep === i ? 'step' : undefined}
                    >
                      <span className="journey-step-nav-num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="journey-step-nav-label">{s.title}</span>
                    </button>
                  ))}
                </nav>

                <div aria-live="polite" aria-atomic="true">
                  <AnimatePresence mode="wait">
                    {journeyData.steps?.[activeJourneyStep] && (
                      <motion.div
                        key={activeJourneyStep}
                        className="journey-step-detail card"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="journey-step-detail__header">
                          <div className="journey-step-detail__num">
                            Step {activeJourneyStep + 1}
                          </div>
                          <h2>{journeyData.steps[activeJourneyStep].title}</h2>
                          <p className="text-muted">
                            {journeyData.steps[activeJourneyStep].description}
                          </p>
                        </div>

                        <div className="journey-checklist">
                          <h4>Checklist</h4>
                          {journeyData.steps[activeJourneyStep].checklist?.map((item, idx) => (
                            <label key={idx} className="journey-checklist-item">
                              <input type="checkbox" />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>

                        {journeyData.steps[activeJourneyStep].tip && (
                          <div className="journey-tip">
                            <svg
                              aria-hidden="true"
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                            >
                              <circle
                                cx="7.5"
                                cy="7.5"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="1.3"
                              />
                              <path
                                d="M7.5 5.5v4M7.5 4v.5"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span>{journeyData.steps[activeJourneyStep].tip}</span>
                          </div>
                        )}

                        <div className="journey-step-nav-actions">
                          {activeJourneyStep > 0 && (
                            <button
                              className="btn-secondary"
                              onClick={() => setActiveJourneyStep((prev) => prev - 1)}
                            >
                              Previous
                            </button>
                          )}
                          {activeJourneyStep < journeyData.steps.length - 1 && (
                            <button
                              className="btn-primary journey-next-cta"
                              onClick={() => setActiveJourneyStep((prev) => prev + 1)}
                            >
                              {t('journey.cta.next')}
                              <svg
                                aria-hidden="true"
                                width="15"
                                height="15"
                                viewBox="0 0 15 15"
                                fill="none"
                              >
                                <path
                                  d="M3 7.5h9M9 4l3.5 3.5L9 11"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          {activeJourneyStep === journeyData.steps.length - 1 && (
                            <div className="journey-complete-badge badge badge-green" role="status">
                              Journey Complete
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
