'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-md">
              There was an error loading the web3 components. This might be due to missing environment variables.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg space-y-4 max-w-lg">
            <h3 className="font-semibold">Setup Instructions:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Copy the environment template: <code className="bg-muted px-1 rounded">cp env.local.template .env.local</code></li>
              <li>Get your Privy App ID from <a href="https://console.privy.io" target="_blank" className="text-primary hover:underline">console.privy.io</a></li>
              <li>Add it to <code className="bg-muted px-1 rounded">.env.local</code>: <br />
                  <code className="bg-muted px-1 rounded text-xs">NEXT_PUBLIC_PRIVY_APP_ID=your-app-id</code>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>

          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 