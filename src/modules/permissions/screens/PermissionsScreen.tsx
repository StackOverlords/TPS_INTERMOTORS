/**
 * PermissionsScreen — Container screen for the Permissions Management Matrix.
 *
 * Architecture (FE-D4):
 *   - Reads selectedBranchId from useBranchStore as the default branch
 *   - Uses usePermissionsMatrix(selectedBranchId) to load the matrix data
 *   - Owns a local dirty Map<userId, string[]> tracking unsaved permission changes
 *   - Exposes a "Guardar cambios" button that batch-saves all dirty entries
 *   - Delegates filter state (branch + user selection) down to PermissionsFilters
 *   - Delegates matrix rendering to PermissionsMatrix
 *
 * Access control:
 *   - Wrapped in ProtectedAction with PERMISSIONS.SIS.ADM_PERMISOS
 *   - Role guard: Administrador + Super Admin
 *
 * REQ-8: This screen replaces UserPermissionsScreen (already commented out).
 * Route: /dashboard/settings/permissions (see Settings.Route.ts).
 */

import { Button } from '@/components/atoms/button';
import { ProtectedAction } from '@/components/common/ProtectedAction';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useGoBack } from '@/hooks/useGoBack';
import { PERMISSIONS } from '@/lib/permissions';
import { useBranchStore } from '@/states/branchStore';
import { Kbd } from '@/components/atoms/kbd';
import TooltipButton from '@/components/common/TooltipButton';
import { CornerUpLeft, Loader2, Save, Shield } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { PermissionsFilters } from '../components/PermissionsFilters';
import { PermissionsMatrix } from '../components/PermissionsMatrix';
import { usePermissionsMatrix } from '../hooks/usePermissionsMatrix';
import { useUpdateUserPermissions } from '../hooks/useUpdateUserPermissions';

const PermissionsScreenContent = () => {
  const { selectedBranchId: globalBranchId } = useBranchStore();

  // Local branch selection — defaults to the current global branch
  const [localBranchId, setLocalBranchId] = useState<number | null>(
    globalBranchId !== null ? Number(globalBranchId) : null
  );
  const [filteredUserId, setFilteredUserId] = useState<number | null>(null);

  // Dirty map: userId → new permissions list (unsaved changes)
  const [dirtyMap, setDirtyMap] = useState<Map<number, string[]>>(new Map());

  const { data, isLoading, isError } = usePermissionsMatrix(localBranchId);

  const { mutate: updatePermissions, isPending: isSaving } =
    useUpdateUserPermissions();

  const handleGoBack = useGoBack('/dashboard/settings');

  useHotkeys(
    'escape',
    (e) => {
      e.preventDefault();
      handleGoBack();
    },
    { scopes: ['esc-key'], enabled: true }
  );

  const handleBranchChange = useCallback((branchId: number | null) => {
    setLocalBranchId(branchId);
    setFilteredUserId(null);
    setDirtyMap(new Map()); // Clear dirty state on branch change
  }, []);

  const handleUserFilterChange = useCallback((userId: number | null) => {
    setFilteredUserId(userId);
  }, []);

  /**
   * Called by PermissionCell via PermissionsMatrix → PermissionsRow.
   * Updates the dirty map — the matrix reflects changes immediately from
   * the optimistic state in PermissionCell; dirty map tracks what needs saving.
   */
  const handlePermissionChange = useCallback(
    (userId: number, newPermissions: string[]) => {
      setDirtyMap((prev) => {
        const next = new Map(prev);
        next.set(userId, newPermissions);
        return next;
      });
    },
    []
  );

  const hasDirtyChanges = dirtyMap.size > 0;

  const handleSave = useCallback(async () => {
    if (!localBranchId || !hasDirtyChanges || isSaving) return;

    const entries = Array.from(dirtyMap.entries());
    let successCount = 0;
    let errorCount = 0;

    // Sequential saves to avoid overwhelming the backend
    for (const [userId, permissions] of entries) {
      await new Promise<void>((resolve) => {
        updatePermissions(
          { userId, branchId: localBranchId, permissions },
          {
            onSuccess: () => {
              successCount++;
              resolve();
            },
            onError: () => {
              errorCount++;
              resolve();
            },
          }
        );
      });
    }

    if (errorCount === 0) {
      showSuccessToast({
        title: 'Cambios guardados',
        description: `Se actualizaron los permisos de ${successCount} usuario${successCount !== 1 ? 's' : ''}.`,
        duration: 4000,
      });
      setDirtyMap(new Map());
    } else if (successCount > 0) {
      showErrorToast({
        title: 'Guardado parcial',
        description: `${successCount} usuario${successCount !== 1 ? 's' : ''} actualizado${successCount !== 1 ? 's' : ''}, ${errorCount} con errores. Revisa e intenta nuevamente.`,
        duration: 6000,
      });
    } else {
      showErrorToast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar los cambios. Intenta nuevamente.',
        duration: 5000,
      });
    }
  }, [localBranchId, dirtyMap, hasDirtyChanges, isSaving, updatePermissions]);

  const users = useMemo(() => data?.users ?? [], [data?.users]);

  return (
    <main className="w-full max-w-full h-full p-2 gap-2 flex flex-col">
      {/* Header */}
      <header className="bg-background rounded-lg p-2 border border-border flex-shrink-0">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <TooltipButton
              tooltipContentProps={{ align: 'start' }}
              onClick={handleGoBack}
              tooltip={
                <p className="flex items-center gap-1">
                  Presiona <Kbd>esc</Kbd> para volver atrás
                </p>
              }
              buttonProps={{
                variant: 'default',
                type: 'button',
                className: 'size-9',
              }}
            >
              <CornerUpLeft />
            </TooltipButton>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-primary leading-tight flex items-center gap-2">
                <Shield className="size-5" />
                Gestión de Permisos
              </h1>
              <p className="text-sm text-muted-foreground">
                Administra los permisos de los usuarios por sucursal
              </p>
            </div>
          </div>

          {/* Save button — only visible when there are unsaved changes */}
          {hasDirtyChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
              variant="default"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving
                ? 'Guardando...'
                : `Guardar cambios (${dirtyMap.size})`}
            </Button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-background rounded-lg p-3 border border-border flex-shrink-0">
        <PermissionsFilters
          selectedBranchId={localBranchId}
          onBranchChange={handleBranchChange}
          selectedUserId={filteredUserId}
          onUserChange={handleUserFilterChange}
          users={users}
          isLoading={isLoading}
        />
      </div>

      {/* Matrix content area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-md">
            <p className="text-sm text-destructive font-medium">
              Error al cargar los permisos
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifica tu conexión o recarga la página
            </p>
          </div>
        )}

        {isLoading && !isError && (
          <PermissionsMatrix.Loading
            columnCount={12}
            rowCount={5}
          />
        )}

        {!isLoading && !isError && data && (
          <PermissionsMatrix
            data={data}
            filteredUserId={filteredUserId}
            onPermissionChange={handlePermissionChange}
            isSaving={isSaving}
          />
        )}

        {!isLoading && !isError && !data && localBranchId !== null && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border border-border rounded-md">
            Selecciona una sucursal para ver la matriz de permisos.
          </div>
        )}

        {localBranchId === null && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border border-border rounded-md">
            Selecciona una sucursal para ver la matriz de permisos.
          </div>
        )}
      </div>
    </main>
  );
};

const PermissionsScreen = () => (
  <ProtectedAction
    permission={PERMISSIONS.SIS.ADM_PERMISOS}
    roles={['Administrador', 'Super Admin']}
    showUnauthorizedMessage={true}
    bypassForSuperAdmin={true}
  >
    <PermissionsScreenContent />
  </ProtectedAction>
);

export default PermissionsScreen;
