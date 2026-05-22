import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import { Input } from '@/components/atoms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Skeleton } from '@/components/atoms/skeleton';
import { ProtectedAction } from '@/components/common/ProtectedAction';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useGoBack } from '@/hooks/useGoBack';
import { PERMISSIONS } from '@/lib/permissions';
import authSDK from '@/services/sdk-simple-auth';
import { useBranchStore } from '@/states/branchStore';
import { Kbd } from '@/components/atoms/kbd';
import TooltipButton from '@/components/common/TooltipButton';
import {
  ChevronRight,
  CornerUpLeft,
  Loader2,
  Save,
  Search,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { usePermissionsMatrix } from '../hooks/usePermissionsMatrix';
import { useUpdateUserPermissions } from '../hooks/useUpdateUserPermissions';
import { useUpdateUserRole } from '../hooks/useUpdateUserRole';
import type { PermissionGroup, UserPermissionRow } from '../types/permissionsMatrix';
import { cn } from '@/lib/utils';

const BRANCH_ROLES = ['Vendedor', 'Administrador', 'Super Admin'] as const;

// ─── Branch selector ─────────────────────────────────────────────────────────

interface BranchSelectorProps {
  value: number | null;
  onChange: (id: number) => void;
}

const BranchSelector = ({ value, onChange }: BranchSelectorProps) => {
  const [branches, setBranches] = useState<{ id: string | number; sucursal: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { user } = await authSDK.getState();
      setBranches(user?.sucursales || []);
    };
    load();
  }, []);

  return (
    <Select
      value={value !== null ? String(value) : ''}
      onValueChange={(v) => onChange(Number(v))}
      disabled={branches.length === 0}
    >
      <SelectTrigger className="h-8 text-xs w-full">
        <SelectValue placeholder="Selecciona sucursal…" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            {b.sucursal || `Sucursal ${b.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// ─── User list item ───────────────────────────────────────────────────────────

interface UserItemProps {
  user: UserPermissionRow;
  isSelected: boolean;
  isDirty: boolean;
  onClick: () => void;
}

const UserItem = ({ user, isSelected, isDirty, onClick }: UserItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left',
      isSelected
        ? 'bg-primary/10 text-primary font-medium'
        : 'hover:bg-accent text-muted-foreground hover:text-foreground',
    )}
  >
    <User className="size-3 shrink-0" />
    <span className="flex-1 truncate">{user.userName}</span>
    {isDirty && (
      <span className="size-1.5 rounded-full bg-amber-500 shrink-0" title="Cambios sin guardar" />
    )}
  </button>
);

// ─── Permission group (module) ────────────────────────────────────────────────

interface PermGroupProps {
  group: PermissionGroup;
  currentPermissions: Set<string>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePermission: (name: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  disabled: boolean;
}

const PermGroup = ({
  group,
  currentPermissions,
  isExpanded,
  onToggleExpand,
  onTogglePermission,
  onToggleAll,
  disabled,
}: PermGroupProps) => {
  const grantedCount = group.permissions.filter((p) => currentPermissions.has(p.name)).length;
  const total = group.permissions.length;
  const allChecked = grantedCount === total;
  const someChecked = grantedCount > 0 && grantedCount < total;

  return (
    <div className="rounded border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/40 hover:bg-muted/70 transition-colors">
        <Checkbox
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          onCheckedChange={(v) => onToggleAll(!!v)}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 flex-1 text-left min-w-0"
        >
          <ChevronRight
            className={cn(
              'size-3 shrink-0 transition-transform text-muted-foreground',
              isExpanded && 'rotate-90',
            )}
          />
          <span className="text-xs font-semibold text-foreground truncate">{group.label}</span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0 pl-2">
            {grantedCount}/{total}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="divide-y divide-border/50 ml-6 border-l border-border/50">
          {group.permissions.map((perm) => {
            const isChecked = currentPermissions.has(perm.name);
            return (
              <label
                key={perm.name}
                className="flex items-start gap-2.5 pl-3 pr-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(v) => onTogglePermission(perm.name, !!v)}
                  disabled={disabled}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    {perm.descripcion || perm.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{perm.name}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const PermissionsScreenContent = () => {
  const { selectedBranchId: globalBranchId } = useBranchStore();

  const [localBranchId, setLocalBranchId] = useState<number | null>(
    globalBranchId !== null ? Number(globalBranchId) : null,
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(BRANCH_ROLES));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [dirtyMap, setDirtyMap] = useState<Map<number, string[]>>(new Map());

  const { data, isLoading, isError } = usePermissionsMatrix(localBranchId);
  const { mutate: updatePermissions, isPending: isSaving } = useUpdateUserPermissions();
  const { mutate: updateRole } = useUpdateUserRole();

  const handleGoBack = useGoBack('/dashboard/settings');
  useHotkeys('escape', (e) => { e.preventDefault(); handleGoBack(); }, { scopes: ['esc-key'], enabled: true });

  const users = useMemo(() => data?.users ?? [], [data]);
  const permissionGroups = useMemo(() => data?.permissionGroups ?? [], [data]);

  const selectedUser = useMemo(
    () => users.find((u) => u.userId === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const currentPermissions = useMemo((): Set<string> => {
    if (!selectedUser) return new Set();
    return new Set(dirtyMap.get(selectedUser.userId) ?? selectedUser.grantedPermissions);
  }, [selectedUser, dirtyMap]);

  const usersByRole = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = query
      ? users.filter((u) => u.userName.toLowerCase().includes(query))
      : users;
    return filtered.reduce(
      (acc, user) => {
        const role = user.currentRole || 'Sin rol';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      },
      {} as Record<string, UserPermissionRow[]>,
    );
  }, [users, searchQuery]);

  const hasDirtyChanges = dirtyMap.size > 0;
  const totalGranted = currentPermissions.size;

  const filteredPermissionGroups = useMemo(() => {
    if (!moduleSearchQuery) return permissionGroups;
    const q = moduleSearchQuery.toLowerCase();
    return permissionGroups.filter((g) => g.label.toLowerCase().includes(q));
  }, [permissionGroups, moduleSearchQuery]);

  const handleBranchChange = useCallback((branchId: number) => {
    setLocalBranchId(branchId);
    setSelectedUserId(null);
    setDirtyMap(new Map());
  }, []);

  const handleSelectUser = useCallback(
    (userId: number) => {
      setSelectedUserId(userId);
      if (expandedModules.size === 0 && permissionGroups.length > 0) {
        setExpandedModules(new Set([permissionGroups[0].key]));
      }
    },
    [expandedModules.size, permissionGroups],
  );

  const handleToggleRole = useCallback((role: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  }, []);

  const handleToggleModule = useCallback((key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleTogglePermission = useCallback(
    (permName: string, checked: boolean) => {
      if (!selectedUser) return;
      const current = dirtyMap.get(selectedUser.userId) ?? selectedUser.grantedPermissions;
      const updated = checked
        ? [...current.filter((p) => p !== permName), permName]
        : current.filter((p) => p !== permName);
      setDirtyMap((prev) => new Map(prev).set(selectedUser.userId, updated));
    },
    [selectedUser, dirtyMap],
  );

  const handleToggleGroup = useCallback(
    (group: PermissionGroup, checked: boolean) => {
      if (!selectedUser) return;
      const current = new Set(
        dirtyMap.get(selectedUser.userId) ?? selectedUser.grantedPermissions,
      );
      group.permissions.forEach((p) => (checked ? current.add(p.name) : current.delete(p.name)));
      setDirtyMap((prev) => new Map(prev).set(selectedUser.userId, Array.from(current)));
    },
    [selectedUser, dirtyMap],
  );

  const handleRoleChange = useCallback(
    (newRole: string) => {
      if (!selectedUser || !localBranchId) return;
      updateRole({ userId: selectedUser.userId, branchId: localBranchId, role: newRole });
    },
    [selectedUser, localBranchId, updateRole],
  );

  const handleSave = useCallback(async () => {
    if (!localBranchId || !hasDirtyChanges || isSaving) return;
    const entries = Array.from(dirtyMap.entries());
    let successCount = 0;
    let errorCount = 0;

    for (const [userId, permissions] of entries) {
      await new Promise<void>((resolve) => {
        updatePermissions(
          { userId, branchId: localBranchId, permissions },
          {
            onSuccess: () => { successCount++; resolve(); },
            onError: () => { errorCount++; resolve(); },
          },
        );
      });
    }

    if (errorCount === 0) {
      showSuccessToast({
        title: 'Cambios guardados',
        description: `Permisos de ${successCount} usuario${successCount !== 1 ? 's' : ''} actualizados.`,
        duration: 4000,
      });
      setDirtyMap(new Map());
    } else if (successCount > 0) {
      showErrorToast({
        title: 'Guardado parcial',
        description: `${successCount} OK, ${errorCount} con errores. Revisá e intentá nuevamente.`,
        duration: 6000,
      });
    } else {
      showErrorToast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar los cambios. Intentá nuevamente.',
        duration: 5000,
      });
    }
  }, [localBranchId, dirtyMap, hasDirtyChanges, isSaving, updatePermissions]);

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
              buttonProps={{ variant: 'default', type: 'button', className: 'size-9' }}
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

          {hasDirtyChanges && (
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSaving ? 'Guardando…' : `Guardar cambios (${dirtyMap.size})`}
            </Button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* LEFT: Users */}
        <div className="w-56 shrink-0 border border-border rounded-lg bg-background flex flex-col overflow-hidden shadow-sm">
          <div className="p-2 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Sucursal
            </p>
            <BranchSelector value={localBranchId} onChange={handleBranchChange} />
          </div>

          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-1.5">
            {isLoading && localBranchId !== null && (
              <div className="space-y-1 p-1">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-full rounded" />)}
              </div>
            )}
            {!isLoading && isError && (
              <p className="text-xs text-destructive text-center py-4 px-2">Error al cargar usuarios.</p>
            )}
            {!isLoading && localBranchId === null && (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                Seleccioná una sucursal para ver los usuarios.
              </p>
            )}
            {!isLoading && !isError && localBranchId !== null && Object.keys(usersByRole).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 px-2">
                {searchQuery ? 'Sin resultados.' : 'No hay usuarios en esta sucursal.'}
              </p>
            )}

            {Object.entries(usersByRole).map(([role, roleUsers]) => (
              <div key={role} className="mb-1">
                <button
                  onClick={() => handleToggleRole(role)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-accent rounded text-xs font-semibold text-foreground"
                >
                  <ChevronRight
                    className={cn(
                      'size-3 transition-transform text-muted-foreground',
                      expandedRoles.has(role) && 'rotate-90',
                    )}
                  />
                  <Users className="size-3 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{role}</span>
                  <span className="text-[10px] text-muted-foreground">{roleUsers.length}</span>
                </button>

                {expandedRoles.has(role) && (
                  <div className="ml-3 mt-0.5 space-y-0.5">
                    {roleUsers.map((user) => (
                      <UserItem
                        key={user.userId}
                        user={user}
                        isSelected={selectedUserId === user.userId}
                        isDirty={dirtyMap.has(user.userId)}
                        onClick={() => handleSelectUser(user.userId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Permissions */}
        <div className="flex-1 border border-border rounded-lg bg-background flex flex-col overflow-hidden shadow-sm min-w-0">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none">
              <Shield className="size-10 opacity-20" />
              <p className="text-sm">Seleccioná un usuario para gestionar sus permisos</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {selectedUser.userName}
                    </p>
                    {selectedUser.userEmail && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {selectedUser.userEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={selectedUser.currentRole} onValueChange={handleRoleChange}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCH_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {totalGranted} permiso{totalGranted !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Module search */}
              <div className="px-3 py-2 border-b border-border flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar módulo…"
                    value={moduleSearchQuery}
                    onChange={(e) => setModuleSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2 space-y-1.5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPermissionGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {moduleSearchQuery ? 'Sin módulos que coincidan.' : 'No hay permisos disponibles.'}
                  </p>
                ) : (
                  filteredPermissionGroups.map((group) => (
                    <PermGroup
                      key={group.key}
                      group={group}
                      currentPermissions={currentPermissions}
                      isExpanded={expandedModules.has(group.key)}
                      onToggleExpand={() => handleToggleModule(group.key)}
                      onTogglePermission={handleTogglePermission}
                      onToggleAll={(checked) => handleToggleGroup(group, checked)}
                      disabled={isSaving}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
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
