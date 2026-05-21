/**
 * PERMISSIONS — Typed constants for all module permissions.
 *
 * Design decision FE-D2 (Option C): const object + derived union type.
 * - Runtime: iterate groups for the permissions matrix screen.
 * - Compile-time: Permission union type prevents magic strings.
 *
 * Source of truth: api-commerce/database/seeders/RolesAndPermissionsSeeder.php
 * Prefix convention:
 *   ven-*   Ventas
 *   cve-*   Ventas Carrito (Cart Sales)
 *   cot-*   Cotizaciones
 *   com-*   Compras
 *   ped-*   Pedidos (Purchase Orders)
 *   dev-*   Devoluciones
 *   tra-*   Transferencias
 *   cuc-*   Cuentas por Cobrar (CxC)
 *   inv-*   Inventario
 *   prd-*   Productos (canonical; pro-* → prd-* migration applied)
 *   pro-*   Proveedores (providers — kept as pro-*)
 *   cli-*   Clientes
 *   emp-*   Empleados
 *   usu-*   Usuarios
 *   caj-*   Arqueo de Caja
 *   sis-*   Sistema / Parametrización
 *   con-*   Configuración
 *   pan-*   Panel de Control
 *   purchase-report_*  Compras Reports (special prefix from seeder)
 *   order-report_*     Pedidos Reports (special prefix from seeder)
 */

export const PERMISSIONS = {
  // ─── VENTAS ─────────────────────────────────────────────────────────────────
  VEN: {
    MODULE: 'ven-module',
    LIST: 'ven-list',
    CREATE: 'ven-create',
    EDIT: 'ven-edit',
    DELETE: 'ven-delete',
    VIEW_PRINT: 'ven-view_print',
    CREATE_DEVOLUCION: 'ven-create_devolucion',
    DETAIL_CREATE: 'ven-detail_create',
    DETAIL_DELETE: 'ven-detail_delete',
    DETAIL_EDIT: 'ven-detail_edit',
    REPORT_GENERAL: 'ven-report_general',
    REPORT_CATEGORIAS: 'ven-report_categorias',
    REPORT_PRODUCTO: 'ven-report_producto',
  },

  // ─── VENTAS CARRITO (CVE) ───────────────────────────────────────────────────
  CVE: {
    MODULE: 'cve-module',
    LIST: 'cve-list',
    STATS: 'cve-stats',
    CREATE_COTIZACION: 'cve-create_cotizacion',
    CREATE_VENTA: 'cve-create_venta',
  },

  // ─── COTIZACIONES ────────────────────────────────────────────────────────────
  COT: {
    MODULE: 'cot-module',
    LIST: 'cot-list',
    CREATE: 'cot-create',
    EDIT: 'cot-edit',
    DELETE: 'cot-delete',
    VIEW_PRINT: 'cot-view_print',
    DETAIL_CREATE: 'cot-detail_create',
    DETAIL_DELETE: 'cot-detail_delete',
    DETAIL_EDIT: 'cot-detail_edit',
  },

  // ─── COMPRAS ─────────────────────────────────────────────────────────────────
  COM: {
    MODULE: 'com-module',
    LIST: 'com-list',
    CREATE: 'com-create',
    EDIT: 'com-edit',
    DELETE: 'com-delete',
    VIEW_PRINT: 'com-view_print',
    UPDATE_PRICES: 'com-update_prices',
    DETAIL_CREATE: 'com-detail_create',
    DETAIL_DELETE: 'com-detail_delete',
    DETAIL_EDIT: 'com-detail_edit',
    REPORT_GENERAL: 'com-report_general',
    REPORT_CATEGORIAS: 'com-report_categorias',
    REPORT_PRODUCTO: 'com-report_producto',
    REPORT_MAYOR_COSTO: 'purchase-report_mayor_costo',
    REPORT_MAS_COMPRADO: 'purchase-report_mas_comprado',
  },

  // ─── PEDIDOS (Pedidos a Proveedores) ────────────────────────────────────────
  PED: {
    MODULE: 'ped-module',
    LIST: 'ped-list',
    CREATE: 'ped-create',
    EDIT: 'ped-edit',
    DELETE: 'ped-delete',
    VIEW_PRINT: 'ped-view_print',
    DETAIL_CREATE: 'ped-detail_create',
    DETAIL_DELETE: 'ped-detail_delete',
    DETAIL_EDIT: 'ped-detail_edit',
    REPORT_GENERAL: 'order-report_general',
    REPORT_TOP_PROVEEDORES: 'order-report_top_proveedores',
    REPORT_TIEMPO_MEDIO: 'order-report_tiempo_medio',
  },

  // ─── DEVOLUCIONES ────────────────────────────────────────────────────────────
  DEV: {
    MODULE: 'dev-module',
    LIST: 'dev-list',
    CREATE: 'dev-create',
    EDIT: 'dev-edit',
    DELETE: 'dev-delete',
    REPORT_GENERAL: 'dev-report_general',
    DETAIL_CREATE: 'dev-detail_create',
    DETAIL_DELETE: 'dev-detail_delete',
    DETAIL_EDIT: 'dev-detail_edit',
  },

  // ─── TRANSFERENCIAS ──────────────────────────────────────────────────────────
  TRA: {
    MODULE: 'tra-module',
    LIST: 'tra-list',
    CREATE: 'tra-create',
    EDIT: 'tra-edit',
    DELETE: 'tra-delete',
    VIEW_PRINT: 'tra-view_print',
    RECEIVE: 'tra-receive',
    REPORT_TRANSITO: 'tra-report_transito',
    DETAIL_CREATE: 'tra-detail_create',
    DETAIL_DELETE: 'tra-detail_delete',
    DETAIL_EDIT: 'tra-detail_edit',
  },

  // ─── CUENTAS POR COBRAR (CUC / CxC) ─────────────────────────────────────────
  CUC: {
    MODULE: 'cuc-module',
    LIST: 'cuc-list',
    CREATE_PAGO: 'cuc-create_pago',
    DELETE_PAGO: 'cuc-delete_pago',
    VIEW_PRINT_PAGO: 'cuc-view_print_pago',
    PAYMENTS_BUSCAR: 'cuc-payments_buscar',
    PAYMENTS_VER: 'cuc-payments_ver',
    PAYMENTS_ELIMINAR: 'cuc-payments_eliminar',
    REPORT_GENERAL: 'cuc-report_general',
    REPORT_COBRADO: 'cuc-report_cobrado',
    REPORT_VENCIMIENTO: 'cuc-report_vencimiento',
    REPORT_CLIENTE: 'cuc-report_cliente',
  },

  // ─── INVENTARIO ──────────────────────────────────────────────────────────────
  INV: {
    MODULE: 'inv-module',
    REPORT_VALORADO: 'inv-report_valorado',
    REPORT_VALORADO_PRODUCTO: 'inv-report_valorado_producto',
    REPORT_KARDEX: 'inv-report_kardex',
    REPORT_UTILIDADES: 'inv-report_utilidades',
    REPORT_UTILIDADES_PRODUCTO: 'inv-report_utilidades_producto',
  },

  // ─── PRODUCTOS (prd-* — canonical after migration from pro-*) ────────────────
  PRD: {
    MODULE: 'prd-module',
    LIST: 'prd-list',
    CREATE: 'prd-create',
    EDIT: 'prd-edit',
    DELETE: 'prd-delete',
    REPORT_STOCK: 'prd-report-stock',
  },

  // ─── PROVEEDORES (pro-* — kept as-is; NOT renamed to prd-*) ─────────────────
  PRO: {
    MODULE: 'pro-module',
    LIST: 'pro-list',
    CREATE: 'pro-create',
    EDIT: 'pro-edit',
    DELETE: 'pro-delete',
    SET_TRANSFERS: 'pro-set_transfers',
    REPORT_GENERAL: 'pro-report_general',
  },

  // ─── CLIENTES ────────────────────────────────────────────────────────────────
  CLI: {
    MODULE: 'cli-module',
    LIST: 'cli-list',
    CREATE: 'cli-create',
    EDIT: 'cli-edit',
    DELETE: 'cli-delete',
    SET_TRANSFERS: 'cli-set_transfers',
    REPORT_GENERAL: 'cli-report_general',
  },

  // ─── EMPLEADOS ───────────────────────────────────────────────────────────────
  EMP: {
    CREATE: 'emp-create',
    EDIT: 'emp-edit',
  },

  // ─── USUARIOS ────────────────────────────────────────────────────────────────
  USU: {
    MODULE: 'usu-module',
    CREATE: 'usu-create',
    EDITAR: 'usu-editar',
    SET_ESTADO: 'usu-set_estado',
    SET_SUCURSALES: 'usu-set_sucursales',
    DELETE: 'usu-delete',
  },

  // ─── ARQUEO DE CAJA ──────────────────────────────────────────────────────────
  CAJ: {
    MODULE: 'caj-module',
    OPEN_SESSION: 'caj-open_session',
    CLOSE_SESSION: 'caj-close_session',
    LIST_SESSIONS: 'caj-list_sessions',
    VIEW_SESSION: 'caj-view_session',
    LIST_MOVEMENTS: 'caj-list_movements',
    CREATE_EXPENSE: 'caj-create_expense',
    EXPENSE_TYPES_LIST: 'caj-expense_types_list',
    EXPENSE_TYPES_CREATE: 'caj-expense_types_create',
    EXPENSE_TYPES_EDIT: 'caj-expense_types_edit',
    EXPENSE_TYPES_DELETE: 'caj-expense_types_delete',
  },

  // ─── SISTEMA / PARAMETRIZACIÓN ───────────────────────────────────────────────
  SIS: {
    MODULE: 'sis-module',
    ADM_CATEGORIAS: 'sis-adm_categorias',
    ADM_SUBCATEGORIAS: 'sis-adm_subcategorias',
    ADM_MARCAS: 'sis-adm_marcas',
    ADM_PROCEDENCIAS: 'sis-adm_procedencias',
    ADM_UNIDADES: 'sis-adm_unidades',
    ADM_MARCAS_VEHICULOS: 'sis-adm_marcas_vehiculos',
    ADM_SUCURSALES: 'sis-adm_sucursales',
    ADM_RESPONSABLES: 'sis-adm_responsables',
    ADM_PERMISOS: 'sis-adm_permisos',
  },

  // ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
  CON: {
    EDIT_PERFIL: 'con-edit_perfil',
    RESET_CLAVE: 'con-reset_clave',
    SET_SUCURSAL: 'con-set_sucursal',
    SET_RESPALDO: 'con-set_respaldo',
    SET_ROLES: 'con-set_roles',
    SET_PERMISOS: 'con-set_permisos',
  },

  // ─── PANEL DE CONTROL ────────────────────────────────────────────────────────
  PAN: {
    MODULE: 'pan-module',
    STATS_MINIMO: 'pan-stats_minimo',
    STATS_PROPORCION: 'pan-stats_proporcion',
    STATS_COTIZACIONES: 'pan-stats_cotizaciones',
  },
} as const;

/**
 * Utility type that extracts all leaf string values from a nested const object.
 * Used to derive the Permission union type from the PERMISSIONS object.
 *
 * @example
 * type Permission = Leaf<typeof PERMISSIONS>;
 * // → 'ven-module' | 'ven-list' | 'ven-create' | ... (all permission strings)
 */
type Leaf<T> = T extends string
  ? T
  : T extends object
  ? Leaf<T[keyof T]>
  : never;

/**
 * Union type of all valid permission strings derived from the PERMISSIONS object.
 *
 * Use this type to replace bare `string` in any function/hook that accepts
 * a permission name, ensuring compile-time safety against typos and
 * non-existent permission names.
 *
 * @example
 * // In hooks / components:
 * import type { Permission } from '@/lib/permissions';
 *
 * interface UsePermissionCheckOptions {
 *   permission: Permission; // was: string
 * }
 *
 * // Usage:
 * usePermissionCheck({ permission: PERMISSIONS.USU.CREATE, roles: ['Super Admin'] });
 */
export type Permission = Leaf<typeof PERMISSIONS>;
