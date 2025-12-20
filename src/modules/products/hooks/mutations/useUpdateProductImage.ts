import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../../services/productService';

interface UpdateProductImageParams {
  productId: number;
  imageFile: File;
}

interface UseProductImageOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useUpdateProductImage = (options?: UseProductImageOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, imageFile }: UpdateProductImageParams) =>
      productsService.updateImage(productId, imageFile),

    onSuccess: (_, { productId }: UpdateProductImageParams) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
      options?.onSuccess?.();
    },

    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
