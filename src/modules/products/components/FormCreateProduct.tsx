import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import ShortcutKey from '@/components/common/ShortcutKey';
import TooltipButton from '@/components/common/TooltipButton';
import { TooltipWrapper } from '@/components/common/TooltipWrapper';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCategoriesWithSubcategories } from '@/modules/shared/hooks/useCategories';
import { useCommonBrands } from '@/modules/shared/hooks/useCommonBrands';
import { useCommonMeasurements } from '@/modules/shared/hooks/useCommonMeasurements';
import { useCommonOrigins } from '@/modules/shared/hooks/useCommonOrigins';
import { useCommonSubcategories } from '@/modules/shared/hooks/useCommonSubcategories';
import { useCommonVehicleBrands } from '@/modules/shared/hooks/useCommonVehicleBrands';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Loader2, Package, Save, Wand2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCreateProduct } from '../hooks/mutations/useCreateProduct';
import { useAutoDescription } from '../hooks/useAutoDescription';
import { ProductCreateSchema } from '../schemas/productCreate.schema';
import type { ProductCreate } from '../types/ProductCreate.types';

const FormCreateProduct: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<ProductCreate>({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues: {
      descripcion: '',
      id_categoria: 0,
      id_subcategoria: 0,
      descripcion_alt: '',
      codigo_oem: '',
      codigo_upc: '',
      modelo: '',
      medida: '',
      nro_motor: '',
      costo_referencia: 0,
      stock_minimo: 0,
      precio_venta: 0,
      precio_venta_alt: 0,
      id_marca: 0,
      id_procedencia: 0,
      id_marca_vehiculo: 0,
      id_unidad: 0,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const {
    id_categoria,
    id_marca_vehiculo,
    nro_motor,
    medida,
    modelo,
    descripcion_alt,
  } = watchedValues;

  const { data: categorys } = useCategoriesWithSubcategories();
  const { data: brands } = useCommonBrands();
  const { data: vehicleBrands } = useCommonVehicleBrands();
  const { data: procedencia } = useCommonOrigins();
  const { data: unidades } = useCommonMeasurements();

  const { data: subcategorias } = useCommonSubcategories({
    categoria: id_categoria,
    enabled: !!id_categoria,
  });

  const { handleError } = useErrorHandler();

  const selectedCategory = categorys?.find(cat => cat.id === id_categoria);
  const selectedVehicleBrand = vehicleBrands?.find(
    brand => brand.id === id_marca_vehiculo
  );

  const autoDescription = useAutoDescription({
    categoryName: selectedCategory?.categoria,
    vehicleBrandName: selectedVehicleBrand?.marca_vehiculo,
    motorNumber: nro_motor,
    measurement: medida,
    model: modelo,
    altDescription: descripcion_alt,
  });

  useEffect(() => {
    setValue('descripcion', autoDescription);
  }, [autoDescription, setValue]);

  useEffect(() => {
    if (id_categoria && id_categoria !== 0) {
      setValue('id_subcategoria', 0);
    }
  }, [id_categoria, setValue]);

  const { mutate: handleCreateProduct, isPending } = useCreateProduct();

  const onSubmitCreate = (data: ProductCreate) => {
    handleCreateProduct(data, {
      onSuccess: res => {
        showSuccessToast({
          title: 'Producto agregado',
          description: `Producto agregado con exitosamente. ID: #${res.id}`,
          duration: 5000,
        });
        // setTimeout(handleGoBack, 200);
      },
      onError: (error: unknown) => {
        handleError({ error, customTitle: 'No se pudo agregar el producto' });
      },
    });
    reset();
  };

  const onError = (errors: FieldErrors<ProductCreate>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof ProductCreate;
    const firstError = errors[firstErrorKey];

    if (firstError?.message) {
      showErrorToast({
        title: 'Error en el formulario',
        description: firstError.message,
        duration: 5000,
      });
    }
  };

  const getInputClassName = (fieldName: keyof ProductCreate): string => {
    const baseClass = '';
    return errors[fieldName]
      ? `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`
      : baseClass;
  };

  const getSelectClassName = (fieldName: keyof ProductCreate): string => {
    const baseClass = '';
    return errors[fieldName]
      ? `${baseClass} border-red-500 focus:border-red-500`
      : baseClass;
  };

  // Keyboard navigation helpers
  const focusNextField = () => {
    const focusableElements = document.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as Element
    );
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    (focusableElements[nextIndex] as HTMLElement)?.focus();
  };

  const focusPrevField = () => {
    const focusableElements = document.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as Element
    );
    const prevIndex =
      currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    (focusableElements[prevIndex] as HTMLElement)?.focus();
  };

  // Shortcuts
  useHotkeys('alt+s', e => {
    e.preventDefault();
    const submitButton = document.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton && !isPending && !isSubmitting) {
      submitButton.click();
    }
  });

  // Navigation shortcuts
  useHotkeys('ctrl+tab', e => {
    e.preventDefault();
    focusNextField();
  });

  useHotkeys('ctrl+shift+tab', e => {
    e.preventDefault();
    focusPrevField();
  });

  // Enter key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target !== document.querySelector('button[type="submit"]')
    ) {
      e.preventDefault();
      focusNextField();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitCreate)}
      onKeyDown={handleKeyDown}
      className="w-full space-y-2"
    >
      {/* Información Principal */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Package className="w-4 h-4" />
            Información Principal
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
                      <ShortcutKey combo={'Alt + Shift'} /> Guardar producto{' '}
                    </p>
                    <p>
                      {' '}
                      <ShortcutKey combo={'Ctrl + Tab'} /> Avanzar rápido{' '}
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
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Categoría */}
          <div>
            <Label>Categoría *</Label>
            <Controller
              name="id_categoria"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value))}
                  options={(categorys || []).map(category => ({
                    id: category.id,
                    categoria: category.categoria,
                  }))}
                  optionTag="categoria"
                  placeholder="Seleccionar categoría"
                  searchPlaceholder="Buscar categorías..."
                  className={getSelectClassName('id_categoria')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_categoria && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_categoria.message}
                </p>
              )}
            </div>
          </div>

          {/* Subcategoría */}
          <div>
            <Label>Subcategoría (Opcional)</Label>
            <Controller
              name="id_subcategoria"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value) || 0)}
                  options={subcategorias || []}
                  optionTag="subcategoria"
                  placeholder="Seleccionar subcategoría"
                  searchPlaceholder="Buscar subcategoría..."
                  className={getSelectClassName('id_subcategoria')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_subcategoria && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_subcategoria.message}
                </p>
              )}
            </div>
          </div>

          {/* Precio de venta */}
          <div>
            <Label>Precio de venta *</Label>
            <Controller
              name="precio_venta"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  autoSelectOnFocus={true}
                  step="0.01"
                  min={0}
                  {...field}
                  onChange={e =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className={getInputClassName('precio_venta')}
                />
              )}
            />
            <div className="mt-1">
              {errors.precio_venta && (
                <p className="text-xs text-red-500 truncate">
                  {errors.precio_venta.message}
                </p>
              )}
            </div>
          </div>

          {/* P. Venta. Alt */}
          <div>
            <Label>P. Venta. Alt *</Label>
            <Controller
              name="precio_venta_alt"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  autoSelectOnFocus={true}
                  {...field}
                  onChange={e =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className={getInputClassName('precio_venta_alt')}
                />
              )}
            />
            <div className="mt-1">
              {errors.precio_venta_alt && (
                <p className="text-xs text-red-500 truncate">
                  {errors.precio_venta_alt.message}
                </p>
              )}
            </div>
          </div>

          {/* Stock mínimo */}
          <div>
            <Label>Stock mínimo *</Label>
            <Controller
              name="stock_minimo"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  autoSelectOnFocus={true}
                  min={0}
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={getInputClassName('stock_minimo')}
                />
              )}
            />
            <div className="mt-1">
              {errors.stock_minimo && (
                <p className="text-xs text-red-500 truncate">
                  {errors.stock_minimo.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Especificaciones del Vehículo */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Especificaciones del Vehículo
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Marca */}
          <div>
            <Label>Marca *</Label>
            <Controller
              name="id_marca"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value))}
                  options={brands || []}
                  optionTag="marca"
                  placeholder="Seleccionar marca"
                  searchPlaceholder="Buscar marcas..."
                  className={getSelectClassName('id_marca')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_marca && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_marca.message}
                </p>
              )}
            </div>
          </div>

          {/* Marca vehículo */}
          <div>
            <Label>Marca vehículo *</Label>
            <Controller
              name="id_marca_vehiculo"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value))}
                  options={vehicleBrands || []}
                  optionTag="marca_vehiculo"
                  placeholder="Seleccionar marca vehículo"
                  searchPlaceholder="Buscar marcas..."
                  className={getSelectClassName('id_marca_vehiculo')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_marca_vehiculo && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_marca_vehiculo.message}
                </p>
              )}
            </div>
          </div>

          {/* Nro. Motor */}
          <div>
            <Label>Nro. Motor (Opcional)</Label>
            <Input
              {...register('nro_motor')}
              placeholder="Nro. Motor"
              className={getInputClassName('nro_motor')}
            />
            <div className="mt-1">
              {errors.nro_motor && (
                <p className="text-xs text-red-500 truncate">
                  {errors.nro_motor.message}
                </p>
              )}
            </div>
          </div>

          {/* Medida */}
          <div>
            <Label>Medida (Opcional)</Label>
            <Input
              {...register('medida')}
              placeholder="Medida"
              className={getInputClassName('medida')}
            />
            <div className="mt-1">
              {errors.medida && (
                <p className="text-xs text-red-500 truncate">
                  {errors.medida.message}
                </p>
              )}
            </div>
          </div>

          {/* Modelo */}
          <div>
            <Label>Modelo (Opcional)</Label>
            <Input {...register('modelo')} placeholder="Ej: 2020-2024" />
            <div className="mt-1">
              {errors.modelo && (
                <p className="text-xs text-red-500 truncate">
                  {errors.modelo.message}
                </p>
              )}
            </div>
          </div>

          {/* Descripción alt. */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <div>
              <Label>Descripción alt. *</Label>
              <Controller
                name="descripcion_alt"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Descripción alt." />
                )}
              />
              <div className="mt-1">
                {errors.descripcion_alt && (
                  <p className="text-xs text-red-500 truncate">
                    {errors.descripcion_alt.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción Auto-generada */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <h3 className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900">
          <Wand2 className="w-4 h-4" />
          Descripción Auto-generada
        </h3>
        <div className="p-3 text-sm text-gray-800 border border-gray-200 rounded bg-gray-50 min-h-[40px] flex items-center">
          {autoDescription || 'Completa los campos para generar la descripción'}
        </div>
      </div>

      {/* Información Adicional */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Información Adicional
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Costo Referencia */}
          <div>
            <Label>Costo Referencia *</Label>
            <Controller
              name="costo_referencia"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  autoSelectOnFocus={true}
                  step="0.01"
                  {...field}
                  onChange={e =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className={getInputClassName('costo_referencia')}
                />
              )}
            />
            <div className="mt-1">
              {errors.costo_referencia && (
                <p className="text-xs text-red-500 truncate">
                  {errors.costo_referencia.message}
                </p>
              )}
            </div>
          </div>

          {/* Código OEM */}
          <div>
            <Label>Código OEM (Opcional)</Label>
            <Input {...register('codigo_oem')} placeholder="Código OEM" />
            <div className="mt-1">
              {errors.codigo_oem && (
                <p className="text-xs text-red-500 truncate">
                  {errors.codigo_oem.message}
                </p>
              )}
            </div>
          </div>

          {/* Código UPC */}
          <div>
            <Label>Código UPC *</Label>
            <Controller
              name="codigo_upc"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Código UPC" />
              )}
            />
            <div className="mt-1">
              {errors.codigo_upc && (
                <p className="text-xs text-red-500 truncate">
                  {errors.codigo_upc.message}
                </p>
              )}
            </div>
          </div>

          {/* Unidad */}
          <div>
            <Label>Unidad *</Label>
            <Controller
              name="id_unidad"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value))}
                  options={unidades || []}
                  optionTag="unidad_medida"
                  placeholder="Seleccionar unidad"
                  searchPlaceholder="Buscar unidad..."
                  className={getSelectClassName('id_unidad')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_unidad && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_unidad.message}
                </p>
              )}
            </div>
          </div>

          {/* Procedencia */}
          <div>
            <Label>Procedencia *</Label>
            <Controller
              name="id_procedencia"
              control={control}
              render={({ field }) => (
                <ComboboxSelect
                  value={field.value}
                  onChange={value => field.onChange(Number(value))}
                  options={procedencia || []}
                  optionTag="procedencia"
                  placeholder="Seleccionar procedencia"
                  searchPlaceholder="Buscar procedencia..."
                  className={getSelectClassName('id_procedencia')}
                />
              )}
            />
            <div className="mt-1">
              {errors.id_procedencia && (
                <p className="text-xs text-red-500 truncate">
                  {errors.id_procedencia.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500">* Campos requeridos</span>
          <TooltipButton
            buttonProps={{
              type: 'submit',
              disabled: isPending || isSubmitting,
              variant: 'default',
              className: 'w-full sm:w-auto',
            }}
            tooltip={
              <span className="flex items-center gap-1">
                Registrar producto <ShortcutKey combo="alt+s" />
              </span>
            }
          >
            {isPending || isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Registrar Producto
              </>
            )}
          </TooltipButton>
        </div>
      </div>
    </form>
  );
};

export default FormCreateProduct;
