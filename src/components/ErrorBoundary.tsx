import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error Boundary Component
class ErrorBoundaryComponent extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🛑 [ErrorBoundary] Uncaught error:', error, errorInfo);
    
    // Log to error reporting service (e.g., Sentry)
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Если предоставлен custom fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Дефолтный UI для ошибок
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-2xl">
                Упс! Что-то пошло не так
              </CardTitle>
              <CardDescription>
                Произошла непредвиденная ошибка. Попробуйте обновить страницу.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-muted rounded-md text-left text-sm">
                  <p className="font-mono text-destructive">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 text-muted-foreground">
                      <summary className="cursor-pointer">Stack trace</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-2">
              <Button onClick={this.handleReload} variant="default">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Обновить страницу
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==================== Async Error Boundary Hook ====================

/**
 * Хук для обработки ошибок в async функциях компонентов
 */
export const useAsyncError = () => {
  const [, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error);
      // Пробрасываем ошибку дальше для обработки ErrorBoundary
      setTimeout(() => {
        throw error;
      }, 0);
    } else {
      const wrappedError = new Error(String(error));
      setError(wrappedError);
      setTimeout(() => {
        throw wrappedError;
      }, 0);
    }
  }, []);

  return handleError;
};

// ==================== Query Error Boundary ====================

interface QueryErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ children, onError }) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setError(event.error);
      onError?.(event.error);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [onError]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-md">
        <p className="text-destructive text-sm">Произошла ошибка при загрузке данных</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="h-3 w-3 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

// ==================== With Error Boundary HOC ====================

/**
 * HOC для обёртывания компонентов с ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  class WithErrorBoundary extends React.Component<P> {
    static displayName = `WithErrorBoundary(${displayName})`;

    render() {
      return (
        <ErrorBoundaryComponent fallback={fallback}>
          <WrappedComponent {...this.props} />
        </ErrorBoundaryComponent>
      );
    }
  }

  return WithErrorBoundary;
}

// ==================== Export ====================

export default ErrorBoundaryComponent;
