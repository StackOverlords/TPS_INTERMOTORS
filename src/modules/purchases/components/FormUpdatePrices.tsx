import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { RadioGroup, RadioGroupItem } from '@/components/atoms/radio-group';
import { Switch } from '@/components/atoms/switch';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import ShortcutKey from '@/components/common/ShortcutKey';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { useCommands } from '@/keybindings';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, HelpCircle, RefreshCw } from 'lucide-react';
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

      <div className="space-y-3 mb-6">
        {/* Primera fila: Categoría, Tipo, Porcentaje, Fecha */}
        <Label className="text-xs font-medium mb-1">Tipo de Ajuste *</Label>
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 mb-3">
            <RadioGroup
              value={formData.tipo_ajuste}
              onValueChange={(value) => onChange('tipo_ajuste', value as 'incremento' | 'decremento')}
              disabled={isLoading}
              className="grid grid-cols-2 gap-2 h-10"
            >
              <Label
                htmlFor="incremento"
                className="flex items-center justify-center space-x-1.5 border border-gray-200 rounded-md px-2 cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-colors"
              >
                <RadioGroupItem value="incremento" id="incremento" className="h-3 w-3" />
                <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span>Incremento</span>
                </span>
              </Label>

              <Label
                htmlFor="decremento"
                className="flex items-center justify-center space-x-1.5 border border-gray-200 rounded-md px-2 cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-colors"
              >
                <RadioGroupItem value="decremento" id="decremento" className="h-3 w-3" />
                <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span>Decremento</span>
                </span>
              </Label>
            </RadioGroup>
            {errors.tipo_ajuste && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.tipo_ajuste}</p>}
          </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Categoría */}
          <div className="flex flex-col relative">
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
              clearOnEmpty={true}
            />
            {errors.categoria && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.categoria}</p>}
          </div>

          

          {/* Porcentaje */}
          <div className="flex flex-col relative">
            <Label className="text-xs font-medium mb-1">Porcentaje (%) *</Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.porcentaje || ''}
                onChange={e => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  onChange('porcentaje', value);
                }}
                className={inputClass('porcentaje')}
                disabled={isLoading}
                step="0.01"
                min="0"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
            </div>
            {errors.porcentaje && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.porcentaje}</p>}
          </div>

          {/* Fecha */}
          <div className="flex flex-col relative">
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
            {errors.fecha && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.fecha}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 items-start">
        {/* Aplicar a todas */}
        <div className="flex items-center space-x-2 h-10">
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
          <div className="flex flex-col relative">
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
            {errors.sucursal && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.sucursal}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormUpdatePrices;
