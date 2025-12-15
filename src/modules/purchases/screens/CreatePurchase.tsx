import ResizableBox from '@/components/atoms/resizable-box';
import ShortcutKey from '@/components/common/ShortcutKey';
import TooltipButton from '@/components/common/TooltipButton'; 
import { useOrderSelectorWindow, useProductSelectorWindow } from '@/hooks/useSecondaryWindow';
import { useGetOrderById } from '@/modules/orders/hooks/useGetOrderById';
import { useBranchStore } from '@/states/branchStore';
import { AlertCircle, RotateCcw, Save, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import FormCreatePurchase from '../components/FormCreatePurchase';
import ProductSearchPanel from '../components/ProductSearchPanel';
import PurchaseDetailsTable from '../components/PurchaseDetailsTable';
import { usePurchaseForm } from '../hooks/usePurchaseForm';

type CreationMode = 'manual' | 'order-import';

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
  } = usePurchaseForm(Number(branchId), () => {
    // Clear local state after successful purchase creation
    setCreationMode('manual');
    setSelectedOrderId(null);
  });

  // Estados para controlar el modo de creación
  const [creationMode, setCreationMode] = useState<CreationMode>('manual');
  const [selectorMode, setSelectorMode] = useState<'embedded' | 'window'>('window');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);



  // Hook para obtener detalles del pedido seleccionado
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isOrderError,
  } = useGetOrderById(selectedOrderId || 0);

  

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
      // precio_venta_alt se calcula en cadena sobre precio_venta, no sobre costo
      const precio_venta_alt = precio_venta * (1 + inc_p_venta_alt / 100);
      const subtotal = costo * 1;

      const newDetail = {
        id_producto: product.id.toString(),
        cantidad: 1,
        costo: Number(costo.toFixed(2)),
        inc_p_venta: Number(inc_p_venta.toFixed(2)),
        precio_venta: Number(precio_venta.toFixed(2)),
        inc_p_venta_alt: Number(inc_p_venta_alt.toFixed(2)),
        precio_venta_alt: Number(precio_venta_alt.toFixed(2)),
        producto: product,
        subtotal: Number(subtotal.toFixed(2)),
      };

      handleChange('detalles', [...formData.detalles, newDetail]);
    },
    [formData.detalles, handleChange]
  );
  
  // Hook para manejar la ventana secundaria de productos
  const productWindow = useProductSelectorWindow({
    context: 'purchase',
    instanceId: 'create',
    onProductSelect: handleProductSelect,
    onlyWithStock: false,
  });

  // Hook para manejar la ventana secundaria de pedidos
  const orderWindow = useOrderSelectorWindow({
    context: 'purchase',
    instanceId: 'create',
    estado: 'A', // Solo pedidos en estado "Almacén"
    onOrderSelect: (data: { id: number }) => {
      setSelectedOrderId(data.id);
    },
  });

  // Efecto para cargar detalles del pedido cuando se selecciona uno
  useEffect(() => {
    if (orderData && selectedOrderId) {
      // Mapear detalles del pedido a detalles de compra
      const mappedDetalles = orderData.detalles?.map((detalle: any) => {
        // Parsear todos los valores numéricos correctamente
        const cantidad = parseInt(detalle.cantidad) || 1;
        const costo = parseFloat(detalle.costo || '0') || 0;
        const inc_p_venta = 30; // Puedes ajustar esto según necesites
        const inc_p_venta_alt = 15;

        // Calcular precios
        const precio_venta = costo * (1 + inc_p_venta / 100);
        const precio_venta_alt = precio_venta * (1 + inc_p_venta_alt / 100);
        const subtotal = costo * cantidad;

        return {
          id_producto: detalle.producto.id.toString(),
          cantidad: cantidad, // Ya es number
          costo: Number(costo.toFixed(2)), // Asegurar que sea number con 2 decimales
          inc_p_venta: Number(inc_p_venta.toFixed(2)), // Number
          precio_venta: Number(precio_venta.toFixed(2)), // Number
          inc_p_venta_alt: Number(inc_p_venta_alt.toFixed(2)), // Number
          precio_venta_alt: Number(precio_venta_alt.toFixed(2)), // Number - ESTE ERA EL PROBLEMA
          producto: detalle.producto,
          subtotal: Number(subtotal.toFixed(2)), // Number
        };
      }) || [];

      // Actualizar formulario con datos del pedido
      handleChange('detalles', mappedDetalles);
      handleChange('id_pedido', selectedOrderId);
      if (orderData.proveedor?.id) {
        handleChange('id_proveedor', orderData.proveedor.id);
      }
      if (orderData.responsable?.id) {
        handleChange('id_responsable', orderData.responsable.id);
      }

      // Cambiar al modo de importación
      setCreationMode('order-import');
    }
  }, [orderData, selectedOrderId, handleChange]);

  // Función para abrir selector de productos
  const handleOpenProductSelector = () => {
    if (creationMode === 'order-import') {
      // Mostrar advertencia: no se puede agregar productos en modo importación
      return;
    }

    if (productWindow.isOpen) {
      productWindow.close();
    }
    productWindow.open();
  };

  // Función para abrir selector de pedidos
  const handleOpenOrderSelector = () => {
    if (creationMode === 'manual' && formData.detalles.length > 0) {
      // Mostrar advertencia: hay productos agregados manualmente
      return;
    }

    if (orderWindow.isOpen) {
      orderWindow.close();
    }
    orderWindow.open();
  };

  // Función para cancelar importación de pedido
  const handleCancelOrderImport = () => {
    setCreationMode('manual');
    setSelectedOrderId(null);
    handleChange('detalles', []);
    handleChange('id_pedido', null);
  };

  // Wrapper para reset que también limpia estados locales
  const handleReset = useCallback(() => {
    reset();
    setCreationMode('manual');
    setSelectedOrderId(null);
  }, [reset]);

  // Toggle entre modo embedded y window
  const toggleSelectorMode = () => {
    if (productWindow.isOpen) {
      productWindow.close();
    }
    productWindow.open();
  };

  const canAddProducts = creationMode === 'manual';
  const canImportOrder = creationMode === 'manual' && formData.detalles.length === 0;

  return (
    <div className="max-h-auto">
      <div className="bg-gray-50 rounded-lg h-full w-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Registrar Compra
            </h2>
            {creationMode === 'order-import' && selectedOrderId && (
              <p className="text-sm text-blue-600 flex items-center gap-2 mt-1">
                <AlertCircle className="h-4 w-4" />
                Importando desde Pedido #{selectedOrderId}
              </p>
            )}
          </div>
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
            onReset={handleReset}
            onCancel={() => {
              console.log('Cancelando creación de compra');
            }}
          />
        </div>

        {/* Layout horizontal (en filas) */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-4">
          {/* Panel de búsqueda de productos - Superior (altura para ~5 filas) */}
          {/* Solo mostrar si el modo es 'embedded' */}
          {selectorMode === 'embedded' && (
            <div className="flex-shrink-0">
              <ResizableBox
                direction="vertical"
                minSize={'200px'}
                initialSize={'300px'}
              >
                <ProductSearchPanel
                  selectedProducts={formData.detalles}
                  onProductSelect={handleProductSelect}
                />
              </ResizableBox>
            </div>
          )}

          {/* Indicador cuando está en modo ventana */}
          {/* {selectorMode === 'window' && (
            <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Modo Ventana Secundaria Activo
                  </p>
                  <p className="text-sm text-blue-700">
                    El selector de productos está abierto en una ventana separada
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-600">
                {productWindow.isOpen ? 'Ventana Abierta' : 'Ventana Cerrada'}
              </Badge>
            </div>
          )} */}

          {/* Tabla de detalles - Inferior (ocupa el espacio restante) */}
          <div className="flex-shrink-0 bg-white rounded-lg p-4 border border-gray-200 flex flex-col flex-1">
            <PurchaseDetailsTable
              detalles={formData.detalles}
              toggleSelectorMode={handleOpenProductSelector}
              toggleOrderSelector={handleOpenOrderSelector}
              canAddProducts={canAddProducts}
              canImportOrder={canImportOrder}
              setDetalles={detalles => handleChange('detalles', detalles)}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-between gap-2">
          <div className="flex gap-2">
            {creationMode === 'order-import' && (
              <TooltipButton
                buttonProps={{
                  onClick: handleCancelOrderImport,
                  disabled: isLoading,
                  className:
                    'bg-red-500 hover:bg-red-600 hover:text-white text-white',
                }}
                tooltip="Cancelar importación de pedido"
              >
                <X className="mr-2" />
                Cancelar Importación
              </TooltipButton>
            )}
          </div>

          <div className="flex gap-2">
            <TooltipButton
              buttonProps={{
                onClick: handleReset,
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
    </div>
  );
};

export default CreatePurchase;
