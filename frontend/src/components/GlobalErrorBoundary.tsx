import React from 'react';

export class GlobalErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // If it's a chunk load error, automatically reload the page once
    if (
      error.name === 'ChunkLoadError' ||
      (error.message && error.message.includes('Failed to fetch dynamically imported module')) ||
      (error.message && error.message.includes('Importing a module script failed')) ||
      (error.message && error.message.includes('dynamically imported module'))
    ) {
      if (!window.sessionStorage.getItem('chunk_load_error')) {
        window.sessionStorage.setItem('chunk_load_error', 'true');
        window.location.reload();
        return;
      }
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  componentDidMount() {
    window.sessionStorage.removeItem('chunk_load_error');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '16px' }}>Oops! Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px' }}>
            We encountered an unexpected error while loading this page. This often happens if the app was recently updated.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
