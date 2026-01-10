import React from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <Alert severity="error" variant="outlined">
              <AlertTitle>Something went wrong</AlertTitle>
              <div className="mt-2 text-sm">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
                  Reload
                </Button>
                <Button variant="outlined" onClick={() => this.setState({ hasError: false, error: undefined })}>
                  Dismiss
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
