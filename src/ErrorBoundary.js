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
    console.error('[ErrorBoundary caught component error]:', error, errorInfo);
    
    // Auto-recovery attempt: if it's the first crash within 15 seconds, clear caches and auto-reload
    try {
      const lastAutoReload = parseInt(sessionStorage.getItem('eb_last_auto_reload') || '0', 10);
      const now = Date.now();
      if (now - lastAutoReload > 15000) {
        sessionStorage.setItem('eb_last_auto_reload', String(now));
        if ('caches' in window) {
          caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
        }
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch (e) {}
  }

  handleReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
      }
    } catch (e) {}
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('miladfest_session');
      sessionStorage.removeItem('miladfest_session');
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
      }
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '16px'
            }}>
              🔄
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              ആപ്പ് അപ്‌ഡേറ്റ് ചെയ്യുന്നു
            </h3>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#a7f3d0', fontWeight: '600' }}>
              Updating Milad Fest...
            </p>
            
            <p style={{ margin: '16px 0 24px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
              പുതിയ മാറ്റങ്ങൾ ഉൾക്കൊള്ളാൻ ദയവായി താഴെ കാണുന്ന ബട്ടൺ അമർത്തി പേജ് റീലോഡ് ചെയ്യുക.
            </p>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <span>🔄</span>
              <span>റീലോഡ് ചെയ്യുക (Reload App)</span>
            </button>

            <button
              type="button"
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🏠 ലോഗിൻ പേജിലേക്ക് (Go to Login)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
