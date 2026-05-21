import { Alert, AlertDescription } from "@/components/atoms/alert";
import { CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import TooltipButton from "@/components/common/TooltipButton";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { PERMISSIONS } from "@/lib/permissions";
import { useGetAllBranches } from "@/modules/settings/hooks/branch/useGetAllBranches";
import { useGetAllCategories } from "@/modules/settings/hooks/category/useGetAllCategories";
import {
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { useState } from "react";
import FormUpdatePrices from "../components/FormUpdatePrices";
import { useUpdatePrices } from "../hooks/useUpdatePrices";
import {
  UpdatePricesSchema,
  type UpdatePricesFormData,
} from "../schemas/updatePrices.schema";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import ShortcutKey from "@/components/common/ShortcutKey";

const UpdatePrices = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdatePricesFormData>({
    aplicar_todas: true,
    aplicar_todo_sistema: false,
    tipo_ajuste: "incremento",
    porcentaje: 0,
    fecha: null,
    categoria: null,
    sucursal: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Obtener datos para los selectores
  const { data: categoriesData = [], isLoading: loadingCategories } =
    useGetAllCategories({
      pagina: 1,
      pagina_registros: 1000,
    });

  const { data: branchesData = [], isLoading: loadingBranches } =
    useGetAllBranches({
      pagina: 1,
      pagina_registros: 1000,
    });

  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.data || [];
  const branches = Array.isArray(branchesData)
    ? branchesData
    : branchesData?.data || [];

  const updatePricesMutation = useUpdatePrices();

  const handleChange = (field: keyof UpdatePricesFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al cambiar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const result = UpdatePricesSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      setShowConfirmDialog(true);
    }
  };

  const handleReset = () => {
    setFormData({
      aplicar_todas: true,
      aplicar_todo_sistema: false,
      tipo_ajuste: "incremento",
      porcentaje: 0,
      fecha: "",
      categoria: null,
      sucursal: null,
    });
    setErrors({});
    // setLastSuccess(null);
  };

  const handleConfirmUpdate = () => {
    // El servicio se encarga de transformar los datos al formato del API
    updatePricesMutation.mutate(formData, {
      onSuccess: (response) => {
        setShowConfirmDialog(false);
        setLastSuccess(response.message || "Precios actualizados exitosamente");
        handleReset();
        setTimeout(() => setLastSuccess(null), 5000);
      },
      onError: () => {
        setShowConfirmDialog(false);
      },
    });
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((cat: any) => cat.id === id);
    return category?.categoria || `Categoría ${id}`;
  };

  const getBranchName = (id: number) => {
    const branch = branches.find((br: any) => br.id === id);
    return branch?.nombre || `Sucursal ${id}`;
  };

  return (
    <main className="h-full p-4 overflow-auto">
      <ProtectedAction
        permission={PERMISSIONS.COM.UPDATE_PRICES}
        roles={["Super Admin", "Administrador", "Vendedor"]}
        showUnauthorizedMessage={true}
      >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Success Alert */}
        {lastSuccess && (
          <Alert className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              {lastSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {updatePricesMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {updatePricesMutation.error?.message ||
                "Error al actualizar precios"}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <h1 className="flex gap-2 items-center">
                <RefreshCw className="h-5 w-5" />
                Actualizar Precios
              </h1>
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
                      <div className="space-y-1 text-muted-foreground text-xs">
                        <p>
                          <ShortcutKey combo={"Alt + S"} /> Actualizar precios
                        </p>
                        <p>
                          <ShortcutKey combo={"Ctrl + R"} /> Limpiar formulario
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
            </CardTitle>
            <CardDescription>
              Actualiza los precios de productos por división o de todo el sistema con un porcentaje
              de incremento o decremento
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormUpdatePrices
              formData={formData}
              errors={errors}
              isLoading={updatePricesMutation.isPending}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onReset={handleReset}
              categories={categories}
              branches={branches}
              loadingCategories={loadingCategories}
              loadingBranches={loadingBranches}
            />

            <div className="flex justify-end gap-3 pt-6">
              <TooltipButton
                buttonProps={{
                  onClick: handleReset,
                  disabled: updatePricesMutation.isPending,
                }}
                tooltip="Limpiar formulario"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpiar
              </TooltipButton>

              <Button
                onClick={handleSubmit}
                disabled={updatePricesMutation.isPending}
                variant="default"
              >
                {updatePricesMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Actualizar Precios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                Confirmar Actualización de Precios
              </AlertDialogTitle>
              <AlertDialogDescription asChild className="space-y-3 pt-2">
                <div className="text-sm text-muted-foreground">
                  <p>
                    Estás a punto de actualizar los precios con los siguientes
                    parámetros:
                  </p>

                  <div className="space-y-2 bg-muted p-3 rounded-md text-sm text-foreground">
                    {formData.aplicar_todo_sistema && (
                      <div className="flex justify-between items-center p-2 bg-muted border border-border rounded-md">
                        <span className="font-semibold">
                          Alcance:
                        </span>
                        <Badge variant="outline">
                          Todo el sistema (todas las divisiones)
                        </Badge>
                      </div>
                    )}

                    {!formData.aplicar_todo_sistema && (
                      <div className="flex justify-between">
                        <span className="font-medium">División:</span>
                        <Badge variant="secondary">
                          {formData.categoria
                            ? getCategoryName(formData.categoria)
                            : "N/A"}
                        </Badge>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="font-medium">Aplicar a:</span>
                      <Badge variant="secondary">
                        {formData.aplicar_todas
                          ? "Todas las sucursales"
                          : formData.sucursal
                            ? getBranchName(formData.sucursal)
                            : "N/A"}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Tipo de Ajuste:</span>
                      <Badge
                        variant={
                          formData.tipo_ajuste === "incremento"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {formData.tipo_ajuste === "incremento"
                          ? "Incrementar"
                          : "Decrementar"}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Porcentaje:</span>
                      <Badge variant="outline" className="font-mono">
                        {formData.tipo_ajuste === "incremento" ? "+" : "-"}
                        {formData.porcentaje}%
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Fecha:</span>
                      <span className="text-muted-foreground">
                        {formData.fecha || "No especificada"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm">
                    {formData.aplicar_todo_sistema
                      ? "Esta acción modificará los precios de todos los productos del sistema. ¿Deseas continuar?"
                      : "Esta acción modificará los precios de los productos seleccionados. ¿Deseas continuar?"}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatePricesMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmUpdate}
                disabled={updatePricesMutation.isPending}
                className="bg-primary"
              >
                {updatePricesMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar Actualización
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </ProtectedAction>
    </main>
  );
};

export default UpdatePrices;
