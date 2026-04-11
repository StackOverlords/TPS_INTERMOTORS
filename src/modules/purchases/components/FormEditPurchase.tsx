import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import ShortcutKey from "@/components/common/ShortcutKey";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { HelpCircle, ShoppingBag } from "lucide-react";
import React, { useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { useProviders } from "../hooks/useProviders";
import { usePurchaseCommons } from "../hooks/usePurchaseCommons";
import type { PurchaseUpdate, ProveedorCreditInfo } from "../schemas/purchaseUpdate.schema";
import type { PurchaseDetail } from "../schemas/purchase.schema";
import { formatCurrency } from "@/utils/formaters";

interface Props {
  purchaseData?: PurchaseDetail;
  proveedorCreditInfo?: ProveedorCreditInfo;
  onSubmit?: () => void;
}

const FormEditPurchase: React.FC<Props> = ({ purchaseData, proveedorCreditInfo, onSubmit }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<PurchaseUpdate>();

  const { data: proveedores = [], isLoading: isLoadingProviders } =
    useProviders();
  const { purchaseTypes, purchaseModalities, responsibles, loading } =
    usePurchaseCommons();

  const containerRef = useRef<HTMLDivElement>(null);

  // Navegación con Enter entre campos
  useFormEnterNavigation({
    submitOnLastField: false,
    onSubmit: onSubmit,
    containerRef: containerRef,
    excludeSelectors: [
      ".editable-cell-input",
      '[data-table-cell="true"]',
      '[name="btn-chvron-right"]',
    ],
    enabled: true,
  });

  const inputClass = (fieldName: keyof PurchaseUpdate) =>
    errors[fieldName]
      ? "text-sm border-red-500 focus:border-red-500"
      : "text-sm";

  return (
    <div className="p-3 bg-background border border-border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShoppingBag className="w-4 h-4" />
          Información de Compra
        </h2>
        <TooltipWrapper
          tooltipContentProps={{
            align: "end",
            className: "max-w-xs",
          }}
          tooltip={
            <div className="flex flex-col space-y-3">
              <div className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Atajos de teclado
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-muted-foreground tracking-wide">
                  Navegación
                </h4>
                <div className="space-y-1 text-muted-foreground text-xs">
                  <p>
                    <ShortcutKey combo={"Tab"} /> Siguiente campo
                  </p>
                  <p>
                    <ShortcutKey combo={"Shift + Tab"} /> Campo anterior
                  </p>
                  <p>
                    <ShortcutKey combo={"Enter"} /> Navegación automática
                  </p>
                  <p>
                    <ShortcutKey combo={"Alt + S"} /> Guardar cambios
                  </p>
                  <p>
                    <ShortcutKey combo={"Esc"} /> Volver atrás
                  </p>
                </div>
              </div>
            </div>
          }
        >
          <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
            <HelpCircle className="w-4 h-4" />
          </span>
        </TooltipWrapper>
      </div>

      <div
        ref={containerRef}
        className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 items-end mb-4"
      >
        {/* Fecha */}
        <div className="flex flex-col relative h-full">
          <Label className="mb-1">Fecha *</Label>
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                {...field}
                value={field.value || purchaseData?.fecha?.slice(0, 10) || ""}
                className={inputClass("fecha")}
                autoFocus
              />
            )}
          />
          {errors.fecha && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.fecha.message}
            </p>
          )}
        </div>

        {/* Proveedor */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Proveedor *</Label>
          <Controller
            name="id_proveedor"
            control={control}
            render={({ field }) => (
              <ComboboxSelect
                value={field.value || purchaseData?.proveedor?.id || undefined}
                onChange={(v) => field.onChange(Number(v))}
                options={proveedores}
                optionTag="nombre"
                placeholder={
                  isLoadingProviders ? "Cargando proveedores..." : "Proveedor"
                }
                className={inputClass("id_proveedor")}
                disabled={isLoadingProviders}
                clearOnEmpty={true}
                data-field="id_proveedor"
                name="id_proveedor"
              />
            )}
          />
          {errors.id_proveedor && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.id_proveedor.message}
            </p>
          )}
        </div>

        {/* Nro Comprobante */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Nro comprobante *</Label>
          <Controller
            name="nro_comprobante"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                {...field}
                value={field.value || purchaseData?.comprobante || ""}
                placeholder="FA-01"
                className={inputClass("nro_comprobante")}
                data-field="nro_comprobante"
              />
            )}
          />
          {errors.nro_comprobante && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.nro_comprobante.message}
            </p>
          )}
        </div>

        {/* Nro Comprobante 2 */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">
            Nro. Comprobante 2 (Opcional)
          </Label>
          <Controller
            name="nro_comprobante2"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                {...field}
                value={field.value || purchaseData?.comprobante2 || ""}
                className={inputClass("nro_comprobante2")}
                data-field="nro_comprobante2"
                placeholder="COMP-123"
              />
            )}
          />
          {errors.nro_comprobante2 && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.nro_comprobante2.message}
            </p>
          )}
        </div>

        {/* Tipo */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Tipo *</Label>
          <Controller
            name="tipo_compra"
            control={control}
            render={({ field }) => (
              <ComboboxSelect
                value={field.value || purchaseData?.tipo_compra || undefined}
                onChange={(v) => field.onChange(v)}
                options={purchaseTypes.map((pt) => ({
                  id: pt.value,
                  label: pt.label,
                }))}
                optionTag="label"
                placeholder={loading.types ? "Cargando..." : "Tipo"}
                className={inputClass("tipo_compra")}
                disabled={loading.types}
                clearOnEmpty={true}
                name="tipo_compra"
              />
            )}
          />
          {errors.tipo_compra && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.tipo_compra.message}
            </p>
          )}
        </div>

        {/* Forma */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Forma *</Label>
          <Controller
            name="forma_compra"
            control={control}
            render={({ field }) => (
              <ComboboxSelect
                value={field.value || purchaseData?.forma_compra || undefined}
                onChange={(v) => field.onChange(v)}
                options={purchaseModalities.map((pm) => ({
                  id: pm.value,
                  label: pm.label,
                }))}
                optionTag="label"
                placeholder={loading.modalities ? "Cargando..." : "Forma"}
                className={inputClass("forma_compra")}
                disabled={loading.modalities}
                clearOnEmpty={true}
                name="forma_compra"
              />
            )}
          />
          {errors.forma_compra && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.forma_compra.message}
            </p>
          )}
        </div>

        {/* Responsable */}
        <div className="flex flex-col relative">
          <Label className="text-xs font-medium mb-1">Responsable *</Label>
          <Controller
            name="id_responsable"
            control={control}
            render={({ field }) => (
              <ComboboxSelect
                value={
                  field.value || purchaseData?.responsable?.id || undefined
                }
                onChange={(v) => field.onChange(Number(v))}
                options={responsibles.map((r) => ({
                  id: r.value,
                  label: r.label,
                }))}
                optionTag="label"
                placeholder={
                  loading.responsibles ? "Cargando..." : "Responsable"
                }
                className={inputClass("id_responsable")}
                disabled={loading.responsibles}
                clearOnEmpty={true}
                name="id_responsable"
              />
            )}
          />
          {errors.id_responsable && (
            <p className="text-xs text-destructive absolute -bottom-5 left-0">
              {errors.id_responsable.message}
            </p>
          )}
        </div>
      </div>

      {/* Comentarios */}
      <div className="rounded-lg">
        <div className="flex flex-col">
          <Label className="text-xs font-medium mb-1">
            Comentarios (Opcional)
          </Label>
          <Controller
            name="comentario"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                value={field.value || purchaseData?.comentarios || ""}
                placeholder="Comentarios adicionales"
                rows={1}
                className="p-2 text-xs border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-vertical bg-card text-foreground"
              />
            )}
          />
        </div>
      </div>

      {/* Crédito Proveedor — solo informativo, no se envía al backend */}
      {proveedorCreditInfo && (
        <div className="rounded-lg border border-border bg-card/50 p-3 mt-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Crédito Proveedor
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Días de Plazo</span>
              <span className="font-medium">
                {proveedorCreditInfo.dias_plazo != null
                  ? `${proveedorCreditInfo.dias_plazo} días`
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Límite de Crédito</span>
              <span className="font-medium">
                {proveedorCreditInfo.limite_credito != null
                  ? formatCurrency(proveedorCreditInfo.limite_credito)
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Días de Alerta</span>
              <span className="font-medium">
                {proveedorCreditInfo.dias_alerta != null
                  ? `${proveedorCreditInfo.dias_alerta} días`
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditPurchase;
