import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isAutoReloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught component error]:', error, errorInfo);
    
    // Auto-recovery: immediately clear cache and reload automatically
    this.setState({ isAutoReloading: true });
    try {
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
      }
    } catch (e) {}

    setTimeout(() => {
      window.location.reload();
    }, 600);
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
              ഓട്ടോമാറ്റിക് അപ്‌ഡേറ്റ് ചെയ്യുന്നു...
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#a7f3d0', fontWeight: '600' }}>
              Updating Milad Fest Automatically...
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', marginBottom: '20px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>ഏറ്റവും പുതിയ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു...</span>
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <span>🔄</span>
              <span>ഇപ്പോൾ തന്നെ റീലോഡ് ചെയ്യുക</span>
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
