import { Button } from '@/components/atoms/button';
import { useBranchStore } from '@/states/branchStore';
import { Save } from 'lucide-react';
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
          />
          <PurchaseDetailsTable
            detalles={formData.detalles}
            setDetalles={detalles => handleChange('detalles', detalles)}
          />
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Save className="mr-2" />
              {isLoading ? 'Guardando...' : 'Crear Compra'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchase;
