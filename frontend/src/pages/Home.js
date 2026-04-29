import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../services/AppContext';
import './Home.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

const features = [
  {
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 5h14M3 10h14M3 15h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: 'Guided Voter Journey',
    description:
      'Personalized step-by-step guide from registration to polling day, tailored to your location and voter type.',
    path: '/journey',
    cta: 'Begin journey',
  },
  {
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 10l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Voter Simulation',
    description:
      'Practice election day scenarios with branching decisions. Learn what to do when things go wrong.',
    path: '/simulation',
    cta: 'Run simulation',
  },
  {
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 14l4-8 3 5 2-3 4 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Constituency Insights',
    description:
      'Historical election data, turnout trends, and AI-generated analysis for your constituency.',
    path: '/constituency',
    cta: 'Explore data',
  },
  {
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: 'AI Election Coach',
    description:
      'Ask anything about elections in plain language. Factual, non-partisan answers in English or Hindi.',
    path: '/chat',
    cta: 'Ask a question',
  },
  {
    icon: (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 6v5M10 13.5v.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: 'MythBuster',
    description:
      'Paste any election claim and get an instant AI verdict — True, False, or Misleading — with sources.',
    path: '/mythbuster',
    cta: 'Fact-check a claim',
  },
];

const stats = [
  { value: '900M+', label: 'Registered voters in India' },
  { value: '67%', label: 'Average national turnout' },
  { value: '543', label: 'Lok Sabha constituencies' },
  { value: '16', label: 'Constituencies in our dataset' },
];

const demoSteps = [
  {
    num: '01',
    title: 'Enter your location',
    desc: 'Select India, your state, and constituency',
    path: '/journey',
  },
  {
    num: '02',
    title: 'Get your personalized guide',
    desc: 'AI generates a 4-step voter journey just for you',
    path: '/journey',
  },
  {
    num: '03',
    title: 'Download your checklist',
    desc: 'Save a PDF with all documents and steps',
    path: '/journey',
  },
  {
    num: '04',
    title: 'Practice with simulation',
    desc: 'Navigate real election day scenarios',
    path: '/simulation',
  },
  {
    num: '05',
    title: 'Explore constituency data',
    desc: 'View historical results and AI insights',
    path: '/constituency',
  },
  {
    num: '06',
    title: 'Ask the AI coach',
    desc: 'Get instant answers in English or Hindi',
    path: '/chat',
  },
];

const Home = React.memo(function Home() {
  const navigate = useNavigate();
  const { t } = useApp();

  return (
    <main className="home" role="main">
      {/* Hero */}
      <section className="home__hero">
        <div className="container">
          <motion.div className="home__hero-content" {...fadeUp(0)}>
            <div className="home__hero-badge badge badge-blue">{t('home.hero.badge')}</div>
            <h1 className="home__hero-title">
              {t('home.hero.title.1')}
              <br />
              <span className="home__hero-accent">{t('home.hero.title.2')}</span>
            </h1>
            <p className="home__hero-desc">
              VoteSmart combines AI, real constituency data, and interactive simulations to help
              every Indian voter participate with confidence.
            </p>
            <div className="home__hero-actions">
              <button className="btn-primary home__hero-btn" onClick={() => navigate('/journey')}>
                {t('home.cta.primary')}
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
              <button className="btn-secondary" onClick={() => navigate('/simulation')}>
                {t('home.cta.secondary')}
              </button>
            </div>
          </motion.div>

          <motion.div className="home__hero-visual" {...fadeUp(0.2)}>
            <div className="home__hero-card card">
              <div className="home__hero-card-header">
                <div className="home__progress-bar">
                  <div className="home__progress-fill" style={{ width: '65%' }}></div>
                </div>
                <span className="text-small text-muted">Step 2 of 4 — Documents</span>
              </div>
              <div className="home__checklist">
                {['Voter ID Card', 'Aadhaar Card', 'Polling Slip'].map((item, i) => (
                  <div
                    key={item}
                    className={`home__checklist-item ${i < 2 ? 'home__checklist-item--done' : ''}`}
                  >
                    <div className={`home__check ${i < 2 ? 'home__check--done' : ''}`}>
                      {i < 2 && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="home__hero-ai-note">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="var(--color-accent)" strokeWidth="1.2" />
                  <path
                    d="M7 4v4M7 9.5v.5"
                    stroke="var(--color-accent)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Personalized for first-time voter in New Delhi</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="home__stats">
        <div className="container">
          <div className="home__stats-grid">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} className="home__stat" {...fadeUp(0.05 * i)}>
                <div className="home__stat-value">{stat.value}</div>
                <div className="home__stat-label text-muted text-small">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Flow */}
      <section className="home__demo">
        <div className="container">
          <div className="home__section-header">
            <span className="home__section-badge badge badge-blue">Demo Flow</span>
            <h2>From zero to confident voter in 6 steps</h2>
            <p className="text-muted">
              Follow this flow to experience every feature of VoteSmart in under 5 minutes.
            </p>
          </div>
          <div className="home__demo-grid">
            {demoSteps.map((step, i) => (
              <motion.div
                key={step.num}
                className="home__demo-step"
                onClick={() => navigate(step.path)}
                {...fadeUp(0.07 * i)}
              >
                <div className="home__demo-num">{step.num}</div>
                <div className="home__demo-content">
                  <div className="home__demo-title">{step.title}</div>
                  <div className="home__demo-desc text-small text-muted">{step.desc}</div>
                </div>
                <svg
                  className="home__demo-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home__features">
        <div className="container">
          <div className="home__section-header">
            <span className="home__section-badge badge badge-blue">Features</span>
            <h2>Everything you need to vote with confidence</h2>
            <p className="text-muted">
              Five integrated tools guiding you from registration to the polling booth and beyond.
            </p>
          </div>
          <div className="home__features-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="home__feature-card card"
                onClick={() => navigate(feature.path)}
                {...fadeUp(0.07 * i)}
              >
                <div className="home__feature-icon">{feature.icon}</div>
                <h3 className="home__feature-title">{feature.title}</h3>
                <p className="home__feature-desc text-muted text-small">{feature.description}</p>
                <div className="home__feature-cta">
                  {feature.cta}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7h8M8 4l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home__cta-section">
        <div className="container">
          <div className="home__cta-banner">
            <h2>Ready to become an informed voter?</h2>
            <p className="text-muted">
              Start with your personalized voter journey. Takes less than 2 minutes to set up.
            </p>
            <button className="btn-primary" onClick={() => navigate('/journey')}>
              {t('home.cta.primary')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
});

export default Home;
