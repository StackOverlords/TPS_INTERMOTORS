import { Kbd } from '@/components/atoms/kbd';
import { Tabs, TabsList, TabsTrigger } from '@/components/atoms/tabs';
import ErrorDataComponent from '@/components/common/errorDataComponent';
import TooltipButton from '@/components/common/TooltipButton';
import { CornerUpLeft, Edit, FileText, Package, Trash2 } from 'lucide-react';
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

  if (!Number(purchaseId)) {
    return (
      <ErrorDataComponent
        errorMessage="No se pudo cargar la compra."
        showButtonIcon={false}
        buttonText="Ir a lista de compras"
        onRetry={() => {
          navigate('/dashboard/list-purchases');
        }}
      />
    );
  }

  const {
    data: purchase,
    isLoading: isLoadingPurchase,
    isError: isErrorPurchase,
    refetch: refetchPurchase,
  } = usePurchaseById(Number(purchaseId));

  const handleRetry = useCallback(() => {
    refetchPurchase();
  }, [refetchPurchase]);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard/list-purchases');
  }, [navigate]);

  const {
    showDeleteDialog,
    isDeleting,
    initiateDeletion,
    cancelDeletion,
    confirmDeletion,
  } = usePurchaseDelete();

  const handleEdit = useCallback(() => {
    navigate(`/dashboard/purchases/${purchaseId}/editar`);
  }, [navigate, purchaseId]);

  const handleDelete = useCallback(() => {
    initiateDeletion(Number(purchaseId));
  }, [initiateDeletion, purchaseId]);

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
  return (
    <>
      {isLoadingPurchase ? (
        <PurchaseDetailSkeleton />
      ) : (
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
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
                    <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                      Compra {purchase?.nro}
                    </h1>
                    {purchase && (
                      <p className="text-sm text-gray-600">
                        {purchase?.proveedor?.proveedor ?? '-'} -{' '}
                        {purchase?.cantidad_detalles ?? 0}{' '}
                        {(purchase?.cantidad_detalles ?? 0) === 1
                          ? 'producto'
                          : 'productos'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
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

                  <TooltipButton
                    onClick={handleDelete}
                    tooltip="Eliminar compra"
                    buttonProps={{
                      variant: 'destructive',
                      size: 'sm',
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </TooltipButton>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="flex flex-wrap-reverse gap-2 justify-between">
                <TabsList className="bg-white border border-gray-200 gap-2 h-10">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger
                    value="products"
                    className="data-[state=active]:bg-gray-900 data-[state=active]:text-white rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors h-8"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Productos
                  </TabsTrigger>
                </TabsList>
              </div>

              {isErrorPurchase ? (
                <ErrorDataComponent
                  errorMessage="No se pudo cargar la compra. Por favor, inténtalo de nuevo más tarde."
                  onRetry={handleRetry}
                />
              ) : (
                <>
                  {/* Overview Tab */}
                  <PurchaseOverview
                    purchase={purchase}
                    isLoading={isLoadingPurchase}
                    isError={isErrorPurchase}
                  />

                  {/* Products Tab */}
                  <PurchaseProducts
                    purchase={purchase}
                    isLoading={isLoadingPurchase}
                    isError={isErrorPurchase}
                  />
                </>
              )}
            </Tabs>
          </div>
        </div>
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
