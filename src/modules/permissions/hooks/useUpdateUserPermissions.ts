/**
 * Mutation hook for updating a user's full permission list.
 *
 * On success, invalidates:
 *   - PERMISSIONS_QUERY_KEYS.branchUsers(branchId) — refreshes the matrix row
 *   - PERMISSIONS_QUERY_KEYS.currentUser()          — clears the cached current-user
 *     permissions (in case the admin edited their own permissions)
 *
 * Design decision FE-D4 (save model):
 *   The spec (REQ-8) says "optimistic update + immediate API call on each toggle
 *   (no explicit Save button)". This hook handles the immediate API call side.
 *   The calling component (PermissionCell) manages the optimistic local state and
 *   reverts on error.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateUserPermissions();
 *
 * const handleToggle = (newPermissions: string[]) => {
 *   mutate({
 *     userId: row.userId,
 *     branchId: row.branchId,
 *     permissions: newPermissions,
 *   });
 * };
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS_QUERY_KEYS } from '@/lib/queryKeys';
import { updateUserPermissions } from '../services/permissionsMatrixService';
import type { UpdateUserPermissionsRequest } from '../types/permissionsMatrix';

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateUserPermissionsRequest) =>
      updateUserPermissions(request),
    onSuccess: (_, variables) => {
      // Invalidate the branch users cache so the matrix refreshes with updated grants
      queryClient.invalidateQueries({
        queryKey: PERMISSIONS_QUERY_KEYS.branchUsers(String(variables.branchId)),
      });

      // Invalidate the current-user permissions in case admin edited their own account
      queryClient.invalidateQueries({
        queryKey: PERMISSIONS_QUERY_KEYS.currentUser(),
      });
    },
  });
};
