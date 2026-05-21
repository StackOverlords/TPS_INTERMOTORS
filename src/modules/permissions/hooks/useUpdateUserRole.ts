/**
 * Mutation hook for updating a user's role in a branch.
 *
 * On success, invalidates:
 *   - PERMISSIONS_QUERY_KEYS.branchUsers(branchId) — refreshes the matrix row
 *     so the role badge reflects the change immediately without a manual reload.
 *
 * Uses the existing `updateUserRole` service which posts to
 * /branches/actions/add_user/:branchId (OrganizationBranchController@add_user).
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateUserRole();
 *
 * const handleRoleChange = (newRole: string) => {
 *   mutate({ userId: row.userId, branchId: row.branchId, role: newRole });
 * };
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS_QUERY_KEYS } from '@/lib/queryKeys';
import { updateUserRole } from '../services/permissionsMatrixService';
import type { UpdateUserRoleRequest } from '../types/permissionsMatrix';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateUserRoleRequest) => updateUserRole(request),
    onSuccess: (_, variables) => {
      // Invalidate branch users so the matrix row refreshes with the new role
      queryClient.invalidateQueries({
        queryKey: PERMISSIONS_QUERY_KEYS.branchUsers(String(variables.branchId)),
      });
    },
  });
};
