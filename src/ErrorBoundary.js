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

    // 🚀 Auto Self-Healing: If error occurs on mobile/desktop, auto-clear corrupt caches and reload once
    try {
      const recoveryKey = 'milad_auto_heal_' + Math.floor(Date.now() / 60000); // 1-minute window
      const alreadyTried = sessionStorage.getItem(recoveryKey);
      if (!alreadyTried) {
        sessionStorage.setItem(recoveryKey, '1');

        // Unregister service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          }).catch(() => {});
        }

        // Delete cache storage
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          }).catch(() => {});
        }

        // Purge potentially corrupt JSON cache keys from localStorage
        try {
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('cached_data_') || k.startsWith('milad_visibility_') || k.includes('chunk_reload')) {
              localStorage.removeItem(k);
            }
          });
        } catch (e) {}

        // Auto-heal reload with cache-busting param
        setTimeout(() => {
          window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now());
        }, 300);
      }
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
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('cached_data_') || k.includes('chunk_reload')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {}
    window.location.replace(window.location.origin + window.location.pathname + '?t=' + Date.now());
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
    window.location.replace(window.location.origin + window.location.pathname + '?reset=' + Date.now());
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
              ആപ്പ് അപ്ഡേറ്റ് ചെയ്തുകൊണ്ടിരിക്കുകയാണ്. താഴെയുള്ള ബട്ടൺ അമർത്തി പുതിയ വേർഷൻ ലോഡ് ചെയ്യുക.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🔄 പുതിയ വേർഷൻ ലോഡ് ചെയ്യുക (Update App)
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🧹 കാഷെ ക്ലിയർ ചെയ്തു തുറക്കുക (Clear Cache & Open)
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
