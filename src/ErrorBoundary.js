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
    console.error('[ErrorBoundary caught component error]:', error, errorInfo);
    // Graceful inline recovery: reset error state after 1 second without forcing page reload
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <span>-- Processing update, please select program again --</span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
