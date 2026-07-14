import React from 'react';

export class SimpleErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(255,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '24px', maxWidth: '600px', backgroundColor: 'white' }}>
            <h2 style={{ color: 'red' }}>Drawer Crashed!</h2>
            <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
              {this.state.error && this.state.error.message}
              {'\n'}
              {this.state.error && this.state.error.stack}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
