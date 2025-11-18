import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/atoms/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { useEffect, useState } from 'react';

interface Branch {
  id: string | number;
  sucursal: string;
}

const SelectBranch = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState<string>('');
  const { selectedBranchId, setSelectedBranch } = useBranchStore();

  // Sincronizar el valor local con el store
  useEffect(() => {
    if (selectedBranchId) {
      setLocalValue(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { user } = await authSDK.getState();
      const userBranches: Branch[] = user?.sucursales || [];
      console.log(user?.sucursales)
      setBranches(userBranches);
      if (!selectedBranchId && userBranches.length > 0) {
        const initialBranchId = String(userBranches[0].id);
        setSelectedBranch(initialBranchId);
      }
    };
    fetchBranches();
  }, [selectedBranchId, setSelectedBranch]);

  // Efecto para escuchar el evento de toggle desde el keybinding
  useEffect(() => {
    const handleToggleBranchSelector = () => {
      setIsOpen(prev => !prev);
    };

    // Agregar listener para el evento personalizado
    document.addEventListener(
      'toggleBranchSelector',
      handleToggleBranchSelector
    );

    return () => {
      document.removeEventListener(
        'toggleBranchSelector',
        handleToggleBranchSelector
      );
    };
  }, []);

  const handleChange = (value: string) => {
    // Si es la misma sucursal, no hacer nada
    if (value === selectedBranchId) {
      return;
    }
    // Actualizar el valor local temporalmente para feedback visual
    setLocalValue(value);
    // Cerrar el selector primero
    setIsOpen(false);
    // Guardar el valor pendiente y mostrar confirmación después de un delay
    setPendingBranchId(value);

    // Delay para permitir que el Select se cierre antes de mostrar el diálogo
    setTimeout(() => {
      setShowConfirmDialog(true);
    }, 50); // En caso de seguir fallando le aumentaremoss unos 100 masss recordar
  };

  const handleConfirmChange = () => {
    if (pendingBranchId) {
      setSelectedBranch(pendingBranchId);
      setLocalValue(pendingBranchId);
      setPendingBranchId(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelChange = () => {
    // Restaurar el valor anterior
    if (selectedBranchId) {
      setLocalValue(selectedBranchId);
    }
    setPendingBranchId(null);
    setShowConfirmDialog(false);
  };

  // Obtener el nombre de la sucursal pendiente
  const getPendingBranchName = () => {
    const branch = branches.find(b => String(b.id) === pendingBranchId);
    return branch?.sucursal || `Sucursal ${pendingBranchId}`;
  };

  return (
    <>
      <Select
        value={localValue || selectedBranchId || ''}
        onValueChange={handleChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger data-branch-selector>
          <SelectValue
            className="text-gray-200"
            placeholder="Selecciona una sucursal"
          />
        </SelectTrigger>
        <SelectContent className="border border-gray-200">
          {branches.map((branch: Branch) => (
            <SelectItem
              className="hover:bg-gray-200"
              key={branch.id}
              value={String(branch.id)}
            >
              {branch.sucursal || `Sucursal ${branch.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar de sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cambiar a <span className="font-semibold">{getPendingBranchName()}</span>.
              {' '}Los datos que estés visualizando se actualizarán para esta sucursal.
              {' '}¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelChange}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Cambiar sucursal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SelectBranch;
