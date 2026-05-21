/**
 * PermissionsMatrix — The scrollable table with module-group column headers
 * and one PermissionsRow per user.
 *
 * Table structure:
 *   Header row 1: "Usuario / Rol" | [Module label spanning N columns] | ...
 *   Header row 2: empty | [permission name per column] | ...
 *   Body: one PermissionsRow per user
 *
 * The filteredUserId prop controls which user is shown (null = all users).
 * An empty-state message is shown when no users match the filter.
 *
 * Loading state: skeleton rows for the expected table body.
 * The parent (PermissionsScreen) controls isLoading based on the hook state.
 */

import { Skeleton } from '@/components/atoms/skeleton';
import { Users } from 'lucide-react';
import { Fragment } from 'react';
import type { PermissionsMatrixData } from '../types/permissionsMatrix';
import PermissionsRow from './PermissionsRow';

interface PermissionsMatrixProps {
  data: PermissionsMatrixData;
  filteredUserId: number | null;
  onPermissionChange: (userId: number, newPermissions: string[]) => void;
  isSaving?: boolean;
}

interface LoadingMatrixProps {
  columnCount?: number;
  rowCount?: number;
}

const LoadingMatrix = ({ columnCount = 10, rowCount = 5 }: LoadingMatrixProps) => (
  <div className="overflow-auto border border-border rounded-md">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th className="sticky left-0 z-20 bg-muted/40 px-3 py-2 min-w-[200px]">
            <Skeleton className="h-4 w-28" />
          </th>
          {Array.from({ length: columnCount }).map((_, i) => (
            <th key={i} className="px-2 py-2 min-w-[40px]">
              <Skeleton className="h-4 w-8 mx-auto" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <tr key={rowIdx} className="border-b border-border">
            <td className="sticky left-0 z-10 bg-background px-3 py-2 min-w-[200px] border-r border-border">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20 mt-1" />
              </div>
            </td>
            {Array.from({ length: columnCount }).map((_, colIdx) => (
              <td key={colIdx} className="px-2 py-2 text-center">
                <Skeleton className="h-4 w-4 mx-auto rounded-sm" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PermissionsMatrix = ({
  data,
  filteredUserId,
  onPermissionChange,
  isSaving = false,
}: PermissionsMatrixProps) => {
  const { permissionGroups, users } = data;

  const visibleUsers =
    filteredUserId !== null
      ? users.filter((u) => u.userId === filteredUserId)
      : users;

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-md">
        <Users className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          Sin usuarios en esta sucursal
        </h3>
        <p className="text-sm text-muted-foreground">
          No hay usuarios asignados a esta sucursal. Asigna usuarios desde la
          sección de Sucursales.
        </p>
      </div>
    );
  }

  if (visibleUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-md">
        <p className="text-sm text-muted-foreground">
          No se encontró el usuario seleccionado en esta sucursal.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-border rounded-md">
      <table className="w-full text-sm border-collapse">
        <thead>
          {/* Row 1: group-level column headers */}
          <tr className="border-b border-border bg-muted/40">
            <th
              className="sticky left-0 z-20 bg-muted/40 px-3 py-2 text-left font-semibold text-foreground min-w-[200px] border-r border-border"
              rowSpan={2}
            >
              Usuario / Rol
            </th>
            {permissionGroups.map((group, groupIndex) => (
              <Fragment key={group.key}>
                <th
                  colSpan={group.permissions.length}
                  className="px-2 py-1 text-center font-semibold text-xs text-foreground border-l border-border bg-muted/40 uppercase tracking-wide"
                >
                  {group.label}
                </th>
                {/* Separator column between groups */}
                {groupIndex < permissionGroups.length - 1 && (
                  <th
                    className="w-px bg-border/60 p-0"
                    aria-hidden="true"
                  />
                )}
              </Fragment>
            ))}
          </tr>

          {/* Row 2: individual permission column headers */}
          <tr className="border-b-2 border-border bg-muted/20">
            {permissionGroups.map((group, groupIndex) => (
              <Fragment key={group.key}>
                {group.permissions.map((permission) => (
                  <th
                    key={permission.name}
                    className="px-1 py-1 text-center min-w-[40px]"
                    title={permission.descripcion ?? permission.name}
                  >
                    <span className="block text-[10px] font-mono text-muted-foreground leading-tight max-w-[60px] truncate mx-auto">
                      {permission.name.replace(/^[a-z]+-/, '')}
                    </span>
                  </th>
                ))}
                {groupIndex < permissionGroups.length - 1 && (
                  <th
                    className="w-px bg-border/60 p-0"
                    aria-hidden="true"
                  />
                )}
              </Fragment>
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleUsers.map((user) => (
            <PermissionsRow
              key={user.userId}
              user={user}
              permissionGroups={permissionGroups}
              onPermissionChange={onPermissionChange}
              isSaving={isSaving}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

PermissionsMatrix.Loading = LoadingMatrix;

export default PermissionsMatrix;
