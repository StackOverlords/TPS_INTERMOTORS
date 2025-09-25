import { useState, useEffect } from 'react';
import { purchaseCommonsService } from '../services/purchaseCommonsService';
import type { ResponsibleData, SelectOption } from '../types/purchaseCommons';

export const usePurchaseCommons = () => {
  const [purchaseTypes, setPurchaseTypes] = useState<SelectOption[]>([]);
  const [purchaseModalities, setPurchaseModalities] = useState<SelectOption[]>([]);
  const [responsibles, setResponsibles] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState({
    types: false,
    modalities: false,
    responsibles: false,
  });
  const [errors, setErrors] = useState({
    types: null as string | null,
    modalities: null as string | null,
    responsibles: null as string | null,
  });

  /**
   * Carga los tipos de compra
   */
  const loadPurchaseTypes = async () => {
    setLoading(prev => ({ ...prev, types: true }));
    setErrors(prev => ({ ...prev, types: null }));
    
    try {
      const data = await purchaseCommonsService.getPurchaseTypes();
      // Verificar que data existe y es un objeto
      if (data && typeof data === 'object') {
        const options: SelectOption[] = Object.entries(data).map(([key, value]) => ({
          value: key,
          label: value,
        }));
        setPurchaseTypes(options);
      } else {
        console.warn('Purchase types data is not in expected format:', data);
        setPurchaseTypes([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrors(prev => ({ ...prev, types: errorMessage }));
      console.error('Error loading purchase types:', error);
    } finally {
      setLoading(prev => ({ ...prev, types: false }));
    }
  };

  /**
   * Carga las modalidades de compra
   */
  const loadPurchaseModalities = async () => {
    setLoading(prev => ({ ...prev, modalities: true }));
    setErrors(prev => ({ ...prev, modalities: null }));
    
    try {
      const data = await purchaseCommonsService.getPurchaseModalities();
      // Verificar que data existe y es un objeto
      if (data && typeof data === 'object') {
        const options: SelectOption[] = Object.entries(data).map(([key, value]) => ({
          value: key,
          label: value,
        }));
        setPurchaseModalities(options);
      } else {
        console.warn('Purchase modalities data is not in expected format:', data);
        setPurchaseModalities([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrors(prev => ({ ...prev, modalities: errorMessage }));
      console.error('Error loading purchase modalities:', error);
    } finally {
      setLoading(prev => ({ ...prev, modalities: false }));
    }
  };

  /**
   * Carga los responsables
   */
  const loadResponsibles = async () => {
    setLoading(prev => ({ ...prev, responsibles: true }));
    setErrors(prev => ({ ...prev, responsibles: null }));
    
    try {
      const data = await purchaseCommonsService.getResponsibles();
      // Verificar que data existe y es un array
      if (Array.isArray(data)) {
        const options: SelectOption[] = data.map((responsible: ResponsibleData) => ({
          value: responsible.id,
          label: responsible.nombre,
        }));
        setResponsibles(options);
      } else {
        console.warn('Responsibles data is not in expected format (expected array):', data);
        setResponsibles([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrors(prev => ({ ...prev, responsibles: errorMessage }));
      console.error('Error loading responsibles:', error);
    } finally {
      setLoading(prev => ({ ...prev, responsibles: false }));
    }
  };

  /**
   * Carga todos los datos
   */
  const loadAllData = async () => {
    await Promise.all([
      loadPurchaseTypes(),
      loadPurchaseModalities(),
      loadResponsibles(),
    ]);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return {
    purchaseTypes,
    purchaseModalities,
    responsibles,
    loading,
    errors,
    refetch: {
      purchaseTypes: loadPurchaseTypes,
      purchaseModalities: loadPurchaseModalities,
      responsibles: loadResponsibles,
      all: loadAllData,
    },
  };
};
