import { Kbd } from '@/components/atoms/kbd';
import ErrorDataComponent from '@/components/common/errorDataComponent';
import TooltipButton from '@/components/common/TooltipButton';
import { CornerUpLeft, Edit } from 'lucide-react';
import { useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate, useParams } from 'react-router';
import DeletePurchaseDialog from '../components/DeletePurchaseDialog';
import PurchaseDetailSkeleton from '../components/purchaseDetail/PurchaseDetailSkeleton';
import PurchaseOverview from '../components/purchaseDetail/PurchaseOverview';
import PurchaseProducts from '../components/purchaseDetail/PurchaseProducts';
import { usePurchaseById } from '../hooks/usePurchaseById';
import { usePurchaseDelete } from '../hooks/usePurchaseDelete';

const PurchaseDetailScreen = () => {
  const navigate = useNavigate();
  const { purchaseId } = useParams();

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
    refetch: refetchPurchase,
  } = usePurchaseById(Number(purchaseId) || 0);

  const {
    showDeleteDialog,
    isDeleting,
    // initiateDeletion,
    cancelDeletion,
    confirmDeletion,
  } = usePurchaseDelete();

  const handleRetry = useCallback(() => {
    refetchPurchase();
  }, [refetchPurchase]);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard/list-purchases');
  }, [navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/dashboard/purchases/${purchaseId}/editar`);
  }, [navigate, purchaseId]);

  // const handleDelete = useCallback(() => {
  //   initiateDeletion(Number(purchaseId));
  // }, [initiateDeletion, purchaseId]);

  const handleConfirmDelete = useCallback(async () => {
    const success = await confirmDeletion();
    if (success) {
      navigate('/dashboard/list-purchases');
    }
  }, [confirmDeletion, navigate]);

  // Shortcuts
  useHotkeys('escape', handleGoBack, {
    scopes: ['esc-key'],
    enabled: true,
  });

  if (isErrorPurchase || !purchase) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar la compra."
          showButtonIcon={false}
          buttonText="Ir a lista de compras"
          onRetry={() => {
            navigate('/dashboard/list-purchases');
          }}
        />
      </div>
    )
  }

  return (
    <>
      {isLoadingPurchase ? (
        <PurchaseDetailSkeleton />
      ) : (
        <main className="h-full flex flex-col items-center overflow-hidden p-2">
          <div className="max-w-7xl w-full h-full flex flex-col gap-2 overflow-auto">
            {/* Header */}
            <header className="bg-white border border-gray-200 rounded-lg p-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TooltipButton
                    tooltipContentProps={{
                      align: 'start',
                    }}
                    onClick={handleGoBack}
                    tooltip={
                      <p>
                        Presiona <Kbd>esc</Kbd> para volver a la lista de
                        compras
                      </p>
                    }
                    buttonProps={{
                      variant: 'default',
                    }}
                  >
                    <CornerUpLeft />
                  </TooltipButton>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">
                      Compra Nro. {purchase?.nro}
                    </h1>
                    {purchase && (
                      <p className="text-xs text-muted-foreground">
                        {purchase?.cantidad_detalles ?? 0}{' '}
                        {(purchase?.cantidad_detalles ?? 0) === 1
                          ? 'producto'
                          : 'productos'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <TooltipButton
                    onClick={handleEdit}
                    tooltip="Editar compra"
                    buttonProps={{
                      variant: 'outline',
                      size: 'sm',
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </TooltipButton>

                  {/* <TooltipButton
                    onClick={handleDelete}
                    tooltip="Eliminar compra"
                    buttonProps={{
                      variant: 'destructive',
                      size: 'sm',
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </TooltipButton> */}
                </div>
              </div>
            </header>

            {isErrorPurchase ? (
              <ErrorDataComponent
                errorMessage="No se pudo cargar la compra. Por favor, inténtalo de nuevo más tarde."
                onRetry={handleRetry}
              />
            ) : (
              <>
                {/* Overview */}
                <PurchaseOverview
                  purchase={purchase}
                  isLoading={isLoadingPurchase}
                  isError={isErrorPurchase}
                />

                {/* Products */}
                <PurchaseProducts
                  purchase={purchase}
                  isLoading={isLoadingPurchase}
                  isError={isErrorPurchase}
                />
              </>
            )}
          </div>
        </main>
      )}

      {/* Delete Confirmation Dialog */}
      <DeletePurchaseDialog
        open={showDeleteDialog}
        onClose={cancelDeletion}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        purchaseNumber={purchase?.nro}
      />
    </>
  );
};

export default PurchaseDetailScreen;
