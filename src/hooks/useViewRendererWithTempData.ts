import { useMemo } from "react";
import { useViewRenderer, type UseViewRendererConfig, type QueryState } from "./useViewRenderer";

interface TempDataConfig<TData> {
  /** Datos temporales que se usan mientras se cargan los datos reales */
  tempData?: TData;
  /** Indica si actualmente se están usando datos temporales */
  isUsingTempData?: boolean;
  /** Función para verificar si los datos temporales son válidos */
  validateTempData?: (data: TData) => boolean;
}

interface UseViewRendererWithTempDataConfig<TData> extends Omit<UseViewRendererConfig, 'queryStates' | 'isValidating'> {
  /** Estado de la query principal del backend */
  queryState: QueryState;
  
  /** Configuración de datos temporales (opcional) */
  tempDataConfig?: TempDataConfig<TData>;
  
  /** Validación del parámetro de ruta (si aplica) */
  isParamValid?: boolean;
  
  /** Queries adicionales que también deben validarse (opcional) */
  additionalQueryStates?: QueryState[];
}

/**
 * Hook que extiende useViewRenderer para manejar casos donde hay datos temporales
 * (como cuando se crea una entidad y se redirige a editar)
 * 
 * @example
 * ```tsx
 * const { renderView } = useViewRendererWithTempData({
 *   queryState: { isLoading, isError, data: saleData },
 *   tempDataConfig: {
 *     tempData: tempCreatedSale,
 *     isUsingTempData: fromCreate && !!tempCreatedSale && !saleData,
 *   },
 *   isParamValid: isValidSaleId,
 *   SkeletonComponent: SaleEditSkeleton,
 *   ErrorComponent: ErrorDataComponent,
 *   onRetry: refetchSale,
 * });
 * ```
 */
export function useViewRendererWithTempData<TData = any>({
  queryState,
  tempDataConfig,
  isParamValid = true,
  additionalQueryStates = [],
  ...restConfig
}: UseViewRendererWithTempDataConfig<TData>) {
  
  const { tempData, isUsingTempData = false, validateTempData } = tempDataConfig || {};

  // Validar datos temporales si existe un validador
  const areTempDataValid = useMemo(() => {
    if (!isUsingTempData || !tempData) return false;
    if (validateTempData) return validateTempData(tempData);
    return true; // Por defecto, si existen datos temp, son válidos
  }, [isUsingTempData, tempData, validateTempData]);

  // Combinar query principal con datos temporales
  const effectiveMainQueryState = useMemo((): QueryState => {
    if (isUsingTempData && areTempDataValid) {
      return {
        isLoading: false,
        isError: false,
        data: tempData,
        isFetching: false,
      };
    }
    
    return queryState;
  }, [isUsingTempData, areTempDataValid, tempData, queryState]);

  // Combinar todas las queries
  const allQueryStates = useMemo(() => {
    return [effectiveMainQueryState, ...additionalQueryStates];
  }, [effectiveMainQueryState, additionalQueryStates]);

  // Determinar validación final
  const isFinallyValid = useMemo(() => {
    if (isUsingTempData && areTempDataValid) {
      return true; // Si hay datos temporales válidos, considerarlos válidos
    }
    return isParamValid;
  }, [isUsingTempData, areTempDataValid, isParamValid]);

  return useViewRenderer({
    queryStates: allQueryStates,
    isValidating: isFinallyValid,
    ...restConfig,
  });
}