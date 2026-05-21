/**
 * PermissionsFilters — Branch + user filter bar for the permissions matrix screen.
 *
 * Renders two dropdowns side by side:
 *   1. Branch selector — limited to the current user's accessible branches (same
 *      pattern as SelectBranch.tsx, reads from authSDK.getState()).
 *   2. User filter — filters within the selected branch. Shows "Todos" as the first
 *      option (null selection = show all users).
 *
 * Design decision FE-D4: the PermissionsScreen owns the selectedBranchId state;
 * this component is fully controlled via props so the screen can initialise the
 * branch from useBranchStore and keep both dropdowns in sync with the matrix data.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Skeleton } from '@/components/atoms/skeleton';
import authSDK from '@/services/sdk-simple-auth';
import { useEffect, useState } from 'react';
import type { UserPermissionRow } from '../types/permissionsMatrix';

interface Branch {
  id: string | number;
  sucursal: string;
}

interface PermissionsFiltersProps {
  selectedBranchId: number | null;
  onBranchChange: (branchId: number | null) => void;
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
  users: UserPermissionRow[];
  isLoading?: boolean;
}

const ALL_USERS_VALUE = '__all__';

export const PermissionsFilters = ({
  selectedBranchId,
  onBranchChange,
  selectedUserId,
  onUserChange,
  users,
  isLoading = false,
}: PermissionsFiltersProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      const { user } = await authSDK.getState();
      setBranches(user?.sucursales || []);
    };
    loadBranches();
  }, []);

  const handleBranchChange = (value: string) => {
    onBranchChange(Number(value));
    // Reset the user filter when branch changes
    onUserChange(null);
  };

  const handleUserChange = (value: string) => {
    if (value === ALL_USERS_VALUE) {
      onUserChange(null);
    } else {
      onUserChange(Number(value));
    }
  };

  const userSelectValue =
    selectedUserId !== null ? String(selectedUserId) : ALL_USERS_VALUE;

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Branch selector */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Sucursal</label>
        <Select
          value={selectedBranchId !== null ? String(selectedBranchId) : ''}
          onValueChange={handleBranchChange}
          disabled={branches.length === 0}
        >
          <SelectTrigger className="w-48" aria-label="Seleccionar sucursal">
            <SelectValue placeholder="Selecciona sucursal" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.sucursal || `Sucursal ${branch.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User filter */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">Usuario</label>
        <Select
          value={userSelectValue}
          onValueChange={handleUserChange}
          disabled={selectedBranchId === null || users.length === 0}
        >
          <SelectTrigger className="w-48" aria-label="Filtrar por usuario">
            <SelectValue placeholder="Todos los usuarios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_USERS_VALUE}>Todos</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.userId} value={String(user.userId)}>
                {user.userName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PermissionsFilters;
