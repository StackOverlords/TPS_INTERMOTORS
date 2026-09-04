import { Alert, AlertDescription, AlertTitle } from "@/components/atoms/alert";
import { Button } from "@/components/atoms/button";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Nombre del área que se está protegiendo. Va al log para ubicar el fallo. */
  name?: string;
  /** UI alternativa. Si se omite, se muestra el fallback por defecto. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Límite de errores de React reutilizable.
 *
 * Reemplaza a las clases `ErrorBoundary` que cada pantalla se definía por su
 * cuenta con markup crudo. El fallback usa los componentes compartidos
 * (`Alert`, `Button`), así que respeta el tema y la tipografía de la app.
 *
 * Solo captura errores de RENDER. Los de handlers y promesas no pasan por acá:
 * esos se manejan donde ocurren.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ""}]`,
      error,
      errorInfo,
    );
  }

  private handleRetry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Algo salió mal</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">{error.message}</p>
            {import.meta.env.DEV && error.stack && (
              <pre className="max-h-48 overflow-auto rounded bg-background/60 p-2 text-xs">
                {error.stack}
              </pre>
            )}
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

export default ErrorBoundary;
