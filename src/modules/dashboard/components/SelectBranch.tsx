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
  const { selectedBranchId, setSelectedBranch } = useBranchStore();
  useEffect(() => {
    const fetchBranches = async () => {
      const { user } = await authSDK.getState();
      const userBranches: Branch[] = user?.sucursales || [];
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
    setSelectedBranch(value);
  };

  return (
    <Select
      value={selectedBranchId || ''}
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
  );
};

export default SelectBranch;
