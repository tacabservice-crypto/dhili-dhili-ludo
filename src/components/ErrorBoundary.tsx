import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-full max-w-md p-6 bg-slate-800 border border-slate-700 rounded-xl">
            <h1 className="text-2xl font-bold text-center text-red-400">Something went wrong</h1>
            <p className="mt-4 text-center text-slate-300">
              Please try refreshing the page. If the problem persists, please contact support.
            </p>
            {this.state.error && (
              <details className="mt-4 text-left bg-slate-700 p-3 rounded-lg">
                <summary className="cursor-pointer text-slate-400">Error Details</summary>
                <pre className="mt-2 text-xs text-red-300 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
