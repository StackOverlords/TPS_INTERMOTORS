import { useState, useRef, useEffect, useCallback } from "react";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { Button } from "@/components/atoms/button";
import { useQuery } from "@tanstack/react-query";
import { apiConstructor } from "../../services/api";

interface Subcategory {
  id: number;
  subcategoria: string;
  categoria: {
    id: number;
    categoria: string;
    codigo_interno: number;
  };
}

interface Category {
  id: number;
  categoria: string;
  subcategorias: Subcategory[];
}

const TableCreateCategory = () => {
  const [page, setPage] = useState(1);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  const {
    data: response,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["categories", page],
    queryFn: () =>
      apiConstructor({
        url: `/categories?pagina=${page}&pagina_registros=${pageSize}`,
        method: "GET",
      }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (response?.data) {
      setAllCategories((prev) => [...prev, ...response.data]);
    }
  }, [response]);

  const handleScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (
      container &&
      !isLoading &&
      !isFetching &&
      container.scrollHeight - container.scrollTop <= container.clientHeight + 100
    ) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, isFetching]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleDelete = (id: number) => {
    console.log("Eliminar ID:", id);
    // Aquí iría apiConstructor DELETE si deseas eliminar.
  };

  return (
    <div
      ref={tableContainerRef}
      className="overflow-y-auto border border-gray-200 rounded-md max-h-[500px]"
    >
      <Table className="min-w-full">
        <TableHeader className="sticky top-0 z-10 bg-white">
          <TableRow className="text-sm text-gray-600">
            <TableHead>Categoría</TableHead>
            <TableHead>Subcategorías</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {allCategories.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{cat.categoria}</TableCell>
              <TableCell>
                <ul className="pl-4 text-sm text-gray-700 list-disc">
                  {cat.subcategorias.map((sub) => (
                    <li key={sub.id}>{sub.subcategoria}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="text-white bg-black"
                    onClick={() => console.log("Editar", cat.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(isLoading || isFetching) && (
            <TableRow>
              <TableCell colSpan={3} className="py-4 text-sm text-center text-gray-500">
                Cargando más datos...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableCreateCategory;
