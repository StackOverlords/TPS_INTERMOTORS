import { Accordion } from "@/components/atoms/accordion";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import categoriesService from "../services/categoriesService";
import type { PaginatedResponse } from "../types/Categories";
import CategoryItem from "./CategoryItem";
import CategoryItemSkeleton from "./CategorySqueleton";
import FormCreateCategory from "./FormCreateCategory";
import PaginationControls from "./PaginationControls";
import SearchCategories from "./SearchCategories";

interface Category {
  id: number;
  categoria: string;
  subcategorias: Array<{ id: number; subcategoria: string }>;
}

const TableCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Estados
  const [newCategory, setNewCategory] = useState("");
  const [addingSubId, setAddingSubId] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Reinicia a página 1 se cambian búsqueda o perPage
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, perPage]);

  // Query para categorías paginadas
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedResponse<Category>, Error>({
    queryKey: ["categories", { search: debouncedSearchTerm, page: currentPage, perPage }],
    queryFn: async () => {
      return await categoriesService.getCategories({
        page: currentPage,
        perPage,
        categoria: debouncedSearchTerm,
      });
    },
    placeholderData: (previousData) => previousData,
    staleTime: 0,
  });

  // Datos listos
  const allCategories = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const lastPage = useMemo(() => {
    return data?.meta?.last_page ?? 1;
  }, [data]);

  const totalCategories = useMemo(() => {
    return data?.meta?.total ?? allCategories.length;
  }, [data, allCategories]);

  // Mutaciones
  const createCategoryMutation = useMutation({
    mutationFn: categoriesService.createCategory,
    onSuccess: () => {
      setNewCategory("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoría creada", description: "Se creó exitosamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: categoriesService.createSubcategory,
    onSuccess: () => {
      setAddingSubId(null);
      setNewSubName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Subcategoría creada", description: "Se creó exitosamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al crear subcategoría", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, categoria }: { id: number; categoria: string }) =>
      categoriesService.updateCategory(id, categoria),
    onSuccess: () => {
      setEditingId(null);
      setEditingName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoría actualizada", description: "Actualizada correctamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Categoría eliminada", description: "Eliminada correctamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    },
  });

  // Acciones UI
  const handleCreateCategory = () => {
    if (!newCategory.trim()) return toast({ title: "Campo requerido", description: "Debes ingresar un nombre", variant: "destructive" });
    if (newCategory.length < 3) return toast({ title: "Nombre muy corto", description: "Mínimo 3 caracteres", variant: "destructive" });
    createCategoryMutation.mutate(newCategory);
  };

  const handleSubmitSubcategory = () => {
    if (!newSubName.trim() || addingSubId === null) return;
    if (newSubName.length < 3) return toast({ title: "Nombre muy corto", description: "Mínimo 3 caracteres", variant: "destructive" });
    createSubcategoryMutation.mutate({ subcategoria: newSubName, categoriaId: addingSubId });
  };

  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.categoria);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim() || editingId === null) return;
    if (editingName.length < 3) return toast({ title: "Nombre muy corto", description: "Mínimo 3 caracteres", variant: "destructive" });
    updateCategoryMutation.mutate({ id: editingId, categoria: editingName });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Gestión de Categorías</h1>

      <div className="bg-white border border-gray-200 rounded-tl-lg rounded-tr-lg">
        <FormCreateCategory
          value={newCategory}
          onChange={setNewCategory}
          onSubmit={handleCreateCategory}
          isLoading={createCategoryMutation.isPending}
        />
      </div>

      <SearchCategories
        value={searchTerm}
        onChange={setSearchTerm}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <div className="bg-white border border-gray-200 rounded-bl-lg rounded-br-lg">
        <Accordion type="single" collapsible className="w-full">
          {isFetching ? (
            <CategoryItemSkeleton rows={perPage} />
          ) : (
            allCategories.map((cat: Category) => (
              <CategoryItem
                key={cat.id}
                category={cat}
                editingId={editingId}
                editingName={editingName}
                onEdit={handleEditCategory}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onChangeEditName={setEditingName}
                onDelete={handleDelete}
                addingSubId={addingSubId}
                newSubName={newSubName}
                onAddSub={(id) => {
                  setAddingSubId(id);
                  setNewSubName("");
                }}
                onChangeSubName={setNewSubName}
                onSubmitSub={handleSubmitSubcategory}
                onCancelSub={() => setAddingSubId(null)}
                isSavingEdit={updateCategoryMutation.isPending}
                isDeleting={deleteCategoryMutation.isPending}
                isSavingSub={createSubcategoryMutation.isPending}
              />
            ))
          )}
        </Accordion>

        {isLoading && (
          <div className="p-6 text-center text-gray-500">Cargando categorías...</div>
        )}

        {!isLoading && allCategories.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {debouncedSearchTerm
              ? `No se encontraron resultados para "${debouncedSearchTerm}"`
              : "No hay categorías registradas"}
          </div>
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={lastPage}
        onPageChange={setCurrentPage}
        isLoading={isFetching}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      {allCategories.length > 0 && (
        <div className="text-sm text-center text-gray-500">
          Mostrando {allCategories.length} de {totalCategories} categorías{" "}
          (página {currentPage} de {lastPage})
        </div>
      )}
    </div>
  );
};

export default TableCreateCategory;