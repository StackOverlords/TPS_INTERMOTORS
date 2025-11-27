import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import ShortcutKey from '@/components/common/ShortcutKey';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { useCommands } from '@/keybindings';
import { format } from 'date-fns';
import { HelpCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import type { UpdatePricesFormData } from '../schemas/updatePrices.schema';

interface Props {
  formData: UpdatePricesFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  onChange: (field: keyof UpdatePricesFormData, value: any) => void;
  onSubmit: () => void;
  onReset?: () => void;
  categories: any[];
  branches: any[];
  loadingCategories: boolean;
  loadingBranches: boolean;
}

const FormUpdatePrices: React.FC<Props> = ({
  formData,
  errors,
  isLoading,
  onChange,
  onSubmit,
  onReset,
  categories,
  branches,
  loadingCategories,
  loadingBranches,
}) => {
  const inputClass = (f: string) =>
    errors[f]
      ? 'text-sm border-red-500 focus:border-red-500'
      : 'text-sm';

  useCommands({
    'forms.save': onSubmit,
    'forms.reset': onReset || undefined,
  });

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <RefreshCw className="w-4 h-4" />
          Actualización de Precios
        </h2>
        <TooltipWrapper
          tooltipContentProps={{
            align: 'end',
            className: 'max-w-xs',
          }}
          tooltip={
            <div className="flex flex-col space-y-3">
              <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Atajos de teclado
              </div>
              <div className="space-y-1.5">
                <div className="space-y-1 text-gray-600 text-xs">
                  <p><ShortcutKey combo={'Alt + S'} /> Actualizar precios</p>
                  <p><ShortcutKey combo={'Ctrl + R'} /> Limpiar formulario</p>
                </div>
              </div>
            </div>
          }
        >
          <span className="border-gray-200 border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
            <HelpCircle className="w-4 h-4" />
          </span>
        </TooltipWrapper>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        
        {/* Categoría */}
        <div className="flex flex-col">
          <Label className="text-xs font-medium mb-1">Categoría *</Label>
          <ComboboxSelect
            value={formData.categoria || undefined}
            onChange={v => onChange('categoria', Number(v))}
            options={categories}
            optionTag="categoria" 
            placeholder={loadingCategories ? 'Cargando...' : 'Seleccionar categoría'}
            className={inputClass('categoria')}
            disabled={loadingCategories || isLoading}
            error={!!errors.categoria}
          />
          {errors.categoria && <p className="text-xs text-red-500 mt-1">{errors.categoria}</p>}
        </div>

        {/* Incremento */}
        <div className="flex flex-col">
          <Label className="text-xs font-medium mb-1">Incremento (%) *</Label>
          <div className="relative">
            <Input
              type="number"
              value={formData.incremento}
              onChange={e => onChange('incremento', parseFloat(e.target.value))}
              className={inputClass('incremento')}
              disabled={isLoading}
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
          </div>
          {errors.incremento && <p className="text-xs text-red-500 mt-1">{errors.incremento}</p>}
        </div>

        {/* Fecha */}
        <div className="flex flex-col">
          <Label className="text-xs font-medium mb-1">Fecha de aplicación</Label>
          <PopoverDatePicker
            value={formData.fecha ? new Date(formData.fecha + 'T00:00:00') : undefined}
            onChange={(date) => {
              if (date) {
                try {
                  onChange('fecha', format(date, 'yyyy-MM-dd'));
                } catch (e) {
                  console.error('Error formatting date', e);
                }
              } else {
                onChange('fecha', '');
              }
            }}
            hasError={errors.fecha}
            disabled={() => isLoading}
          />
          {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
        </div>

      </div>

      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 items-center">
        {/* Aplicar a todas */}
        <div className="flex items-center space-x-2 p-3 rounded-md">
          <Switch
            checked={formData.aplicar_todas}
            onCheckedChange={v => onChange('aplicar_todas', v)}
            disabled={isLoading}
            id="aplicar_todas"
          />
          <Label htmlFor="aplicar_todas" className="text-sm cursor-pointer">
            Aplicar a todas las sucursales
          </Label>
        </div>

        {/* Sucursal (Condicional) */}
        {!formData.aplicar_todas && (
          <div className="flex flex-col">
            <Label className="text-xs font-medium mb-1">Sucursal *</Label>
            <ComboboxSelect
              value={formData.sucursal || undefined}
              onChange={v => onChange('sucursal', Number(v))}
              options={branches}
              optionTag="nombre"
              placeholder={loadingBranches ? 'Cargando...' : 'Seleccionar sucursal'}
              className={inputClass('sucursal')}
              disabled={loadingBranches || isLoading}
              error={!!errors.sucursal}
            />
            {errors.sucursal && <p className="text-xs text-red-500 mt-1">{errors.sucursal}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormUpdatePrices;
