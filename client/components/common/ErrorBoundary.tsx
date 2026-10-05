import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Límite de error (ErrorBoundary) para evitar pantallas blancas ("White Screen of Death")
 * en KIPU'S ERP ante excepciones no controladas o interferencias del DOM (como Google Translate).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('KIPUS ERP ErrorBoundary capturó un error:', error, errorInfo);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[280px] w-full flex flex-col items-center justify-center p-6 text-center rounded-lg border border-border/70 bg-card shadow-xs my-4 space-y-4">
          <div className="h-10 w-10 rounded-full bg-danger-soft text-danger-text flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-semibold text-foreground">
              {this.props.moduleName
                ? `Ocurrió un error al cargar ${this.props.moduleName}`
                : 'Ocurrió un inconveniente al renderizar esta sección'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La vista se protegió para evitar el cierre de la aplicación. Puedes intentar recargar esta sección o refrescar la página.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-muted-foreground/80 bg-muted/50 p-2 rounded border border-border/50 text-left mt-2 truncate">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 text-xs h-8 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reintentar</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-1.5 text-xs h-8 font-semibold bg-primary text-primary-foreground shadow-xs"
            >
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
