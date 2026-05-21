/**
 * Service functions for the Permissions Management Matrix screen.
 *
 * Uses the same apiClient instance and response-unwrapping pattern as
 * src/modules/users/services/userService.ts — consistent with existing service layer.
 *
 * Endpoints used:
 *   GET  /permissions/list                     — full permissions catalog (grouped by categoria)
 *   GET  /branches/actions/get_users/:branchId — users in a branch (with role + nickname)
 *   GET  /users/permissions?usuario=:userId    — permissions granted to a specific user
 *   PUT  /users/permissions                    — replace a user's permission list
 *   POST /branches/actions/add_user/:branchId  — update a user's role in a branch
 *
 * NOTE on branchUsers endpoint:
 *   The existing `branchesService.getBranchUsers` uses `/branches/actions/get_users/:id`.
 *   This service calls it directly via apiClient to stay self-contained within the
 *   permissions module. The endpoint is confirmed in BRANCH_ENDPOINTS.getUsers.
 *
 * NOTE on updateUserRole:
 *   Uses POST to /branches/actions/add_user/:branchId (OrganizationBranchController@add_user)
 *   which performs an upsert on the branch–user–role relationship. This matches
 *   branchesService.addUserToBranch — same endpoint, same effect.
 */

import apiClient from '@/services/axios';
import type {
  AvailablePermission,
  PermissionGroup,
  UserPermissionRow,
  UpdateUserPermissionsRequest,
  UpdateUserRoleRequest,
} from '../types/permissionsMatrix';

// ─── Raw API response shapes ──────────────────────────────────────────────────

interface RawPermission {
  id: number;
  name: string;
  descripcion?: string | null;
  categoria?: string | null;
}

interface RawBranchUser {
  id_usuario: number;
  rol_name?: string;
  rol?: string;
  usuario?: {
    nickname?: string;
    email?: string;
    data_empleado?: { nombre?: string };
  };
}

interface RawUserPermission {
  name: string;
}

// ─── Endpoint constants ───────────────────────────────────────────────────────

const PERMISSIONS_MATRIX_ENDPOINTS = {
  permissionsList: '/permissions/list',
  branchUsers: (branchId: number) =>
    `/branches/actions/get_users/${branchId}`,
  userPermissions: (userId: number) =>
    `/users/permissions?usuario=${userId}`,
  updatePermissions: '/users/permissions',
  addUserToBranch: (branchId: number) =>
    `/branches/actions/add_user/${branchId}`,
} as const;

// ─── Catalog prefix → label mapping ──────────────────────────────────────────

/**
 * Maps the backend `categoria` field (the permissions group label returned by the API)
 * to a short uppercase key used as `PermissionGroup.key`.
 * Falls back to a slugified version of the categoria string if not found.
 */
const CATEGORIA_TO_KEY: Record<string, string> = {
  Ventas: 'VEN',
  'Ventas Carrito': 'CVE',
  Cotizaciones: 'COT',
  Compras: 'COM',
  Pedidos: 'PED',
  Devoluciones: 'DEV',
  Transferencias: 'TRA',
  'Cuentas por Cobrar': 'CUC',
  Inventario: 'INV',
  Productos: 'PRD',
  Proveedores: 'PRO',
  Clientes: 'CLI',
  Empleados: 'EMP',
  Usuarios: 'USU',
  'Arqueo de Caja': 'CAJ',
  Sistema: 'SIS',
  Configuración: 'CON',
  'Panel de Control': 'PAN',
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Fetch all available permissions from the backend and group them by category.
 *
 * The API at /permissions/list returns either:
 *   - An object keyed by category: { "Ventas": [...], "Compras": [...] }
 *   - Or a flat array of permissions with a `categoria` field
 *
 * This function normalises both shapes into PermissionGroup[].
 *
 * @returns Array of permission groups sorted by module name
 */
export const fetchPermissionsGrouped = async (): Promise<PermissionGroup[]> => {
  const response = await apiClient.get(PERMISSIONS_MATRIX_ENDPOINTS.permissionsList);
  const raw = response.data.data || response.data || {};

  // Shape A: object keyed by category name (most likely from the backend)
  if (!Array.isArray(raw) && typeof raw === 'object') {
    const groups: PermissionGroup[] = Object.entries(raw).map(
      ([categoriaLabel, perms]) => {
        const permissions = (perms as RawPermission[]).map((p) => ({
          id: p.id as number,
          name: p.name as string,
          descripcion: (p.descripcion ?? null) as string | null,
          categoria: (p.categoria ?? categoriaLabel) as string | null,
        }));

        const key = CATEGORIA_TO_KEY[categoriaLabel] ?? categoriaLabel.toUpperCase().replace(/\s+/g, '_');

        return {
          key,
          label: categoriaLabel,
          permissions,
        } satisfies PermissionGroup;
      }
    );
    return groups;
  }

  // Shape B: flat array with a `categoria` field per permission
  if (Array.isArray(raw)) {
    const groupMap = new Map<string, AvailablePermission[]>();

    for (const p of raw as RawPermission[]) {
      const cat: string = p.categoria ?? 'Sin categoría';
      if (!groupMap.has(cat)) {
        groupMap.set(cat, []);
      }
      groupMap.get(cat)!.push({
        id: p.id as number,
        name: p.name as string,
        descripcion: (p.descripcion ?? null) as string | null,
        categoria: cat,
      });
    }

    return Array.from(groupMap.entries()).map(([categoriaLabel, permissions]) => ({
      key: CATEGORIA_TO_KEY[categoriaLabel] ?? categoriaLabel.toUpperCase().replace(/\s+/g, '_'),
      label: categoriaLabel,
      permissions,
    }));
  }

  // Unexpected shape — return empty to avoid crashing the matrix screen
  return [];
};

/**
 * Fetch all users assigned to a branch, including their current role and granted permissions.
 *
 * Combines two API calls:
 *   1. GET /branches/actions/get_users/:branchId — returns users with roles
 *   2. GET /users/permissions?usuario=:userId — returns permission names per user
 *
 * The second call is made in parallel for all users (Promise.allSettled) so that
 * a single failing user permissions request does not block the full matrix load.
 *
 * @param branchId - The branch ID to fetch users for
 * @returns Array of user rows with their roles and granted permissions
 */
export const fetchBranchUsersWithPermissions = async (
  branchId: number
): Promise<UserPermissionRow[]> => {
  // Step 1: fetch branch users (role + identity)
  const usersResponse = await apiClient.get(
    PERMISSIONS_MATRIX_ENDPOINTS.branchUsers(branchId)
  );
  const rawUsers: RawBranchUser[] = usersResponse.data.data || usersResponse.data || [];

  if (rawUsers.length === 0) {
    return [];
  }

  // Step 2: fetch permissions for each user in parallel
  const permissionResults = await Promise.allSettled(
    rawUsers.map(async (u) => {
      const userId = u.id_usuario as number;
      const permResponse = await apiClient.get(
        PERMISSIONS_MATRIX_ENDPOINTS.userPermissions(userId)
      );
      const rawPerms: RawUserPermission[] = permResponse.data.data || permResponse.data || [];
      // Permission objects have a `name` field (matching Permission type from User.ts)
      return rawPerms.map((p) => p.name as string);
    })
  );

  // Step 3: combine into UserPermissionRow[]
  return rawUsers.map((u, index): UserPermissionRow => {
    const permResult = permissionResults[index];
    const grantedPermissions =
      permResult.status === 'fulfilled' ? permResult.value : [];

    return {
      userId: u.id_usuario as number,
      userName: (u.usuario?.nickname ?? u.usuario?.data_empleado?.nombre ?? `Usuario ${u.id_usuario}`) as string,
      userEmail: (u.usuario?.email ?? undefined) as string | undefined,
      branchId,
      currentRole: (u.rol_name ?? u.rol ?? 'Sin rol') as string,
      grantedPermissions,
    };
  });
};

/**
 * Replace a user's full permission list in the backend.
 *
 * Sends a PUT to /users/permissions with the complete desired permission list.
 * The backend performs a FULL replacement — all existing permissions are removed
 * and the provided list is granted. Send the complete desired state, not a diff.
 *
 * @param request - userId, branchId, and the complete permissions list
 */
export const updateUserPermissions = async (
  request: UpdateUserPermissionsRequest
): Promise<void> => {
  // Backend expects: { usuario: number, permisos: Array<{ name: string }> }
  // Matching the UserPermissionsRequest shape from src/modules/users/types/User.ts
  await apiClient.put(PERMISSIONS_MATRIX_ENDPOINTS.updatePermissions, {
    usuario: request.userId,
    permisos: request.permissions.map((name) => ({ name })),
  });
};

/**
 * Update a user's role in a branch.
 *
 * Uses POST /branches/actions/add_user/:branchId which performs an upsert on
 * the branch–user–role relationship (OrganizationBranchController@add_user).
 * This is the same endpoint used by branchesService.addUserToBranch.
 *
 * @param request - userId, branchId, and the new role string
 */
export const updateUserRole = async (
  request: UpdateUserRoleRequest
): Promise<void> => {
  await apiClient.post(
    PERMISSIONS_MATRIX_ENDPOINTS.addUserToBranch(request.branchId),
    {
      usuario_id: request.userId,
      rol: request.role,
    }
  );
};
