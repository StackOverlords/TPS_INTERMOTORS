import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePricesFormData } from '../schemas/updatePrices.schema';
import { purchaseService } from '../services/purchaseService';
import { Logger } from '@/lib/logger';

const MODULE_NAME = 'USE_UPDATE_PRICES';

export const useUpdatePrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePricesFormData) => purchaseService.updatePrices(data),

    onSuccess: (response, variables) => {
      Logger.info('Update prices success - invalidating queries', {
        response,
        variables,
      }, MODULE_NAME);

      // Invalidar listados de productos
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Invalidar detalles de productos (todas las vistas de detalle)
      queryClient.invalidateQueries({ queryKey: ['product-detail'] });
      queryClient.invalidateQueries({ queryKey: ['product-detail-with-stock'] });

      // Invalidar stock de productos (el precio puede mostrarse junto al stock)
      queryClient.invalidateQueries({ queryKey: ['product-stock'] });

      // Invalidar reporte de stock mínimo (puede mostrar precios)
      queryClient.invalidateQueries({ queryKey: ['stock-minimo-report'] });

      Logger.info('All product queries invalidated', undefined, MODULE_NAME);
    },

    onError: (error: Error, variables) => {
      Logger.error('Update prices failed', {
        error: error.message,
        variables,
      }, MODULE_NAME);
    },
  });
};
