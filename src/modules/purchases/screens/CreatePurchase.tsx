import ShortcutKey from '@/components/common/ShortcutKey';
import TooltipButton from '@/components/common/TooltipButton';
import { useBranchStore } from '@/states/branchStore';
import { RotateCcw, Save } from 'lucide-react';
import React from 'react';
import FormCreatePurchase from '../components/FormCreatePurchase';
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
 
  return (
    <div className={'h-screen max-h-auto'}>
      <div className="bg-white rounded-lg h-full bg-red-200 w-full">
        <h2 className="text-lg font-semibold mb-4 ml-4">Registrar Compra</h2>
        <div className="p-1 w-full h-full overflow-y-auto gap-4 flex flex-col">
          <FormCreatePurchase
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onChange={handleChange}
            onBlur={handleBlur}
            onSubmit={handleSubmit}
            onReset={reset}
            onCancel={() => {
              // Lógica para cancelar - podría navegar atrás
              console.log('Cancelando creación de compra');
            }}
          />
          <PurchaseDetailsTable
            detalles={formData.detalles}
            setDetalles={detalles => handleChange('detalles', detalles)}
          />
          <div className="mt-6 flex justify-end gap-2">
            <TooltipButton
              buttonProps={{
                onClick: reset,
                disabled: isLoading,
                className: "bg-gray-500 hover:bg-gray-600 hover:text-white text-white"
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
                className: "bg-gray-900 hover:bg-gray-800 hover:text-white text-white"
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
