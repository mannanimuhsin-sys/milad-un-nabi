import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);

    // 🚀 Auto Self-Healing: Clear corrupt data caches without destroying the active login session
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        }).catch(() => {});
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).catch(() => {});
      }
      sessionStorage.clear();
      // Clean only corrupted cache keys — NEVER wipe miladfest_session here
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cached_data_') || k.startsWith('cached_regs_') || k.startsWith('photo_') || k.includes('chunk_reload') || k.includes('temp_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }

  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        }).catch(() => {});
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).catch(() => {});
      }
      sessionStorage.clear();
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cached_data_') || k.startsWith('cached_regs_') || k.includes('chunk_reload')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  handleResetAndReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        }).catch(() => {});
      }
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        }).catch(() => {});
      }
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#041d15',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '30px 24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#34d399', marginBottom: '8px' }}>
              Milad Fest
            </h2>
            <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px', lineHeight: '1.5' }}>
              ആപ്പ് സുഗമമായി തുറക്കാൻ താഴെയുള്ള ബട്ടൺ അമർത്തുക.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5,150,105,0.4)'
                }}
              >
                🚀 ആപ്പ് തുറക്കുക (Open App)
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🧹 പൂർണ്ണമായും റീസെറ്റ് ചെയ്യുക (Full Reset & Login)
              </button>
            </div>
            {this.state.error && (
              <div style={{ marginTop: '16px', fontSize: '10px', color: '#64748b', wordBreak: 'break-all', opacity: 0.7 }}>
                {String(this.state.error.message || this.state.error)}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
