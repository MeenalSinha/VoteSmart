import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './services/AppContext';
import Navbar from './components/layout/Navbar';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { analyticsEvents } from './services/firebase';
import './styles/globals.css';

// Lazy load pages — reduces initial JS bundle size
const Home = React.lazy(() => import('./pages/Home'));
const Journey = React.lazy(() => import('./pages/Journey'));
const Simulation = React.lazy(() => import('./pages/Simulation'));
const Constituency = React.lazy(() => import('./pages/Constituency'));
const Chat = React.lazy(() => import('./pages/Chat'));
const MythBuster = React.lazy(() => import('./pages/MythBuster'));

// Minimal loading fallback shown during lazy-load
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div className="spinner" style={{ width: 28, height: 28 }}></div>
      <p className="text-muted text-small">Loading...</p>
    </div>
  );
}

// Tracks route changes and fires Firebase Analytics page_view events
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    const pageNames = {
      '/': 'Home',
      '/journey': 'Voter Journey',
      '/simulation': 'Simulation',
      '/constituency': 'Constituency',
      '/chat': 'AI Chat',
      '/mythbuster': 'MythBuster',
    };
    analyticsEvents.pageView(pageNames[location.pathname] || location.pathname);
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <RouteTracker />
        <Navbar />
        <main>
          {/* Each page wrapped in its own ErrorBoundary so one page crash
              doesn't kill the entire app */}
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Home />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/journey"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Journey />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/simulation"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Simulation />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/constituency"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Constituency />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/chat"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Chat />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/mythbuster"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <MythBuster />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 'calc(100vh - 60px)',
                    gap: 16,
                  }}
                >
                  <h2 style={{ fontFamily: 'sans-serif', color: '#1a1714' }}>Page not found</h2>
                  <p className="text-muted">The page you are looking for does not exist.</p>
                  <a
                    href="/"
                    className="btn-primary"
                    style={{ textDecoration: 'none', padding: '12px 24px' }}
                  >
                    Go Home
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </Router>
    </AppProvider>
  );
}

export default App;
