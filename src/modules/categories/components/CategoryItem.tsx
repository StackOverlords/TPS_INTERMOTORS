import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/atoms/accordion";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Edit, Save, Trash2 } from "lucide-react";
import type { Category } from "../types/Categories";

interface Props {
  category: Category;
  editingId: number | null;
  editingName: string;
  onEdit: (cat: Category) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditName: (val: string) => void;
  onDelete: (id: number) => void;

  addingSubId: number | null;
  newSubName: string;
  onAddSub: (catId: number) => void;
  onChangeSubName: (val: string) => void;
  onSubmitSub: () => void;
  onCancelSub: () => void;

  isSavingEdit: boolean;
  isDeleting: boolean;
  isSavingSub: boolean;
}

const CategoryItem = ({
  category,
  editingId,
  editingName,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeEditName,
  onDelete,

  // addingSubId,
  // newSubName,
  // onAddSub,
  // onChangeSubName,
  // onSubmitSub,
  // onCancelSub,

  isSavingEdit,
  isDeleting,
  // isSavingSub,
}: Props) => {
  const isEditing = editingId === category.id;
  // const isAddingSub = addingSubId === category.id;

  return (
    <AccordionItem
      value={`cat-${category.id}`}
      className="border-b border-gray-100 last:border-b-0"
    >
      <AccordionTrigger className="flex flex-wrap items-center justify-between p-4 text-left hover:bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
          {isEditing ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0">
              <Input
                value={editingName}
                onChange={(e) => onChangeEditName(e.target.value)}
                className="flex-1 min-w-0 h-8"
                onKeyDown={(e) => e.key === "Enter" && onSaveEdit()}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveEdit();
                }}
                disabled={isSavingEdit}
                className="h-8 px-2 flex-shrink-0 w-full sm:w-auto"
              >
                <Save className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelEdit();
                }}
                className="h-8 px-2 flex-shrink-0 w-full sm:w-auto"
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm truncate">{category.categoria}</span>
              {(category.subcategorias?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {category.subcategorias?.length} subcategorías
                </Badge>
              )}
            </div>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        {(category.subcategorias?.length ?? 0) > 0 && (
          <div className="mb-2">
            <p className="mb-1 text-sm font-medium text-gray-700">Subcategorías:</p>
            <div className="flex flex-wrap gap-2">
              {(category.subcategorias ?? []).map((sub) => (
                <Badge
                  key={sub.id}
                  variant="outline"
                  className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  {sub.subcategoria}
                </Badge>
              ))}
            </div>
          </div>
        )}
 {/* {isAddingSub ? (
          <div className="flex gap-2 mb-4 mt-1">
            <Input
              value={newSubName}
              onChange={(e) => onChangeSubName(e.target.value)}
              placeholder="Nueva subcategoría"
              className="flex-1 h-8"
              onKeyDown={(e) => e.key === "Enter" && onSubmitSub()}
            />
            <Button
              size="sm"
              onClick={onSubmitSub}
              disabled={!newSubName.trim() || isSavingSub}
              className="h-8 px-3"
            >
              <Save className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelSub}
              className="h-8 px-3"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => onAddSub(category.id)}
            className="flex items-center gap-1 mb-4 text-sm text-gray-600 hover:text-gray-800"
          >
            <Plus className="w-4 h-4" />
            Agregar subcategoría
          </button>
        )} */}

        <div className="flex justify-end gap-2">
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(category)}
              className="h-8 px-3 text-gray-600 hover:text-gray-900"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(category.id)}
            disabled={isDeleting}
            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 rounded-full border-t-transparent animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </>
            )}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CategoryItem;
