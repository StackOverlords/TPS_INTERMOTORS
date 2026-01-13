import { useCategoriesWithSubcategories } from "@/modules/shared/hooks/useCategories";
import { useCommonBrands } from "@/modules/shared/hooks/useCommonBrands";
import { useCommonMeasurements } from "@/modules/shared/hooks/useCommonMeasurements";
import { useCommonOrigins } from "@/modules/shared/hooks/useCommonOrigins";
import { useCommonVehicleBrands } from "@/modules/shared/hooks/useCommonVehicleBrands";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useUpdateProduct } from "../hooks/mutations/useUpdateProduct";
import { useProductById } from "../hooks/queries/useProductById";
import { useGoBack } from "@/hooks/useGoBack";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import type { ProductUpdate } from "../types/ProductUpdate.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductUpdateSchema } from "../schemas/productUpdate.schema";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useHotkeys } from "react-hotkeys-hook";
import ErrorDataComponent from "@/components/common/errorDataComponent";
import { useCommonSubcategories } from "@/modules/shared/hooks/useCommonSubcategories";
import { CornerUpLeft, Loader2, Package, Save, Wand2 } from "lucide-react";
import { Label } from "@/components/atoms/label";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { useAutoDescription } from "../hooks/useAutoDescription";
import TooltipButton from "@/components/common/TooltipButton";
import { Kbd } from "@/components/atoms/kbd";
import ShortcutKey from "@/components/common/ShortcutKey";
import ProductEditSkeleton from "../components/ProductEditSkeleton";

const ProductEditScreen = () => {
  const navigate = useNavigate();
  const { updateProductId } = useParams();
  const isFirstLoad = useRef(true);

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategoriesWithSubcategories();

  const { data: brandsData, isLoading: isLoadingBrands } = useCommonBrands();

  const { data: vehicleBrandsData, isLoading: isLoadingVehicleBrandsData } =
    useCommonVehicleBrands();

  const { data: originsData, isLoading: isLoadingOrigins } = useCommonOrigins();

  const { data: measurementsData, isLoading: isLoadingMeasurements } =
    useCommonMeasurements();

  const { mutate: handleUpdateProduct, isPending: isSaving } =
    useUpdateProduct();

  const {
    data: productData,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
  } = useProductById(Number(updateProductId));

  const handleGoBack = useGoBack("/dashboard/productos");
  const { handleError } = useErrorHandler();

  const formMethods = useForm<ProductUpdate>({
    resolver: zodResolver(ProductUpdateSchema),
    defaultValues: {
      descripcion: "",
      id_categoria: 0,
      id_subcategoria: null,
      descripcion_alt: "",
      codigo_oem: "",
      codigo_upc: "",
      modelo: "",
      medida: "",
      nro_motor: "",
      costo_referencia: 0,
      stock_minimo: 0,
      precio_venta: 0,
      precio_venta_alt: 0,
      id_marca: 0,
      id_procedencia: 0,
      id_marca_vehiculo: 0,
      id_unidad: 0,
    },
  });

  const {
    register,
    watch,
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = formMethods;

  useEffect(() => {
    if (productData) {
      const resetData: ProductUpdate = {
        codigo_oem: productData?.codigo_oem,
        codigo_upc: productData?.codigo_upc || "",
        costo_referencia: Number(productData?.costo_referencia || 0),
        descripcion: productData?.descripcion,
        descripcion_alt: productData.descripcion_alt || "",
        id_categoria: productData.id_categoria,
        id_marca: productData.id_marca,
        id_marca_vehiculo: productData.id_marca_vehiculo,
        id_procedencia: productData.id_procedencia,
        id_subcategoria: productData.id_subcategora || null,
        id_unidad: productData.id_unidad_medida,
        medida: productData.medida,
        modelo: productData.modelo,
        nro_motor: productData.nro_motor,
        precio_venta: Number(productData.precio_venta),
        precio_venta_alt: Number(productData.precio_venta_alt),
        stock_minimo: Number(productData.stock_minimo || 0),
      };
      reset(resetData);
      isFirstLoad.current = false;
    }
  }, [productData, reset, isFirstLoad]);

  const watchedValues = watch();
  const {
    id_categoria,
    id_marca_vehiculo,
    nro_motor,
    medida,
    modelo,
    descripcion_alt,
    id_subcategoria,
  } = watchedValues;

  const {
    // data: subcategoriesData,
    isLoading: isLoadingSubcategories,
  } = useCommonSubcategories({
    categoria: id_categoria,
    enabled: !!id_categoria,
  });

  const selectedCategory = categoriesData?.find(
    (cat) => cat.id === id_categoria
  );
  const selectedVehicleBrand = vehicleBrandsData?.find(
    (brand) => brand.id === id_marca_vehiculo
  );

  // Generate auto description
  const autoDescription = useAutoDescription({
    categoryName: selectedCategory?.categoria || "",
    vehicleBrandName: selectedVehicleBrand?.marca_vehiculo,
    motorNumber: nro_motor,
    measurement: medida,
    model: modelo,
    altDescription: descripcion_alt,
  });

  useEffect(() => {
    setValue("descripcion", autoDescription);
  }, [autoDescription, setValue]);

  const prevCategoriaRef = useRef(id_categoria);
  useEffect(() => {
    if (
      isFirstLoad.current ||
      (id_categoria === productData?.id_categoria &&
        id_subcategoria === productData.id_subcategora)
    )
      return;

    if (prevCategoriaRef.current !== id_categoria && id_categoria !== 0) {
      setValue("id_subcategoria", null);
    }

    prevCategoriaRef.current = id_categoria;
  }, [id_categoria, id_subcategoria, setValue, isFirstLoad, productData]);

  const onSubmit = (data: ProductUpdate) => {
    handleUpdateProduct(
      { id: Number(updateProductId), data },
      {
        onSuccess: () => {
          showSuccessToast({
            title: "Producto Modificado",
            description: `Producto modificado con exitosamente.`,
            duration: 5000,
          });
          setTimeout(handleGoBack, 200);
        },
        onError: (error: unknown) => {
          handleError({
            error,
            customTitle: "No se pudo modificar el producto",
          });
        },
      }
    );
  };

  const onError = (errors: FieldErrors<ProductUpdate>) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof ProductUpdate;
    const firstError = errors[firstErrorKey];

    if (firstError?.message) {
      showErrorToast({
        title: "Error en formulario",
        description: firstError.message,
        duration: 5000,
      });
    }
  };

  const getInputClassName = (fieldName: keyof ProductUpdate): string => {
    const baseClass = "";
    return errors[fieldName]
      ? `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`
      : baseClass;
  };

  const getSelectClassName = (fieldName: keyof ProductUpdate): string => {
    const baseClass = "";
    return errors[fieldName]
      ? `${baseClass} border-red-500 focus:border-red-500`
      : baseClass;
  };

  // Shortcuts
  useHotkeys(
    "escape",
    (e) => {
      e.preventDefault();
      handleGoBack();
    },
    {
      scopes: ["esc-key"],
      enabled: true,
    }
  );

  useHotkeys("alt+s", (e) => {
    e.preventDefault();
    handleSubmit(onSubmit, onError)();
  });

  const isLoading = [
    isLoadingProduct,
    isLoadingCategories,
    isLoadingBrands,
    isLoadingVehicleBrandsData,
    isLoadingSubcategories,
    isLoadingOrigins,
    isLoadingMeasurements,
  ].some(Boolean);

  if (isLoading) return <ProductEditSkeleton />;

  if (isErrorProduct || !productData) {
    return (
      <div className="h-full flex items-center justify-center p-2 lg:p-8">
        <ErrorDataComponent
          className="h-full w-full"
          errorMessage="No se pudo cargar el producto."
          showButtonIcon={false}
          buttonText="Ir a lista de productos"
          onRetry={() => {
            navigate("/dashboard/productos");
          }}
        />
      </div>
    );
  }

  return (
    <main>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-2">
        <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <TooltipButton
                tooltipContentProps={{
                  align: "start",
                }}
                onClick={handleGoBack}
                tooltip={
                  <p className="flex items-center gap-1">
                    Presiona <Kbd>esc</Kbd> para volver atrás
                  </p>
                }
                buttonProps={{
                  variant: "default",
                  type: "button",
                }}
              >
                <CornerUpLeft />
              </TooltipButton>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                  Editar producto #{productData?.codigo_interno}
                </h1>
                <p className="text-sm text-gray-600"></p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end w-full sm:w-auto gap-2">
              <Button type="button" onClick={handleGoBack} variant={"outline"}>
                Cancelar
              </Button>

              <TooltipButton
                tooltip={
                  <span className="flex items-center gap-1">
                    Guardar Cambios <ShortcutKey combo="alt+s" />
                  </span>
                }
                buttonProps={{
                  variant: "default",
                  size: "sm",
                  type: "submit",
                  disabled: isSaving || isSubmitting,
                }}
              >
                {!isSaving || isSubmitting ? (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                )}
              </TooltipButton>
            </div>
          </div>
        </header>
        {/* Información Principal */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <h2 className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-900">
            <Package className="w-4 h-4" />
            Información Principal
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* 1. División */}
            <div>
              <Label>División *</Label>
              <Controller
                name="id_categoria"
                control={control}
                render={({ field }) => (
                  <ComboboxSelect
                    value={id_categoria}
                    onChange={(value) => field.onChange(Number(value))}
                    options={(categoriesData || []).map((category) => ({
                      id: category.id,
                      categoria: category.categoria,
                    }))}
                    optionTag="categoria"
                    placeholder="Seleccionar División"
                    searchPlaceholder="Buscar División..."
                    className={getSelectClassName("id_categoria")}
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

            {/* 2. Marca */}
            <div>
              <Label>Marca *</Label>
              <Controller
                name="id_marca"
                control={control}
                render={({ field }) => (
                  <ComboboxSelect
                    value={field.value}
                    onChange={(value) => field.onChange(Number(value))}
                    options={brandsData || []}
                    optionTag="marca"
                    placeholder="Seleccionar marca"
                    searchPlaceholder="Buscar marcas..."
                    className={getSelectClassName("id_marca")}
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

            {/* 3. Código OEM */}
            <div>
              <Label>Código OEM (Opcional)</Label>
              <Input {...register("codigo_oem")} placeholder="Código OEM" />
              <div className="mt-1">
                {errors.codigo_oem && (
                  <p className="text-xs text-red-500 truncate">
                    {errors.codigo_oem.message}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Código UPC */}
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

            {/* 5. Procedencia */}
            <div>
              <Label>Procedencia *</Label>
              <Controller
                name="id_procedencia"
                control={control}
                render={({ field }) => (
                  <ComboboxSelect
                    value={field.value}
                    onChange={(value) => field.onChange(Number(value))}
                    options={originsData || []}
                    optionTag="procedencia"
                    placeholder="Seleccionar procedencia"
                    searchPlaceholder="Buscar procedencia..."
                    className={getSelectClassName("id_procedencia")}
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

            {/* 6. Unidad */}
            <div>
              <Label>Unidad *</Label>
              <Controller
                name="id_unidad"
                control={control}
                render={({ field }) => (
                  <ComboboxSelect
                    value={field.value}
                    onChange={(value) => field.onChange(Number(value))}
                    options={measurementsData || []}
                    optionTag="unidad_medida"
                    placeholder="Seleccionar unidad"
                    searchPlaceholder="Buscar unidad..."
                    className={getSelectClassName("id_unidad")}
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

            {/* 7. Stock mínimo */}
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
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    className={getInputClassName("stock_minimo")}
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

            {/* 8. Costo Referencia */}
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
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className={getInputClassName("costo_referencia")}
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

            {/* 9. Precio de venta */}
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
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className={getInputClassName("precio_venta")}
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

            {/* 10. P. Venta. Alt */}
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
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className={getInputClassName("precio_venta_alt")}
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

            {/* 11. Marca vehículo */}
            <div>
              <Label>Marca vehículo *</Label>
              <Controller
                name="id_marca_vehiculo"
                control={control}
                render={({ field }) => (
                  <ComboboxSelect
                    value={field.value}
                    onChange={(value) => field.onChange(Number(value))}
                    options={vehicleBrandsData || []}
                    optionTag="marca_vehiculo"
                    placeholder="Seleccionar marca vehículo"
                    searchPlaceholder="Buscar marcas..."
                    className={getSelectClassName("id_marca_vehiculo")}
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

            {/* 12. Medida */}
            <div>
              <Label>Medida (Opcional)</Label>
              <Input
                {...register("medida")}
                placeholder="Medida"
                className={getInputClassName("medida")}
              />
              <div className="mt-1">
                {errors.medida && (
                  <p className="text-xs text-red-500 truncate">
                    {errors.medida.message}
                  </p>
                )}
              </div>
            </div>

            {/* 13. Nro. Motor */}
            <div>
              <Label>Nro. Motor (Opcional)</Label>
              <Input
                {...register("nro_motor")}
                placeholder="Nro. Motor"
                className={getInputClassName("nro_motor")}
              />
              <div className="mt-1">
                {errors.nro_motor && (
                  <p className="text-xs text-red-500 truncate">
                    {errors.nro_motor.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Campos adicionales para la generación de descripción */}
        <div className="p-3 bg-white border border-gray-200 rounded-lg">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {/* 14. Descripción alt. */}
            <div className="flex flex-col sm:col-span-2">
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

            {/* 15. Modelo */}
            <div>
              <Label>Modelo (Opcional)</Label>
              <Input {...register("modelo")} placeholder="Ej: 2020-2024" />
              <div className="mt-1">
                {errors.modelo && (
                  <p className="text-xs text-red-500 truncate">
                    {errors.modelo.message}
                  </p>
                )}
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
            {autoDescription ||
              "Completa los campos para generar la descripción"}
          </div>
        </div>

        {/* Información Adicional */}
        {/* <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Información Adicional
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        
                    </div>
                </div> */}
      </form>
    </main>
  );
};

export default ProductEditScreen;
