import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import { Calendar, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useProviders } from '../../hooks/useProviders';
import type { usePurchaseFilters } from '../../hooks/usePurchaseFilters';

interface PurchaseFiltersProps {
  filters: ReturnType<typeof usePurchaseFilters>['filters'];
  updateFilter: ReturnType<typeof usePurchaseFilters>['updateFilter'];
}

const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  filters,
  updateFilter,
}) => {
  const { data: providersData } = useProviders(); // Cargar todos los proveedores

  // Inputs locales
  const [codigoInterno, setCodigoInterno] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [codigoOemProducto, setCodigoOemProducto] = useState('');

  // Debounce
  const [debouncedCodigoInterno] = useDebounce(codigoInterno, 500);
  const [debouncedFechaInicio] = useDebounce(fechaInicio, 500);
  const [debouncedFechaFin] = useDebounce(fechaFin, 500);
  const [debouncedCodigoOemProducto] = useDebounce(codigoOemProducto, 500);

  // Sync debounced values al filtro global
  useEffect(() => {
    updateFilter(
      'codigo_interno',
      debouncedCodigoInterno ? Number(debouncedCodigoInterno) : undefined
    );
  }, [debouncedCodigoInterno]);

  useEffect(() => {
    updateFilter('fecha_inicio', debouncedFechaInicio);
  }, [debouncedFechaInicio]);

  useEffect(() => {
    updateFilter('fecha_fin', debouncedFechaFin);
  }, [debouncedFechaFin]);

  useEffect(() => {
    updateFilter('codigo_oem_producto', debouncedCodigoOemProducto);
  }, [debouncedCodigoOemProducto]);

  // Efecto para limpiar filtros
  useEffect(() => {
    if (
      !filters.codigo_interno &&
      !filters.proveedor &&
      !filters.fecha_inicio &&
      !filters.fecha_fin &&
      !filters.codigo_oem_producto
    ) {
      setCodigoInterno('');
      setFechaInicio('');
      setFechaFin('');
      setCodigoOemProducto('');
    }
  }, [filters]);

  return (
    <>
      {/* Búsquedas individuales */}
      <div className="space-y-4 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              Nro de Compra
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="COM-1070..."
                value={codigoInterno}
                onChange={e => setCodigoInterno(e.target.value)}
                className="pl-10 font-mono text-xs"
                type="number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              Proveedor
            </Label>
            <ComboboxSelect
              value={filters.proveedor}
              onChange={(value: any) => {
                const parsedValue = value === 'all' ? undefined : Number(value);
                updateFilter('proveedor', parsedValue);
              }}
              options={providersData || []}
              optionTag={'nombre'}
              placeholder="Seleccionar proveedor"
              searchPlaceholder="Buscar proveedores..."
              enableAllOption={false}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              Código OEM Producto
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="11122-10040..."
                value={codigoOemProducto}
                onChange={e => setCodigoOemProducto(e.target.value)}
                className="pl-10 font-mono text-xs"
              />
            </div>
          </div> 
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Fecha Inicio
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="pl-10 text-xs"
                    placeholder="2025-01-01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 text-sm font-medium">
                  Fecha Fin
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    className="pl-10 text-xs"
                    placeholder="2025-09-01"
                  />
                </div>
              </div>
        </div>
      </div>

      {/* Filters */}
    </>
  );
};

export default PurchaseFilters;
