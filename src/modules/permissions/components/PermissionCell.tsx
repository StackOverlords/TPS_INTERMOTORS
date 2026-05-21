/**
 * PermissionCell — Single checkbox cell in the permissions matrix.
 *
 * Manages optimistic local state: the checkbox updates immediately on click,
 * and the calling component receives the full new permissions list (not just
 * the delta) so it can dispatch the mutation and handle errors.
 *
 * CRITICAL: The backend does a FULL replacement of the user's permission list.
 * This cell computes the new complete list (add or remove this permission from
 * allUserPermissions) and emits it via onPermissionChange. The parent must pass
 * the full allUserPermissions array reflecting current granted state.
 *
 * The disabled prop must be set to true while the parent mutation is in-flight
 * to prevent double-toggles.
 */

import { Checkbox } from '@/components/atoms/checkbox';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PermissionCellProps {
  /** The permission name string, e.g. 'ven-create' */
  permissionName: string;
  /** Whether this permission is currently granted to the user */
  isGranted: boolean;
  /** The user's complete current permission list — needed to compute the new full list */
  allUserPermissions: string[];
  userId: number;
  branchId: number;
  /** Called with the user ID and the complete new permissions list on every toggle */
  onPermissionChange: (userId: number, newPermissions: string[]) => void;
  /** Set to true while the parent mutation is saving to prevent concurrent edits */
  disabled?: boolean;
}

export const PermissionCell = ({
  permissionName,
  isGranted,
  allUserPermissions,
  userId,
  onPermissionChange,
  disabled = false,
}: PermissionCellProps) => {
  // Optimistic local state — initialised from the server-side isGranted value
  const [optimisticGranted, setOptimisticGranted] = useState(isGranted);
  const [isPending, setIsPending] = useState(false);

  // Sync with server state when the parent refreshes data after a save
  useEffect(() => {
    setOptimisticGranted(isGranted);
    setIsPending(false);
  }, [isGranted]);

  const handleChange = () => {
    if (disabled || isPending) return;

    const newGranted = !optimisticGranted;

    // Compute full replacement list
    let newPermissions: string[];
    if (newGranted) {
      // Add permission (deduplicate just in case)
      newPermissions = allUserPermissions.includes(permissionName)
        ? allUserPermissions
        : [...allUserPermissions, permissionName];
    } else {
      // Remove permission
      newPermissions = allUserPermissions.filter((p) => p !== permissionName);
    }

    // Apply optimistic update
    setOptimisticGranted(newGranted);
    setIsPending(true);

    // Emit full list to parent — parent manages mutation and error revert
    onPermissionChange(userId, newPermissions);
  };

  const checkboxId = `perm-${userId}-${permissionName}`;

  return (
    <div className="flex items-center justify-center">
      {isPending ? (
        <Loader2
          className="size-4 animate-spin text-muted-foreground"
          aria-label="Guardando..."
        />
      ) : (
        <Checkbox
          id={checkboxId}
          checked={optimisticGranted}
          onCheckedChange={handleChange}
          disabled={disabled}
          aria-label={`Permiso ${permissionName}`}
          className="border-border"
        />
      )}
    </div>
  );
};

export default PermissionCell;
