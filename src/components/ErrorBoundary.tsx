import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI error boundary caught error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 border rounded bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <h2 className="font-semibold mb-1">Something went wrong.</h2>
          <p className="text-sm opacity-80">Try reloading the page. If the issue persists, please contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
