import ResizableBox from '@/components/atoms/resizable-box';
import ShortcutKey from '@/components/common/ShortcutKey';
import TooltipButton from '@/components/common/TooltipButton';
import { useBranchStore } from '@/states/branchStore';
import { RotateCcw, Save } from 'lucide-react';
import React, { useCallback } from 'react';
import FormCreatePurchase from '../components/FormCreatePurchase';
import ProductSearchPanel from '../components/ProductSearchPanel';
import PurchaseDetailsTable from '../components/PurchaseDetailsTable';
import { usePurchaseForm } from '../hooks/usePurchaseForm';

const CreatePurchase: React.FC = () => {
  const branchId = useBranchStore(state => state.selectedBranchId);
  const {
    formData,
    errors,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = usePurchaseForm(Number(branchId));

  // Función para agregar producto desde el panel de búsqueda
  const handleProductSelect = useCallback(
    (product: any) => {
      const existingDetail = formData.detalles.find(
        (d: any) => d.id_producto === product.id.toString()
      );

      if (existingDetail) {
        return; // Ya existe, no hacer nada
      }

      const costo = parseFloat(product.precio_venta) || 0;
      const inc_p_venta = 30; // 30% por defecto
      const inc_p_venta_alt = 15; // 15% por defecto

      const precio_venta = costo * (1 + inc_p_venta / 100);
      const precio_venta_alt = costo * (1 + inc_p_venta_alt / 100);

      const newDetail = {
        id_producto: product.id.toString(),
        cantidad: 1,
        costo,
        inc_p_venta,
        precio_venta,
        inc_p_venta_alt,
        precio_venta_alt,
        producto: product,
        subtotal: costo * 1,
      };

      handleChange('detalles', [...formData.detalles, newDetail]);
    },
    [formData.detalles, handleChange]
  );

  return (
    <div className="h-screen max-h-auto">
      <div className="bg-gray-50 rounded-lg h-full w-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Registrar Compra
          </h2>
        </div>

        {/* Formulario superior */}
        <div className="px-4 pt-4">
          <FormCreatePurchase
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onChange={handleChange}
            onBlur={handleBlur}
            onSubmit={handleSubmit}
            onReset={reset}
            onCancel={() => {
              console.log('Cancelando creación de compra');
            }}
          />
        </div>

        {/* Layout horizontal (en filas) */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-4">
          {/* Panel de búsqueda de productos - Superior (altura para ~5 filas) */}
          <div className="flex-shrink-0">
            <ResizableBox
              direction="vertical"
              minSize={'200px'}
              initialSize={'600px'}
            >
              <ProductSearchPanel
                selectedProducts={formData.detalles}
                onProductSelect={handleProductSelect}
              />
            </ResizableBox>
          </div>

          {/* Tabla de detalles - Inferior (ocupa el espacio restante) */}
          <div className="flex-shrink-0 min-h-[400px] bg-white rounded-lg p-4 border border-gray-200 flex flex-col flex-1">
            <PurchaseDetailsTable
              detalles={formData.detalles}
              setDetalles={detalles => handleChange('detalles', detalles)}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
          <TooltipButton
            buttonProps={{
              onClick: reset,
              disabled: isLoading,
              className:
                'bg-gray-500 hover:bg-gray-600 hover:text-white text-white',
            }}
            tooltip={
              <span className="flex items-center gap-1">
                Limpiar formulario <ShortcutKey combo="ctrl+r" />
              </span>
            }
          >
            <RotateCcw className="mr-2" />
            Limpiar
          </TooltipButton>

          <TooltipButton
            buttonProps={{
              onClick: handleSubmit,
              disabled: isLoading,
              className:
                'bg-gray-900 hover:bg-gray-800 hover:text-white text-white',
            }}
            tooltip={
              <span className="flex items-center gap-1">
                Crear compra <ShortcutKey combo="alt+s" />
              </span>
            }
          >
            <Save className="mr-2" />
            {isLoading ? 'Guardando...' : 'Crear Compra'}
          </TooltipButton>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchase;
