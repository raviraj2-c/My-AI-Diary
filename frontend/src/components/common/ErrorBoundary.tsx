import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, Home, Sparkles } from 'lucide-react';
import i18n from '../../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center p-6 text-foreground">
          <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-border shadow-soft-lg text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-ink-950 text-text dark:text-sky-200 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl font-bold font-serif text-foreground">
                {i18n.t('errorBoundary.title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {i18n.t('errorBoundary.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {i18n.t('errorBoundary.reload')}
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:bg-muted/50 transition-all"
              >
                <Home className="w-3.5 h-3.5" /> {i18n.t('errorBoundary.goHome')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
