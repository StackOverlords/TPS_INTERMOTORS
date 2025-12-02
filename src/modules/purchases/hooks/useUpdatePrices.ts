import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePricesFormData } from '../schemas/updatePrices.schema';
import { purchaseService } from '../services/purchaseService';

export const useUpdatePrices = () => {
  // const { addAndStartTask, completeTask, failTask } = useTaskNotificationsContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePricesFormData) => purchaseService.updatePrices(data),
    
    onMutate: () => {
      // const taskId = addAndStartTask(
      //   'Actualización de precios',
      //   'Procesando actualización de precios...',
      //   true
      // );
      // return { taskId };
    },
    
    onSuccess: (response, _variables, context) => {
      // if (context?.taskId) {
      //   const affectedCount = response.updated_count || response.affected_products || 0;
      //   completeTask(
      //     context.taskId,
      //     `Precios actualizados exitosamente. ${affectedCount} productos afectados.`
      //   );
      // }
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    
    onError: (error: Error, _variables, context) => {
      // if (context?.taskId) {
      //   failTask(context.taskId, error.message || 'Error al actualizar precios');
      // }
    },
  });
};
