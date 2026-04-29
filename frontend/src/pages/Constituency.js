import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { constituencyAPI } from '../services/api';
import { useApp } from '../services/AppContext';
import GoogleMapConstituency from '../components/shared/GoogleMapConstituency';
import { analyticsEvents } from '../services/firebase';
import './Constituency.css';

const PARTY_COLORS = {
  AAP: '#2563eb',
  BJP: '#f97316',
  INC: '#16a34a',
  SP: '#dc2626',
  BSP: '#7c3aed',
  DMK: '#ea580c',
  AIADMK: '#0891b2',
  'Shiv Sena': '#d97706',
  'Shiv Sena (UBT)': '#b45309',
  'JD(S)': '#65a30d',
  Others: '#9ca3af',
  'SP-BSP-RLD': '#9333ea',
  TMC: '#06b6d4',
  CPIM: '#dc2626',
};

export default function Constituency() {
  const { userContext, t } = useApp();
  const [locations, setLocations] = useState({ countries: [], states: {}, cities: {} });
  const [selectedState, setSelectedState] = useState(userContext.state || '');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  // Separate loading states: search (sidebar) vs detail (main panel)
  // This prevents the sidebar results from disappearing when a detail is loading
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    constituencyAPI
      .getLocations()
      .then((res) => setLocations(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedState) {
      setSearchLoading(true);
      setSelected(null);
      setInsights(null);
      constituencyAPI
        .search(null, selectedState)
        .then((res) => {
          setSearchResults(res.data);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    } else {
      setSearchResults([]);
    }
  }, [selectedState]);

  const handleSelectConstituency = async (c) => {
    // Don't set searchLoading — keeps sidebar results visible while detail loads
    setDetailLoading(true);
    setDetailError('');
    setInsights(null);
    try {
      const res = await constituencyAPI.getById(c.id);
      setSelected(res.data);
      analyticsEvents.constituencyViewed(c.name, c.state);

      setInsightsLoading(true);
      constituencyAPI
        .getInsights(c.id, userContext.language)
        .then((r) => {
          setInsights(r.data);
          setInsightsLoading(false);
        })
        .catch(() => setInsightsLoading(false));
    } catch (e) {
      setDetailError('Could not load constituency data. Please try again.');
    }
    setDetailLoading(false);
  };

  const getLatestVotesData = () => {
    if (!selected || !selected.elections[0]) return [];
    return Object.entries(selected.elections[0].votes)
      .map(([party, votes]) => ({
        party: party.length > 10 ? party.substring(0, 10) + '...' : party,
        votes,
        fullParty: party,
      }))
      .sort((a, b) => b.votes - a.votes);
  };

  return (
    <div className="constituency-page">
      <div className="constituency-page__header">
        <div className="container">
          <h1>{t('const.title')}</h1>
          <p className="text-muted">{t('const.subtitle')}</p>
        </div>
      </div>

      <div className="container">
        <div className="constituency-layout">
          {/* Sidebar */}
          <div className="constituency-sidebar">
            <div className="constituency-filter card">
              <h4>Find Constituency</h4>
              <div className="constituency-filter__group">
                <label className="text-small text-muted">State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelected(null);
                  }}
                  className="constituency-filter__select"
                >
                  <option value="">Select state</option>
                  {Object.keys(locations.states || {}).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {searchLoading && (
                <div className="constituency-filter__loading">
                  <div className="spinner" style={{ width: 14, height: 14 }}></div>
                  <span className="text-small text-muted">Loading...</span>
                </div>
              )}

              {searchResults.length > 0 && !searchLoading && (
                <div className="constituency-results">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      className={`constituency-result-item ${selected?.id === c.id ? 'active' : ''}`}
                      onClick={() => handleSelectConstituency(c)}
                    >
                      <div className="constituency-result-name">{c.name}</div>
                      <div className="constituency-result-meta text-xs text-muted">
                        {c.party} · {c.lastTurnout}% turnout
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedState && searchResults.length === 0 && !searchLoading && (
                <p className="text-small text-muted" style={{ padding: '8px 0' }}>
                  No constituencies found. Try a different state.
                </p>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="constituency-main">
            {detailLoading && (
              <div className="constituency-empty">
                <div className="spinner" style={{ width: 24, height: 24 }}></div>
                <p className="text-muted text-small" style={{ marginTop: 12 }}>
                  Loading constituency data...
                </p>
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="constituency-empty">
                <p style={{ color: 'var(--color-error)' }}>{detailError}</p>
              </div>
            )}

            {!selected && !detailLoading && !detailError && (
              <div className="constituency-empty">
                <div className="constituency-empty__icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M16 4C10.477 4 6 8.477 6 14c0 9.333 10 18 10 18s10-8.667 10-18c0-5.523-4.477-10-10-10z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="16" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3>{t('const.select')}</h3>
                <p className="text-muted text-small">
                  Choose a state and constituency from the sidebar to view detailed election data
                  and AI insights.
                </p>
              </div>
            )}

            {selected && !detailLoading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {/* Constituency header */}
                <div className="constituency-detail-header card">
                  <div className="constituency-detail-meta">
                    <h2>{selected.name}</h2>
                    <div className="constituency-detail-tags">
                      <span className="badge badge-blue">{selected.state}</span>
                      <span className="badge badge-amber">{selected.party}</span>
                      <span className="text-small text-muted">
                        Current MP: {selected.currentMP}
                      </span>
                    </div>
                  </div>
                  <div className="constituency-stats-grid">
                    <div className="constituency-stat">
                      <div className="constituency-stat-value">
                        {(selected.totalVoters / 1000000).toFixed(2)}M
                      </div>
                      <div className="constituency-stat-label text-xs text-muted">
                        Registered Voters
                      </div>
                    </div>
                    <div className="constituency-stat">
                      <div className="constituency-stat-value">
                        {selected.elections[0]?.turnout}%
                      </div>
                      <div className="constituency-stat-label text-xs text-muted">
                        Latest Turnout
                      </div>
                    </div>
                    <div className="constituency-stat">
                      <div className="constituency-stat-value">
                        {selected.demographics?.literacy}%
                      </div>
                      <div className="constituency-stat-label text-xs text-muted">
                        Literacy Rate
                      </div>
                    </div>
                    <div className="constituency-stat">
                      <div className="constituency-stat-value">{selected.demographics?.avgAge}</div>
                      <div className="constituency-stat-label text-xs text-muted">Average Age</div>
                    </div>
                  </div>
                </div>

                {/* Google Maps — constituency location */}
                <div className="constituency-chart card">
                  <h4>
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ marginRight: 6, verticalAlign: 'middle' }}
                    >
                      <path
                        d="M7 1C4.239 1 2 3.239 2 6c0 4.667 5 9 5 9s5-4.333 5-9c0-2.761-2.239-5-5-5z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                    Location — Google Maps
                  </h4>
                  <GoogleMapConstituency
                    constituencyId={selected.id}
                    constituencyName={selected.name}
                  />
                  <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                    Powered by Google Maps Platform
                  </p>
                </div>

                {/* AI Insights */}
                <div className="constituency-insights card">
                  <div className="constituency-insights__header">
                    <h4>{t('const.ai')}</h4>
                    <span className="badge badge-blue">Powered by Gemini AI</span>
                  </div>
                  {insightsLoading ? (
                    <div className="constituency-insights__loading">
                      <div className="spinner" style={{ width: 16, height: 16 }}></div>
                      <span className="text-small text-muted">Generating insights...</span>
                    </div>
                  ) : insights ? (
                    <div className="constituency-insights__content">
                      {insights.highlight && (
                        <div className="constituency-highlight">
                          <strong>Highlight:</strong> {insights.highlight}
                        </div>
                      )}
                      {insights.insights?.map((insight, i) => (
                        <div key={i} className="constituency-insight-item">
                          <div className="constituency-insight-num">{i + 1}</div>
                          <p>{insight}</p>
                        </div>
                      ))}
                      {insights.trend && (
                        <div
                          className={`constituency-trend badge-${insights.trend === 'Rising' ? 'green' : insights.trend === 'Falling' ? 'red' : 'amber'}`}
                        >
                          Trend: {insights.trend}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-small text-muted">Could not load AI insights.</p>
                  )}
                </div>

                {/* Vote share chart */}
                <div className="constituency-chart card">
                  <h4>Vote Share — {selected.elections[0]?.year}</h4>
                  <div className="constituency-chart__wrap" style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getLatestVotesData()}
                        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="party"
                          tick={{ fontSize: 12, fill: 'var(--color-ink-secondary)' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--color-ink-secondary)' }}
                          width={60}
                          tickFormatter={(v) => v / 1000 + 'K'}
                        />
                        <Tooltip
                          formatter={(v) => [v.toLocaleString(), 'Votes']}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <Bar dataKey="votes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Turnout trend */}
                <div className="constituency-chart card">
                  <h4>Voter Turnout Over Time</h4>
                  <div className="constituency-chart__wrap" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...selected.elections].reverse()}
                        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 12, fill: 'var(--color-ink-secondary)' }}
                        />
                        <YAxis
                          domain={[40, 80]}
                          tick={{ fontSize: 11, fill: 'var(--color-ink-secondary)' }}
                          tickFormatter={(v) => v + '%'}
                        />
                        <Tooltip
                          formatter={(v) => [v + '%', 'Turnout']}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="turnout"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          dot={{ fill: 'var(--color-accent)', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Election Winners History Table */}
                <div className="constituency-chart card">
                  <h4>Election Results History</h4>
                  <div className="constituency-winners-table">
                    <div className="constituency-winners-header">
                      <span>Year</span>
                      <span>Winner</span>
                      <span>Margin</span>
                      <span>Turnout</span>
                    </div>
                    {selected.elections.map((e, i) => {
                      const sortedVotes = Object.entries(e.votes).sort((a, b) => b[1] - a[1]);
                      const winner = sortedVotes[0];
                      const runnerUp = sortedVotes[1];
                      const margin = winner && runnerUp ? winner[1] - runnerUp[1] : 0;
                      return (
                        <div
                          key={e.year}
                          className={`constituency-winners-row ${i === 0 ? 'latest' : ''}`}
                        >
                          <span className="winners-year">
                            {e.year}
                            {i === 0 && (
                              <span
                                className="badge badge-blue"
                                style={{ fontSize: 10, marginLeft: 6 }}
                              >
                                Latest
                              </span>
                            )}
                          </span>
                          <span className="winners-winner">
                            <span
                              className="winners-party-dot"
                              style={{ background: PARTY_COLORS[winner?.[0]] || '#9ca3af' }}
                            ></span>
                            {winner?.[0]} — {winner?.[1]?.toLocaleString()} votes
                          </span>
                          <span className="winners-margin">+{margin.toLocaleString()}</span>
                          <span className="winners-turnout">{e.turnout}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Demographics */}
                {selected.demographics && (
                  <div className="constituency-chart card">
                    <h4>Constituency Demographics</h4>
                    <div className="constituency-demographics">
                      <div className="demo-item">
                        <div className="demo-label text-small text-muted">Urban / Rural Split</div>
                        <div className="demo-bar-wrap">
                          <div className="demo-bar">
                            <div
                              className="demo-bar-fill urban"
                              style={{ width: selected.demographics.urban + '%' }}
                            >
                              <span className="demo-bar-label">
                                {selected.demographics.urban}% Urban
                              </span>
                            </div>
                            <div
                              className="demo-bar-fill rural"
                              style={{ width: selected.demographics.rural + '%' }}
                            >
                              <span className="demo-bar-label">
                                {selected.demographics.rural}% Rural
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="demo-stats-grid">
                        <div className="demo-stat">
                          <div className="demo-stat-val">{selected.demographics.literacy}%</div>
                          <div className="demo-stat-lbl text-xs text-muted">Literacy Rate</div>
                        </div>
                        <div className="demo-stat">
                          <div className="demo-stat-val">{selected.demographics.avgAge}</div>
                          <div className="demo-stat-lbl text-xs text-muted">Average Age</div>
                        </div>
                        <div className="demo-stat">
                          <div className="demo-stat-val">
                            {(selected.totalVoters / 1000000).toFixed(1)}M
                          </div>
                          <div className="demo-stat-lbl text-xs text-muted">Registered Voters</div>
                        </div>
                        <div className="demo-stat">
                          <div className="demo-stat-val">{selected.elections[0]?.turnout}%</div>
                          <div className="demo-stat-lbl text-xs text-muted">Latest Turnout</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
