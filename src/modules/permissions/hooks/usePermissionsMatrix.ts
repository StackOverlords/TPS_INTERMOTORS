/**
 * Hook for loading the permissions matrix data for a branch.
 *
 * Combines two parallel TanStack Query fetches:
 *   1. allList() — the full permissions catalog (all modules + their permissions)
 *   2. branchUsers(branchId) — users in the selected branch with their granted permissions
 *
 * Returns a combined `PermissionsMatrixData` shape ready for the matrix screen.
 *
 * Design decision FE-D4: the hook accepts `branchId` as a parameter and is enabled
 * only when branchId is non-null. When branchId changes, the branchUsers query
 * automatically re-fetches (branch-scoped cache key).
 *
 * @param branchId - Active branch ID, or null when no branch is selected yet
 */

import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS_QUERY_KEYS } from '@/lib/queryKeys';
import {
  fetchPermissionsGrouped,
  fetchBranchUsersWithPermissions,
} from '../services/permissionsMatrixService';
import type { PermissionsMatrixData } from '../types/permissionsMatrix';

interface UsePermissionsMatrixResult {
  data: PermissionsMatrixData | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const usePermissionsMatrix = (
  branchId: number | null
): UsePermissionsMatrixResult => {
  // Query 1: permissions catalog — branch-independent, high staleTime
  const {
    data: permissionGroups = [],
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
  } = useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.allList(),
    queryFn: fetchPermissionsGrouped,
    staleTime: 1000 * 60 * 10, // 10 minutes — permissions catalog rarely changes
    gcTime: 1000 * 60 * 30,
  });

  // Query 2: branch users with their permissions — enabled only when branchId is set
  const branchIdStr = branchId !== null ? String(branchId) : null;

  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch,
  } = useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.branchUsers(branchIdStr),
    queryFn: () => fetchBranchUsersWithPermissions(branchId!),
    enabled: branchId !== null,
    staleTime: 1000 * 60 * 2, // 2 minutes — user permission grants change more often
    gcTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingCatalog || (branchId !== null && isLoadingUsers);
  const isError = isErrorCatalog || isErrorUsers;

  // Return null data when branchId has not been selected yet or data is still loading
  const data: PermissionsMatrixData | null =
    branchId !== null && !isLoading && !isError
      ? {
          branchId,
          permissionGroups,
          users,
        }
      : null;

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
};
