import type { ReactNode } from "react";

export interface QueryState {
  isLoading: boolean;
  isError: boolean;
  data?: any;
  isFetching?: boolean;
}

export interface UseViewRendererConfig {
  queryStates: QueryState[];
  isValidating?: boolean;
  SkeletonComponent: React.ComponentType;
  ErrorComponent: React.ComponentType<{
    onRetry?: () => void;
    errorMessage?: string;
  }>;
  errorMessage?: string;
  errorContainerClassName?: string;
  onRetry?: () => void;
}

export interface UseViewRendererResult {
  shouldShowSkeleton: boolean;
  shouldShowError: boolean;
  shouldRender: boolean;
  hasAnyLoading: boolean;
  hasAnyError: boolean;
  hasAnyData: boolean;
  renderView: () => ReactNode | undefined;
}

export function useViewRenderer({
  queryStates,
  isValidating = true, // Por defecto, asume que la validación externa es correcta
  SkeletonComponent,
  ErrorComponent,
  errorMessage = "No se pudo cargar los datos.",
  errorContainerClassName = "h-full flex items-center justify-center p-2 lg:p-8",
  onRetry,
}: UseViewRendererConfig): UseViewRendererResult {
  // Análisis de estados de las queries
  const hasAnyLoading = queryStates.some((q) => q.isLoading || q.isFetching);
  const hasAnyError = queryStates.some((q) => q.isError);
  const hasAnyData = queryStates.every((q) => q.data !== undefined);
  const hasNoData = queryStates.some(
    (q) => q.data === undefined && !q.isLoading && !q.isFetching
  );

  // Lógica de renderizado
  const shouldShowSkeleton = !isValidating || hasAnyLoading;
  const shouldShowError = isValidating && (hasAnyError || hasNoData);
  const shouldRender =
    isValidating && !hasAnyLoading && !hasAnyError && hasAnyData;

  const renderView = (): ReactNode | undefined => {
    if (shouldShowSkeleton) {
      return <SkeletonComponent />;
    }

    if (shouldShowError) {
      return (
        <div className={errorContainerClassName}>
          <ErrorComponent onRetry={onRetry} errorMessage={errorMessage} />
        </div>
      );
    }
  };

  return {
    shouldShowSkeleton,
    shouldShowError,
    shouldRender,
    hasAnyLoading,
    hasAnyError,
    hasAnyData,
    renderView,
  };
}
