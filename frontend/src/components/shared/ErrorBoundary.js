import React from 'react';

/**
 * ErrorBoundary — catches JavaScript errors anywhere in the child component
 * tree, logs them, and displays a fallback UI instead of a blank white screen.
 *
 * Wrap around page-level components in App.js so a crash in one page
 * doesn't break the entire application.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production you would send this to Sentry / Datadog
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navigate home via full reload to clear any broken state
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = process.env.NODE_ENV !== 'production';

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f7f4',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: 520,
          background: '#fff',
          border: '1px solid #e8e4de',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="#dc2626" strokeWidth="1.5"/>
              <path d="M11 7v5M11 14.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <h2 style={{ fontFamily: 'sans-serif', fontSize: 20, marginBottom: 10, color: '#1a1714' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#6b6560', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred in this section of the app.
            Your data is safe — clicking the button below will take you back to the home screen.
          </p>

          {isDev && this.state.error && (
            <pre style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 12,
              fontSize: 11,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 180,
              marginBottom: 20,
              color: '#991b1b'
            }}>
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 28px',
              background: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
