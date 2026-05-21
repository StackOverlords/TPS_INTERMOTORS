/**
 * Types for the Permissions Management Matrix screen.
 *
 * Design decision FE-D4: Separate `permissions/` module (absorbs role + permission
 * management). These types model the matrix data — rows are users per branch,
 * columns are permission groups by module.
 *
 * Source of truth: REQ-8 (Permissions Management Screen spec).
 */

// ─── Permission catalog ──────────────────────────────────────────────────────

/**
 * A single permission available for assignment.
 * Matches the shape returned by GET /permissions/list.
 */
export interface AvailablePermission {
  id: number;
  name: string;
  descripcion: string | null;
  categoria: string | null;
}

/**
 * A permission group (module) with all its permissions.
 * Used to render column-group headers in the matrix.
 *
 * @example
 * { key: 'VEN', label: 'Ventas', permissions: [{ id: 1, name: 'ven-create', ... }] }
 */
export interface PermissionGroup {
  /** Short prefix key, e.g. 'VEN', 'CAJ', 'COM' */
  key: string;
  /** Human-readable module label for column headers */
  label: string;
  permissions: AvailablePermission[];
}

// ─── User rows ───────────────────────────────────────────────────────────────

/**
 * A single user row in the permissions matrix.
 * Contains the user identity, their branch role, and their current granted permissions.
 */
export interface UserPermissionRow {
  userId: number;
  /** Display name — nickname from the user's profile */
  userName: string;
  userEmail?: string;
  branchId: number;
  /** Role in the active branch, e.g. 'Vendedor', 'Administrador' */
  currentRole: string;
  /** Permission name strings the user has been granted (e.g. 'ven-create') */
  grantedPermissions: string[];
}

// ─── Matrix aggregate ────────────────────────────────────────────────────────

/**
 * The full matrix data for a branch.
 * Combines the permission catalog and all user rows.
 */
export interface PermissionsMatrixData {
  branchId: number;
  permissionGroups: PermissionGroup[];
  users: UserPermissionRow[];
}

// ─── Mutation requests ────────────────────────────────────────────────────────

/**
 * Request to replace a user's full permission list in a branch.
 * The backend performs a full replacement (not a diff) — send the complete desired list.
 */
export interface UpdateUserPermissionsRequest {
  userId: number;
  branchId: number;
  /** Complete list of permission name strings to assign (replaces existing) */
  permissions: string[];
}

/**
 * Request to update a user's role in a specific branch.
 * Uses the existing OrganizationBranchController@add_user PUT endpoint.
 */
export interface UpdateUserRoleRequest {
  userId: number;
  branchId: number;
  role: string;
}
