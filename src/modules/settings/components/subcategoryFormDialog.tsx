import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/atoms/button";
import { Loader2, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";
import { Label } from "@/components/atoms/label";
import { Input } from "@/components/atoms/input";
import type {
  CreateSubcategory,
  UpdateSubcategory,
} from "../types/subcategory.types";
import { useGetSubcategoryById } from "../hooks/subcategory/useGetSubcategoryById";
import { useCreateSubcategory } from "../hooks/subcategory/useCreateSubcategory";
import { useUpdateSubcategory } from "../hooks/subcategory/useUpdateSubcategory";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateSubcategorySchema,
  UpdateSubcategorySchema,
} from "../schemas/subcategory.schema";
import { useCallback, useEffect, useMemo } from "react";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { ComboboxSelect } from "@/components/common/SelectCombobox";
import type { CategoryWithSubcategories } from "@/modules/shared/types/category.types";

interface SubcategoryFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  isEditing?: boolean;
  editingId?: number | null;
  categories: CategoryWithSubcategories[];
  isLoadingCategories: boolean;
  isSearching: boolean;
  onSearchCategories: (query: string) => void;
}

const SubcategoryFormDialog: React.FC<SubcategoryFormDialogProps> = ({
  isOpen,
  onOpenChange,
  triggerButton,
  isEditing = false,
  editingId,
  categories,
  isLoadingCategories,
  isSearching,
  onSearchCategories,
}) => {
  const {
    data: subcategoryById,
    isLoading: isLoadingSubcategoryById,
    isError: isErrorSubcategoryById,
    error: errorSubcategoryById,
  } = useGetSubcategoryById(editingId || 0);

  const { mutate: handleCreateSubcategory, isPending: isCreating } =
    useCreateSubcategory();

  const { mutate: handleUpdateSubcategory, isPending: isUpdating } =
    useUpdateSubcategory();

  const { handleError } = useErrorHandler();

  // Forms
  const createForm = useForm<CreateSubcategory>({
    resolver: zodResolver(CreateSubcategorySchema),
    defaultValues: {
      subcategoria: "",
      id_categoria: 0,
    },
  });

  const updateForm = useForm<UpdateSubcategory>({
    resolver: zodResolver(UpdateSubcategorySchema),
    defaultValues: {
      subcategoria: "",
      id_categoria: 0,
    },
  });

  const currentForm = useMemo(
    () => (isEditing ? updateForm : createForm),
    [isEditing, updateForm, createForm]
  );
  const isSaving = useMemo(
    () => isCreating || isUpdating,
    [isCreating, isUpdating]
  );

  useEffect(() => {
    if (!isEditing) {
      createForm.reset();
    }
    if (subcategoryById && isEditing) {
      updateForm.reset({
        subcategoria: subcategoryById.subcategoria,
        id_categoria: subcategoryById.categoria?.id || 0,
      });
    }
  }, [subcategoryById, isEditing, updateForm, createForm]);

  const handleCreateSubmit = useCallback(
    createForm.handleSubmit(async (data: CreateSubcategory) => {
      handleCreateSubcategory(data, {
        onSuccess: () => {
          showSuccessToast({
            title: "Subcategoria Agregada",
            description: "Subcategoria agregada exitosamente",
            duration: 5000,
          });
          handleDialogToggle(false);
        },
        onError: (error: unknown) => {
          handleError({
            error,
            customTitle: "No se pudo agregar la subcategoria",
          });
        },
      });
    }),
    [createForm, handleCreateSubcategory, handleError]
  );

  const handleUpdateSubmit = useCallback(
    updateForm.handleSubmit(async (data: UpdateSubcategory) => {
      if (!editingId) {
        showErrorToast({
          title: "Error al modificar subcategoria",
          description:
            "No se pudo modificar la subcategoria. Por favor, intenta nuevamente",
          duration: 5000,
        });
        return;
      }

      handleUpdateSubcategory(
        { data, id: editingId },
        {
          onSuccess: () => {
            showSuccessToast({
              title: "Subcategoria Modificada",
              description: "Subcategoria modificada exitosamente",
              duration: 5000,
            });
            handleDialogToggle(false);
          },
          onError: (error: unknown) => {
            handleError({
              error,
              customTitle: "No se pudo modificar la subcategoria",
            });
          },
        }
      );
    }),
    [updateForm, editingId, handleUpdateSubcategory, handleError]
  );

  const onSubmit = useMemo(
    () => (isEditing ? handleUpdateSubmit : handleCreateSubmit),
    [isEditing, handleUpdateSubmit, handleCreateSubmit]
  );
  const {
    formState: { errors },
    register,
  } = currentForm;

  const handleDialogToggle = useCallback(
    (open: boolean) => {
      onOpenChange(open);
      onSearchCategories("");
      if (!open) {
        createForm.reset();
        updateForm.reset();
      }
    },
    [onOpenChange, createForm, updateForm]
  );

  useEffect(() => {
    if (!isErrorSubcategoryById) return;
    handleError({
      error: errorSubcategoryById,
      customTitle: "Ocurrió un error al cargar los datos",
    });
    handleDialogToggle(false);
  }, [
    isErrorSubcategoryById,
    errorSubcategoryById,
    handleError,
    handleDialogToggle,
  ]);

  const defaultTrigger = (
    <Button className="w-full sm:w-auto">
      <Plus className="size-4" />
      Agregar Subcategoría
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
      <DialogTrigger asChild>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Agregar"} Subcategoría
            {isEditing && editingId && (
              <span className="text-muted-foreground ml-2">#{editingId}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de la" : "Agrega una nueva"}{" "}
            subcategoría
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subcategoria">Nombre de la Subcategoría *</Label>
            {isEditing && isLoadingSubcategoryById ? (
              <div className="flex items-center justify-start px-2 h-8 gap-3 rounded-md animate-pulse bg-accent">
                <p className="text-sm text-muted-foreground">
                  Cargando datos...
                </p>
              </div>
            ) : (
              <>
                <Input
                  id="subcategoria"
                  {...register("subcategoria")}
                  placeholder="Ingresa el nombre de la subcategoría"
                  disabled={isLoadingSubcategoryById || isSaving}
                  autoFocus={true}
                />
                {errors.subcategoria && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {errors.subcategoria.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <Label htmlFor="id_categoria">Categoría *</Label>
            {isEditing && isLoadingSubcategoryById ? (
              <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                <p className="text-sm text-muted-foreground">
                  Cargando datos...
                </p>
              </div>
            ) : (
              <>
                <Controller
                  name="id_categoria"
                  control={currentForm.control}
                  render={({ field }) => (
                    <ComboboxSelect
                      value={field.value}
                      onChange={(value) => field.onChange(Number(value))}
                      options={(categories || []).map((category) => ({
                        id: category.id,
                        categoria: category.categoria,
                      }))}
                      optionTag="categoria"
                      placeholder="Seleccionar categoría"
                      searchPlaceholder="Buscar categorías..."
                      isLoadingData={isLoadingCategories}
                      enableExternalSearch={true}
                      onSearch={onSearchCategories}
                      isSearching={isSearching}
                    />
                  )}
                />
                {errors.id_categoria && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {typeof errors.id_categoria?.message === "string"
                      ? errors.id_categoria.message
                      : ""}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogToggle(false)}
              disabled={isLoadingSubcategoryById || isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoadingSubcategoryById || isSaving || isLoadingCategories
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {isEditing ? "Actualizar" : "Crear"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default SubcategoryFormDialog;
