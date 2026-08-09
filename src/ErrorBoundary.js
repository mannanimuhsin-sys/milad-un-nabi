import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary auto-recovering from error]:', error, errorInfo);
    // 100% Automatic silent recovery: reload instantly without manual button prompt
    setTimeout(() => {
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
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      // Return null to avoid rendering any manual refresh button screen
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
