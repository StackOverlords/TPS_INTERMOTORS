import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import ShortcutKey from '@/components/common/ShortcutKey';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { useCommands } from '@/keybindings';
import { HelpCircle, ShoppingBag } from 'lucide-react';
import React, { useRef } from 'react';
import { useProviders } from '../hooks/useProviders';
import { usePurchaseCommons } from '../hooks/usePurchaseCommons';
import { type FormData } from '../hooks/usePurchaseForm';
import PopoverDatePicker from '@/components/common/PopoverDatePicker';
import { useFormEnterNavigation } from '@/hooks/useFormEnterNavigation';
interface Props {
  formData: FormData;
  errors: Record<string, string>;
  isLoading: boolean;
  onChange: (field: keyof FormData, value: any) => void;
  onBlur: (field: keyof FormData) => void;
  onSubmit: () => void;
  onReset?: () => void;
  onCancel?: () => void;
}

const FormCreatePurchase: React.FC<Props> = ({
  formData,
  errors,
  onChange,
  onBlur,
  onSubmit,
  onReset,
  onCancel,
}) => {
  const { data: proveedores = [], isLoading: isLoadingProviders } =
    useProviders();
  const {
    purchaseTypes,
    purchaseModalities,
    responsibles,
    loading,
  } = usePurchaseCommons();

  const inputClass = (f: string) =>
    errors[f]
      ? 'text-sm border-red-500 focus:border-red-500'
      : 'text-sm';

  // Convertir string a Date para PopoverDatePicker
  const parseDateFromString = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Manejar cambio de fecha desde PopoverDatePicker
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      onChange('fecha', dateString);
    } else {
      onChange('fecha', '');
    }
  };

  // ✨ Nuevo sistema de keybindings - más simple y reactivo
  useCommands({
    'forms.save': onSubmit,
    'forms.reset': onReset || undefined,
    // 'forms.cancel': onCancel || undefined,
  });

  // Habilitar navegación con Enter entre campos del formulario
  const containerRef = useRef<HTMLDivElement>(null);
  useFormEnterNavigation({
    submitOnLastField: false, // No ejecutar submit automáticamente
    onSubmit: onSubmit,
    containerRef: containerRef,
    excludeSelectors: [
      // Excluir inputs de la tabla de detalles (ya tienen su propia navegación)
      '.editable-cell-input',
      '[data-table-cell="true"]',
      '[name="btn-chvron-right"]'
    ],
    enabled: true,
  });


  return (
    <div  className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <ShoppingBag className="w-4 h-4" />
          Información de Compra
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
                <h4 className="text-xs font-medium text-gray-700 tracking-wide">
                  Navegación
                </h4>
                <div className="space-y-1 text-gray-600 text-xs">
                  <p>
                    {' '}
                    <ShortcutKey combo={'Tab'} /> Siguiente campo{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Shift + Tab'} /> Campo anterior{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Enter'} /> Navegación automática{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Ctrl + Tab'} /> Avanzar rápido{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Alt + S'} /> Guardar compra{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Ctrl + R'} /> Limpiar formulario{' '}
                  </p>
                  <p>
                    {' '}
                    <ShortcutKey combo={'Ctrl + Shift + ?'} /> Ver todos los atajos{' '}
                  </p>
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
      <div ref={containerRef} className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 items-end mb-6">
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Fecha *</Label>
          {/* <Input
            type="date"
            value={formatDate(formData.fecha)}
            onChange={e => onChange('fecha', e.target.value)}
            onBlur={() => onBlur('fecha')}
            className={inputClass('fecha')}
          /> */}
          <PopoverDatePicker
            value={parseDateFromString(formData.fecha)}
            onChange={handleDateChange}
            className={inputClass('fecha')}
          >

          </PopoverDatePicker>
          {errors.fecha && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.fecha}</p>}
        </div>
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Proveedor *</Label>
          <ComboboxSelect
            value={formData.id_proveedor || undefined}
            onChange={v => onChange('id_proveedor', v)}
            options={proveedores}
            optionTag="nombre"
            placeholder={isLoadingProviders ? 'Cargando proveedores...' : 'Proveedor'}
            className={inputClass('id_proveedor')}
            disabled={isLoadingProviders}
            clearOnEmpty={true}
            data-field="id_proveedor"
            name="id_proveedor"
          />
          {errors.id_proveedor && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.id_proveedor}</p>}
        </div>


        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Nro comprobante *</Label>
          <Input
            type="text"
            value={formData.nro_comprobante}
            onChange={e => onChange('nro_comprobante', e.target.value)}
            onBlur={() => onBlur('nro_comprobante')}
            placeholder="FA-01"
            className={inputClass('nro_comprobante')}
            data-field="nro_comprobante"
            name="nro_comprobante"
          />
          {errors.nro_comprobante && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.nro_comprobante}</p>}
        </div>

        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Nro. Compro 2 (Opcional)</Label>
          <Input
            type="text"
            value={formData.nro_comprobante2}
            onChange={e => onChange('nro_comprobante2', e.target.value)}
            onBlur={() => onBlur('nro_comprobante2')}
            className={inputClass('nro_comprobante2')}
            data-field="nro_comprobante2"
            name="nro_comprobante2"
          />
          {errors.nro_comprobante2 && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.nro_comprobante2}</p>}
        </div>

        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Tipo *</Label>
          <ComboboxSelect
            value={formData.tipo_compra || undefined}
            onChange={v => onChange('tipo_compra', v)}
            options={purchaseTypes.map(pt => ({ id: pt.value, label: pt.label }))}
            optionTag="label"
            placeholder={loading.types ? 'Cargando...' : 'Tipo'}
            className={inputClass('tipo_compra')}
            disabled={loading.types}
            clearOnEmpty={true}
            name="tipo_compra"
          />
          {errors.tipo_compra && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.tipo_compra}</p>}
        </div>

        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Forma *</Label>
          <ComboboxSelect
            value={formData.forma_compra || undefined}
            onChange={v => onChange('forma_compra', v)}
            options={purchaseModalities.map(pm => ({ id: pm.value, label: pm.label }))}
            optionTag="label"
            placeholder={loading.modalities ? 'Cargando...' : 'Forma'}
            className={inputClass('forma_compra')}
            disabled={loading.modalities}
            clearOnEmpty={true}
            name="forma_compra"
          />
          {errors.forma_compra && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.forma_compra}</p>}
        </div>

        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Responsable *</Label>
          <ComboboxSelect
            value={formData.id_responsable || undefined}
            onChange={v => onChange('id_responsable', v)}
            options={responsibles.map(r => ({ id: r.value, label: r.label }))}
            optionTag="label"
            placeholder={loading.responsibles ? 'Cargando...' : 'Responsable'}
            className={inputClass('id_responsable')}
            disabled={loading.responsibles}
            clearOnEmpty={true}
            name="id_responsable"
          />
          {errors.id_responsable && <p className="text-xs text-red-500 absolute -bottom-5 left-0">{errors.id_responsable}</p>}
        </div>
      </div>

      <div className="p-3 bg-white rounded-lg">
        <div className="flex flex-col">
          <Label className="text-xs font-medium mb-1">Comentarios (Opcional)</Label>
          <textarea
            value={formData.comentario}
            onChange={e => onChange('comentario', e.target.value)}
            onBlur={() => onBlur('comentario')}
            placeholder="Comentarios adicionales"
            rows={1}
            className="p-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
        </div>
      </div>
    </div>
  );
};

export default FormCreatePurchase;
