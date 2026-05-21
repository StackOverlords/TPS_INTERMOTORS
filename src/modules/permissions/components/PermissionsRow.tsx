/**
 * PermissionsRow — A single user row in the permissions matrix table.
 *
 * Renders:
 *   - Left fixed column: user name, email, and inline role selector
 *   - One PermissionCell per permission in each PermissionGroup, with a visual
 *     separator between groups
 *
 * Role selector uses the useUpdateUserRole mutation. The role change is
 * immediate (no dirty tracking at this level) — consistent with the spec's
 * "inline role assignment" pattern.
 *
 * Permission changes are delegated upward via onPermissionChange so the
 * PermissionsScreen can track the dirty Map and batch-save.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Badge } from '@/components/atoms/badge';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { Fragment } from 'react';
import type { PermissionGroup, UserPermissionRow } from '../types/permissionsMatrix';
import { useUpdateUserRole } from '../hooks/useUpdateUserRole';
import PermissionCell from './PermissionCell';

const AVAILABLE_ROLES = ['Super Admin', 'Administrador', 'Vendedor'] as const;

interface PermissionsRowProps {
  user: UserPermissionRow;
  permissionGroups: PermissionGroup[];
  onPermissionChange: (userId: number, newPermissions: string[]) => void;
  isSaving?: boolean;
}

const ROLE_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  'Super Admin': 'default',
  Administrador: 'secondary',
  Vendedor: 'outline',
};

export const PermissionsRow = ({
  user,
  permissionGroups,
  onPermissionChange,
  isSaving = false,
}: PermissionsRowProps) => {
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();

  const handleRoleChange = (newRole: string) => {
    updateRole(
      { userId: user.userId, branchId: user.branchId, role: newRole },
      {
        onSuccess: () => {
          showSuccessToast({
            title: 'Rol actualizado',
            description: `${user.userName} ahora tiene el rol "${newRole}"`,
            duration: 3000,
          });
        },
        onError: () => {
          showErrorToast({
            title: 'Error al actualizar rol',
            description: 'No se pudo cambiar el rol. Intenta nuevamente.',
            duration: 4000,
          });
        },
      }
    );
  };

  const roleVariant = ROLE_BADGE_VARIANTS[user.currentRole] ?? 'outline';

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      {/* User identity + role selector — sticky left column */}
      <td className="sticky left-0 z-10 bg-background px-3 py-2 min-w-[200px] max-w-[220px] border-r border-border">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm text-foreground leading-tight truncate">
            {user.userName}
          </span>
          {user.userEmail && (
            <span className="text-xs text-muted-foreground truncate">
              {user.userEmail}
            </span>
          )}

          <div className="mt-1">
            {isUpdatingRole ? (
              <Badge variant={roleVariant} className="text-xs animate-pulse">
                {user.currentRole}
              </Badge>
            ) : (
              <Select
                value={user.currentRole}
                onValueChange={handleRoleChange}
                disabled={isSaving}
              >
                <SelectTrigger
                  className="h-6 text-xs px-2 py-0 border-dashed"
                  aria-label={`Rol de ${user.userName}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </td>

      {/* Permission cells — one per permission, grouped by module */}
      {permissionGroups.map((group, groupIndex) => (
        <Fragment key={group.key}>
          {group.permissions.map((permission) => (
            <td
              key={`${user.userId}-${permission.name}`}
              className="px-2 py-2 text-center min-w-[40px]"
            >
              <PermissionCell
                permissionName={permission.name}
                isGranted={user.grantedPermissions.includes(permission.name)}
                allUserPermissions={user.grantedPermissions}
                userId={user.userId}
                branchId={user.branchId}
                onPermissionChange={onPermissionChange}
                disabled={isSaving || isUpdatingRole}
              />
            </td>
          ))}

          {/* Visual separator between permission groups (not after last group) */}
          {groupIndex < permissionGroups.length - 1 && (
            <td
              className="w-px bg-border/60 p-0"
              aria-hidden="true"
            />
          )}
        </Fragment>
      ))}
    </tr>
  );
};

export default PermissionsRow;
