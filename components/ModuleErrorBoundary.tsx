'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  moduleName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">
                Chyba v modulu {this.props.moduleName}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Modul se nepodařilo načíst. Zkuste to znovu nebo kontaktujte podporu.
              </p>
              {this.state.error && (
                <p className="text-xs text-red-600 mt-2 font-mono bg-red-50 p-2 rounded">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={this.handleRetry}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Zkusit znovu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
