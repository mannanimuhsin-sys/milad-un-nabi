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
  }

  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    } catch (e) {}
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px 24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px', color: '#38bdf8' }}>
              Milad Fest App
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
              ആപ്പിൽ പുതിയ വിവരങ്ങൾ സിങ്ക് ചെയ്യുകയാണ്. താഴെ കാണുന്ന ബട്ടൺ അമർത്തി പേജ് ഒന്നുകൂടി റീലോഡ് ചെയ്യുക.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              🔄 Refresh App (റീലോഡ് ചെയ്യുക)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
