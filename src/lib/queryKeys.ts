/**
 * QUERY KEYS CENTRALIZADAS - TPS INTERMOTORS
 *
 * Este archivo centraliza todas las query keys de TanStack Query del proyecto.
 *
 * BENEFICIOS:
 * - Evita hardcodear strings en múltiples lugares
 * - Previene errores de tipeo
 * - Facilita invalidaciones entre módulos
 * - Documentación centralizada
 * - Type safety con TypeScript
 *
 * USO:
 * ```typescript
 * import { SALES_QUERY_KEYS, PRODUCTS_QUERY_KEYS } from '@/lib/queryKeys';
 *
 * // En un hook de query:
 * useQuery({
 *   queryKey: SALES_QUERY_KEYS.detail(123),
 *   queryFn: () => getSaleById(123)
 * });
 *
 * // En una mutación para invalidar:
 * onSuccess: () => {
 *   queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.lists() });
 *   queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
 * }
 * ```
 */

// ========================================
// SALES MODULE (Ventas)
// ========================================

/**
 * Query keys para el módulo de Ventas
 *
 * Incluye:
 * - Listados paginados de ventas con filtros
 * - Detalles de ventas individuales
 * - Datos comunes (clientes, modalidades, tipos, responsables, métodos de pago)
 */
export const SALES_QUERY_KEYS = {
  /** Key base para todas las queries de ventas */
  all: ["sales"] as const,

  /** Key para todos los listados de ventas */
  lists: () => [...SALES_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de ventas con filtros específicos
   * @param filters - Filtros de búsqueda (fecha, cliente, estado, etc.)
   * @example SALES_QUERY_KEYS.list({ fecha_inicio: '2024-01-01' })
   */
  list: (filters?: any) => [...SALES_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de ventas */
  details: () => [...SALES_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una venta específica
   * @param id - ID de la venta
   * @example SALES_QUERY_KEYS.detail(123)
   */
  detail: (id: string | number) => [...SALES_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para datos comunes del módulo de Ventas
 *
 * Incluye catálogos y datos de referencia como clientes, modalidades, tipos, etc.
 * Estos datos suelen tener staleTime largo ya que no cambian frecuentemente.
 */
export const SALES_COMMONS_KEYS = {
  /** Key base para datos comunes de ventas */
  all: ["sales", "commons"] as const,

  /**
   * Key para listado de clientes
   * @param cliente - Texto de búsqueda opcional
   * @example SALES_COMMONS_KEYS.customers('Juan')
   */
  customers: (cliente?: string) =>
    [...SALES_COMMONS_KEYS.all, "customers", cliente ?? "all"] as const,

  /** Key para modalidades de venta (staleTime: Infinity) */
  modalities: () => [...SALES_COMMONS_KEYS.all, "modalities"] as const,

  /** Key para responsables de ventas (staleTime: 15 min) */
  responsibles: () => [...SALES_COMMONS_KEYS.all, "responsibles"] as const,

  /** Key para tipos de venta (staleTime: Infinity) */
  types: () => [...SALES_COMMONS_KEYS.all, "types"] as const,

  /** Key para tipos de pago (staleTime: Infinity) */
  paymentTypes: () => [...SALES_COMMONS_KEYS.all, "paymentTypes"] as const,
} as const;

// ========================================
// PRODUCTS MODULE (Productos)
// ========================================

/**
 * Query keys para el módulo de Productos
 *
 * Incluye:
 * - Listados paginados con filtros
 * - Detalles de productos
 * - Stock por sucursal
 * - Estadísticas de ventas
 * - Órdenes de proveedores
 */
export const PRODUCTS_QUERY_KEYS = {
  /** Key base para todas las queries de productos */
  all: ["products"] as const,

  /** Key para todos los listados de productos */
  lists: () => [...PRODUCTS_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de productos con filtros
   * @param filters - Filtros (marca, categoría, stock, etc.)
   * @example PRODUCTS_QUERY_KEYS.list({ marca: 'Toyota' })
   */
  list: (filters?: any) => [...PRODUCTS_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de productos */
  details: () => [...PRODUCTS_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un producto específico
   * @param id - ID del producto
   * @example PRODUCTS_QUERY_KEYS.detail(456)
   */
  detail: (id: string | number) => [...PRODUCTS_QUERY_KEYS.details(), id] as const,

  /**
   * Key para detalle de producto con información de stock
   * @param id - ID del producto
   * @example PRODUCTS_QUERY_KEYS.detailWithStock(456)
   */
  detailWithStock: (id: string | number) =>
    [...PRODUCTS_QUERY_KEYS.details(), "with-stock", id] as const,

  /**
   * Key para consultar stock de un producto
   * @param params - Parámetros (producto_id, sucursal_id, etc.)
   * @example PRODUCTS_QUERY_KEYS.stock({ producto_id: 456, sucursal_id: 1 })
   */
  stock: (params: any) => [...PRODUCTS_QUERY_KEYS.all, "stock", params] as const,
  stockInModalProducs: (params: any) => [...PRODUCTS_QUERY_KEYS.all, "product-stock", params] as const,

  /**
   * Key para estadísticas de ventas de un producto
   * @param params - Parámetros de consulta
   * @example PRODUCTS_QUERY_KEYS.salesStats({ producto_id: 456 })
   */
  salesStats: (params: any) => [...PRODUCTS_QUERY_KEYS.all, "sales-stats", params] as const,

  /**
   * Key para órdenes de proveedor de un producto
   * @param params - Parámetros de consulta
   * @example PRODUCTS_QUERY_KEYS.providerOrders({ producto_id: 456 })
   */
  providerOrders: (params: any) =>
    [...PRODUCTS_QUERY_KEYS.all, "provider-orders", params] as const,
} as const;

// ========================================
// QUOTATIONS MODULE (Cotizaciones)
// ========================================

/**
 * Query keys para el módulo de Cotizaciones
 *
 * Incluye:
 * - Listados paginados de cotizaciones
 * - Detalles de cotizaciones
 * - Generación de PDFs
 */
export const QUOTATIONS_QUERY_KEYS = {
  /** Key base para todas las queries de cotizaciones */
  all: ["quotations"] as const,

  /** Key para todos los listados de cotizaciones */
  lists: () => [...QUOTATIONS_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de cotizaciones con filtros
   * @param filters - Filtros de búsqueda
   * @example QUOTATIONS_QUERY_KEYS.list({ estado: 'pendiente' })
   */
  list: (filters?: any) => [...QUOTATIONS_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de cotizaciones */
  details: () => [...QUOTATIONS_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una cotización específica
   * @param id - ID de la cotización
   * @example QUOTATIONS_QUERY_KEYS.detail(789)
   */
  detail: (id: string | number) => [...QUOTATIONS_QUERY_KEYS.details(), id] as const,

  /**
   * Key para PDF de cotización (staleTime: 0, gcTime: 0)
   * @param id - ID de la cotización
   * @example QUOTATIONS_QUERY_KEYS.pdf(789)
   */
  pdf: (id: string | number) => [...QUOTATIONS_QUERY_KEYS.all, "pdf", id] as const,
} as const;

// ========================================
// ORDERS MODULE (Pedidos)
// ========================================

/**
 * Query keys para el módulo de Pedidos a Proveedores
 *
 * Incluye:
 * - Listados paginados de pedidos
 * - Detalles de pedidos individuales
 */
export const ORDER_QUERY_KEYS = {
  /** Key base para todas las queries de pedidos */
  all: ["orders"] as const,

  /** Key para todos los listados de pedidos */
  lists: () => [...ORDER_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de pedidos con filtros
   * @param filters - Filtros de búsqueda
   * @example ORDER_QUERY_KEYS.list({ estado: 'pendiente' })
   */
  list: (filters?: any) => [...ORDER_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de pedidos */
  details: () => [...ORDER_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un pedido específico
   * @param id - ID del pedido
   * @example ORDER_QUERY_KEYS.detail(111)
   */
  detail: (id: string | number) => [...ORDER_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para datos comunes del módulo de Pedidos
 *
 * Catálogos: tipos, modalidades, estados, responsables, proveedores
 */
export const ORDER_COMMONS_KEYS = {
  /** Key base para datos comunes de pedidos */
  all: ["orders", "commons"] as const,

  /** Key para tipos de pedido (staleTime: Infinity) */
  types: () => [...ORDER_COMMONS_KEYS.all, "types"] as const,

  /** Key para modalidades de pedido (staleTime: Infinity) */
  modalities: () => [...ORDER_COMMONS_KEYS.all, "modalities"] as const,

  /** Key para estados de pedido (staleTime: Infinity) */
  status: () => [...ORDER_COMMONS_KEYS.all, "status"] as const,

  /** Key para responsables de pedidos (staleTime: 15 min) */
  responsibles: () => [...ORDER_COMMONS_KEYS.all, "responsibles"] as const,

  /**
   * Key para proveedores
   * @param proveedor - Texto de búsqueda opcional
   * @example ORDER_COMMONS_KEYS.providers('Toyota')
   */
  providers: (proveedor?: string) =>
    [...ORDER_COMMONS_KEYS.all, "providers", proveedor ?? "all"] as const,
} as const;

// ========================================
// PURCHASES MODULE (Compras)
// ========================================

/**
 * Query keys para el módulo de Compras
 *
 * Incluye:
 * - Listados paginados de compras
 * - Detalles de compras individuales
 */
export const PURCHASES_QUERY_KEYS = {
  /** Key base para todas las queries de compras */
  all: ["purchases"] as const,

  /** Key para todos los listados de compras */
  lists: () => [...PURCHASES_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de compras con filtros
   * @param filters - Filtros de búsqueda
   * @example PURCHASES_QUERY_KEYS.list({ fecha_inicio: '2024-01-01' })
   */
  list: (filters?: any) => [...PURCHASES_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de compras */
  details: () => [...PURCHASES_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una compra específica
   * @param id - ID de la compra
   * @example PURCHASES_QUERY_KEYS.detail(222)
   */
  detail: (id: string | number) => [...PURCHASES_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para datos comunes del módulo de Compras
 */
export const PURCHASE_COMMONS_KEYS = {
  /** Key base para datos comunes de compras */
  all: ["purchases", "commons"] as const,

  /** Key para tipos de compra (staleTime: Infinity) */
  types: () => [...PURCHASE_COMMONS_KEYS.all, "types"] as const,

  /** Key para modalidades de compra (staleTime: Infinity) */
  modalities: () => [...PURCHASE_COMMONS_KEYS.all, "modalities"] as const,

  /** Key para responsables de compras (staleTime: 15 min) */
  responsibles: () => [...PURCHASE_COMMONS_KEYS.all, "responsibles"] as const,

  /** Key para proveedores (staleTime: 15 min) */
  providers: () => [...PURCHASE_COMMONS_KEYS.all, "providers"] as const,
} as const;

// ========================================
// TRANSFERS MODULE (Transferencias)
// ========================================

/**
 * Query keys para el módulo de Transferencias entre Sucursales
 *
 * Incluye:
 * - Listados de transferencias
 * - Detalles de transferencias
 */
export const TRANSFER_QUERY_KEYS = {
  /** Key base para todas las queries de transferencias */
  all: ["transfers"] as const,

  /** Key para todos los listados de transferencias */
  lists: () => [...TRANSFER_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de transferencias con filtros
   * @param filters - Filtros de búsqueda
   * @example TRANSFER_QUERY_KEYS.list({ estado: 'enviado' })
   */
  list: (filters?: any) => [...TRANSFER_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de transferencias */
  details: () => [...TRANSFER_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una transferencia específica
   * @param id - ID de la transferencia
   * @example TRANSFER_QUERY_KEYS.detail(333)
   */
  detail: (id: number) => [...TRANSFER_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para datos comunes del módulo de Transferencias
 */
export const TRANSFER_COMMONS_QUERY_KEYS = {
  /** Key base para datos comunes de transferencias */
  all: ["transfers", "commons"] as const,

  /** Key para responsables de transferencias (staleTime: 15 min) */
  responsibles: () => [...TRANSFER_COMMONS_QUERY_KEYS.all, "responsibles"] as const,

  /**
   * Key para sucursales disponibles para transferencia
   * @param branchId - ID de la sucursal origen
   * @example TRANSFER_COMMONS_QUERY_KEYS.branches(1)
   */
  branches: (branchId: number) =>
    [...TRANSFER_COMMONS_QUERY_KEYS.all, "branches", branchId] as const,
} as const;

// ========================================
// RETURNS MODULE (Devoluciones)
// ========================================

/**
 * Query keys para el módulo de Devoluciones
 *
 * Incluye:
 * - Listados de devoluciones
 * - Detalles de devoluciones
 */
export const RETURN_QUERY_KEYS = {
  /** Key base para todas las queries de devoluciones */
  all: ["returns"] as const,

  /** Key para todos los listados de devoluciones */
  lists: () => [...RETURN_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de devoluciones con filtros
   * @param filters - Filtros de búsqueda
   * @example RETURN_QUERY_KEYS.list({ tipo: 'cliente' })
   */
  list: (filters?: any) => [...RETURN_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de devoluciones */
  details: () => [...RETURN_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una devolución específica
   * @param id - ID de la devolución
   * @example RETURN_QUERY_KEYS.detail(444)
   */
  detail: (id: string | number) => [...RETURN_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para datos comunes del módulo de Devoluciones
 */
export const RETURN_COMMONS_KEYS = {
  /** Key base para datos comunes de devoluciones */
  all: ["returns", "commons"] as const,

  /** Key para tipos de devolución (staleTime: Infinity) */
  types: () => [...RETURN_COMMONS_KEYS.all, "types"] as const,

  /** Key para responsables de devoluciones (staleTime: 15 min) */
  responsibles: () => [...RETURN_COMMONS_KEYS.all, "responsibles"] as const,
} as const;

// ========================================
// CUSTOMERS MODULE (Clientes)
// ========================================

/**
 * Query keys para el módulo de Clientes
 *
 * Incluye:
 * - Listados de clientes
 * - Detalles de clientes individuales
 */
export const CUSTOMERS_QUERY_KEYS = {
  /** Key base para todas las queries de clientes */
  all: ["customers"] as const,

  /** Key para todos los listados de clientes */
  lists: () => [...CUSTOMERS_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de clientes con filtros
   * @param filters - Filtros de búsqueda
   * @example CUSTOMERS_QUERY_KEYS.list({ nombre: 'Juan' })
   */
  list: (filters?: any) => [...CUSTOMERS_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de clientes */
  details: () => [...CUSTOMERS_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un cliente específico
   * @param id - ID del cliente
   * @example CUSTOMERS_QUERY_KEYS.detail(555)
   */
  detail: (id: string | number) => [...CUSTOMERS_QUERY_KEYS.details(), id] as const,
} as const;

// ========================================
// USERS MODULE (Usuarios)
// ========================================

/**
 * Query keys para el módulo de Usuarios
 *
 * Incluye:
 * - Listados de usuarios
 * - Detalles de usuarios
 */
export const USERS_QUERY_KEYS = {
  /** Key base para todas las queries de usuarios */
  all: ["users"] as const,

  /** Key para todos los listados de usuarios */
  lists: () => [...USERS_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de usuarios con filtros
   * @param filters - Filtros de búsqueda
   * @example USERS_QUERY_KEYS.list({ activo: true })
   */
  list: (filters?: any) => [...USERS_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de usuarios */
  details: () => [...USERS_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un usuario específico por nickname
   * @param nickname - Nickname del usuario
   * @example USERS_QUERY_KEYS.detail('johndoe')
   */
  detail: (nickname: string) => [...USERS_QUERY_KEYS.details(), nickname] as const,
} as const;

/**
 * Query keys para el módulo de Permisos de Usuarios
 */
export const PERMISSIONS_QUERY_KEYS = {
  /** Key base para todas las queries de permisos */
  all: ["permissions"] as const,

  /** Key para todos los permisos disponibles (staleTime: 10 min) */
  lists: () => [...PERMISSIONS_QUERY_KEYS.all] as const,

  /**
   * Key para permisos de un usuario específico
   * @param userId - ID del usuario
   * @example PERMISSIONS_QUERY_KEYS.userPermissions(123)
   */
  userPermissions: (userId: number) =>
    [...PERMISSIONS_QUERY_KEYS.all, "user", userId] as const,
} as const;

// ========================================
// ACCOUNTS PAYABLE MODULE (Cuentas por Pagar)
// ========================================

/**
 * Query keys para el módulo de Cuentas por Pagar
 *
 * Incluye:
 * - Listados de cuentas por pagar
 * - Pagos realizados
 * - Tipos de pago y vencimiento
 */
export const ACCOUNTS_PAYABLE_QUERY_KEYS = {
  /** Key base para todas las queries de cuentas por pagar */
  all: ["accountsPayable"] as const,

  /** Key para todos los listados de cuentas por pagar */
  lists: () => [...ACCOUNTS_PAYABLE_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de cuentas por pagar con filtros
   * @param filters - Filtros de búsqueda
   * @example ACCOUNTS_PAYABLE_QUERY_KEYS.list({ estado: 'pendiente' })
   */
  list: (filters?: any) => [...ACCOUNTS_PAYABLE_QUERY_KEYS.lists(), { filters }] as const,

  /**
   * Key para pagos de una venta específica
   * @param saleId - ID de la venta
   * @param filters - Filtros adicionales
   * @example ACCOUNTS_PAYABLE_QUERY_KEYS.payments(123, {})
   */
  payments: (saleId: number, filters?: any) =>
    [...ACCOUNTS_PAYABLE_QUERY_KEYS.all, "payments", saleId, { filters }] as const,

  /** Key para tipos de pago (staleTime: 1 hora) */
  paymentTypes: () => [...ACCOUNTS_PAYABLE_QUERY_KEYS.all, "paymentTypes"] as const,

  /** Key para tipos de vencimiento (staleTime: 1 hora) */
  termTypes: () => [...ACCOUNTS_PAYABLE_QUERY_KEYS.all, "termTypes"] as const,
} as const;

// ========================================
// BRANCHES MODULE (Sucursales)
// ========================================

/**
 * Query keys para el módulo de Sucursales
 *
 * Incluye:
 * - Listados de sucursales
 * - Detalles de sucursales
 * - Usuarios por sucursal
 * - Roles de sucursal
 */
export const BRANCH_QUERY_KEYS = {
  /** Key base para todas las queries de sucursales */
  all: ["branches"] as const,

  /** Key para todos los listados de sucursales */
  lists: () => [...BRANCH_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de sucursales con filtros
   * @param filters - Filtros de búsqueda
   * @example BRANCH_QUERY_KEYS.list({ activo: true })
   */
  list: (filters?: any) => [...BRANCH_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de sucursales */
  details: () => [...BRANCH_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una sucursal específica
   * @param id - ID de la sucursal
   * @example BRANCH_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...BRANCH_QUERY_KEYS.details(), id] as const,

  /** Key base para usuarios de sucursales */
  users: () => [...BRANCH_QUERY_KEYS.all, "users"] as const,

  /**
   * Key para usuarios de una sucursal específica
   * @param branchId - ID de la sucursal
   * @example BRANCH_QUERY_KEYS.branchUsers(1)
   */
  branchUsers: (branchId: string | number) =>
    [...BRANCH_QUERY_KEYS.users(), branchId] as const,

  /** Key para roles de sucursal (staleTime: 15 min) */
  roles: () => [...BRANCH_QUERY_KEYS.all, "roles"] as const,
} as const;

// ========================================
// SETTINGS - MAESTROS (Marcas, Categorías, etc.)
// ========================================

/**
 * Query keys para el módulo de Marcas de Productos
 */
export const BRAND_QUERY_KEYS = {
  /** Key base para todas las queries de marcas */
  all: ["brands"] as const,

  /** Key para todos los listados de marcas */
  lists: () => [...BRAND_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de marcas con filtros
   * @param filters - Filtros de búsqueda
   * @example BRAND_QUERY_KEYS.list({ nombre: 'Toyota' })
   */
  list: (filters?: any) => [...BRAND_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de marcas */
  details: () => [...BRAND_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una marca específica
   * @param id - ID de la marca
   * @example BRAND_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...BRAND_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Categorías de Productos
 */
export const CATEGORY_QUERY_KEYS = {
  /** Key base para todas las queries de categorías */
  all: ["categories"] as const,

  /** Key para todos los listados de categorías */
  lists: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de categorías con filtros
   * @param filters - Filtros de búsqueda
   * @example CATEGORY_QUERY_KEYS.list({ activo: true })
   */
  list: (filters?: any) => [...CATEGORY_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de categorías */
  details: () => [...CATEGORY_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una categoría específica
   * @param id - ID de la categoría
   * @example CATEGORY_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Unidades de Medida
 */
export const MEASUREMENT_QUERY_KEYS = {
  /** Key base para todas las queries de unidades de medida */
  all: ["measurements"] as const,

  /** Key para todos los listados de medidas */
  lists: () => [...MEASUREMENT_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de medidas con filtros
   * @param filters - Filtros de búsqueda
   * @example MEASUREMENT_QUERY_KEYS.list({})
   */
  list: (filters?: any) => [...MEASUREMENT_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de medidas */
  details: () => [...MEASUREMENT_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una medida específica
   * @param id - ID de la medida
   * @example MEASUREMENT_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...MEASUREMENT_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Procedencias/Orígenes
 */
export const ORIGIN_QUERY_KEYS = {
  /** Key base para todas las queries de orígenes */
  all: ["origins"] as const,

  /** Key para todos los listados de orígenes */
  lists: () => [...ORIGIN_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de orígenes con filtros
   * @param filters - Filtros de búsqueda
   * @example ORIGIN_QUERY_KEYS.list({})
   */
  list: (filters?: any) => [...ORIGIN_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de orígenes */
  details: () => [...ORIGIN_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un origen específico
   * @param id - ID del origen
   * @example ORIGIN_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...ORIGIN_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Subcategorías de Productos
 */
export const SUBCATEGORY_QUERY_KEYS = {
  /** Key base para todas las queries de subcategorías */
  all: ["subcategories"] as const,

  /** Key para todos los listados de subcategorías */
  lists: () => [...SUBCATEGORY_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de subcategorías con filtros
   * @param filters - Filtros de búsqueda
   * @example SUBCATEGORY_QUERY_KEYS.list({ categoria_id: 1 })
   */
  list: (filters?: any) => [...SUBCATEGORY_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de subcategorías */
  details: () => [...SUBCATEGORY_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una subcategoría específica
   * @param id - ID de la subcategoría
   * @example SUBCATEGORY_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...SUBCATEGORY_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Marcas de Vehículos
 */
export const VEHICLE_BRAND_QUERY_KEYS = {
  /** Key base para todas las queries de marcas de vehículos */
  all: ["vehicleBrands"] as const,

  /** Key para todos los listados de marcas de vehículos */
  lists: () => [...VEHICLE_BRAND_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de marcas de vehículos con filtros
   * @param filters - Filtros de búsqueda
   * @example VEHICLE_BRAND_QUERY_KEYS.list({ nombre: 'Toyota' })
   */
  list: (filters?: any) => [...VEHICLE_BRAND_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de marcas de vehículos */
  details: () => [...VEHICLE_BRAND_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de una marca de vehículo específica
   * @param id - ID de la marca
   * @example VEHICLE_BRAND_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...VEHICLE_BRAND_QUERY_KEYS.details(), id] as const,
} as const;

/**
 * Query keys para el módulo de Proveedores
 */
export const PROVIDER_QUERY_KEYS = {
  /** Key base para todas las queries de proveedores */
  all: ["providers"] as const,

  /** Key para todos los listados de proveedores */
  lists: () => [...PROVIDER_QUERY_KEYS.all, "list"] as const,

  /**
   * Key para listado de proveedores con filtros
   * @param filters - Filtros de búsqueda
   * @example PROVIDER_QUERY_KEYS.list({ nombre: 'Distribuidora' })
   */
  list: (filters?: any) => [...PROVIDER_QUERY_KEYS.lists(), { filters }] as const,

  /** Key base para detalles de proveedores */
  details: () => [...PROVIDER_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key para detalle de un proveedor específico
   * @param id - ID del proveedor
   * @example PROVIDER_QUERY_KEYS.detail(1)
   */
  detail: (id: string | number) => [...PROVIDER_QUERY_KEYS.details(), id] as const,
} as const;

// ========================================
// SHARED MODULE (Datos Comunes/Compartidos)
// ========================================

/**
 * Query keys para datos compartidos/comunes usados en múltiples módulos
 *
 * Incluye catálogos de referencia como categorías, marcas, medidas, etc.
 * que se usan en selects y autocompletes en todo el sistema.
 *
 * Nota: Estos datos tienen staleTime de 15 minutos ya que no cambian frecuentemente.
 */
export const SHARED_QUERY_KEYS = {
  /** Key base para todas las queries de datos compartidos */
  all: ["shared"] as const,

  /**
   * Key para categorías con subcategorías (staleTime: 15 min)
   * @param name - Nombre de categoría para filtrar
   * @example SHARED_QUERY_KEYS.categoriesWithSubcategories('Motor')
   */
  categoriesWithSubcategories: (name?: string) =>
    [...SHARED_QUERY_KEYS.all, "categories-with-subcategories", name ?? "all"] as const,

  /**
   * Key para marcas comunes (staleTime: 15 min)
   * @param marca - Nombre de marca para filtrar
   * @example SHARED_QUERY_KEYS.commonBrands('Toyota')
   */
  commonBrands: (marca?: string) =>
    [...SHARED_QUERY_KEYS.all, "common-brands", marca ?? "all"] as const,

  /**
   * Key para unidades de medida comunes (staleTime: 15 min)
   * @param unidad - Unidad para filtrar
   * @example SHARED_QUERY_KEYS.commonMeasurements('KG')
   */
  commonMeasurements: (unidad?: string) =>
    [...SHARED_QUERY_KEYS.all, "common-measurements", unidad ?? "all"] as const,

  /**
   * Key para procedencias/orígenes comunes (staleTime: 15 min)
   * @param procedencia - Procedencia para filtrar
   * @example SHARED_QUERY_KEYS.commonOrigins('Nacional')
   */
  commonOrigins: (procedencia?: string) =>
    [...SHARED_QUERY_KEYS.all, "common-origins", procedencia ?? "all"] as const,

  /**
   * Key para subcategorías comunes (staleTime: 15 min)
   * @param subcategoria - Nombre de subcategoría
   * @param categoria - ID de categoría para filtrar
   * @example SHARED_QUERY_KEYS.commonSubcategories('Filtros', 1)
   */
  commonSubcategories: (subcategoria?: string, categoria?: number) =>
    [...SHARED_QUERY_KEYS.all, "common-subcategories", subcategoria ?? "all", categoria ?? "all"] as const,

  /**
   * Key para marcas de vehículos comunes (staleTime: 15 min)
   * @param marca - Marca de vehículo para filtrar
   * @example SHARED_QUERY_KEYS.commonVehicleBrands('Toyota')
   */
  commonVehicleBrands: (marca?: string) =>
    [...SHARED_QUERY_KEYS.all, "common-vehicle-brands", marca ?? "all"] as const,
} as const;

// ========================================
// LOCATION MODULE (Países, Estados, Ciudades)
// ========================================

/**
 * Query keys para datos de ubicación geográfica
 *
 * Incluye países, estados/departamentos y ciudades
 * Usados en formularios de clientes, proveedores, sucursales, etc.
 */
export const LOCATION_QUERY_KEYS = {
  /** Key base para todas las queries de ubicación */
  all: ["location"] as const,

  /** Key para países (staleTime: 1 hora) */
  countries: () => [...LOCATION_QUERY_KEYS.all, "countries"] as const,

  /**
   * Key para estados/departamentos de un país (staleTime: 30 min)
   * @param countryId - ID del país
   * @example LOCATION_QUERY_KEYS.states(1)
   */
  states: (countryId: number) => [...LOCATION_QUERY_KEYS.all, "states", countryId] as const,

  /**
   * Key para ciudades de un estado (staleTime: 30 min)
   * @param stateId - ID del estado/departamento
   * @example LOCATION_QUERY_KEYS.cities(10)
   */
  cities: (stateId: number) => [...LOCATION_QUERY_KEYS.all, "cities", stateId] as const,
} as const;

// ========================================
// VIEW CONFIG MODULE (Configuración de Vistas)
// ========================================

/**
 * Query keys para configuración de vistas de usuario
 *
 * Incluye:
 * - Configuración de organización (columnas visibles, orden, etc.)
 * - Configuración de usuario (preferencias personales)
 */
export const VIEW_CONFIG_QUERY_KEYS = {
  /** Key base para todas las queries de configuración de vista */
  all: ["view-config"] as const,

  /**
   * Key para configuración de organización de una vista (staleTime: 5 min)
   * @param viewId - ID de la vista
   * @example VIEW_CONFIG_QUERY_KEYS.organization('sales-list')
   */
  organization: (viewId: string) =>
    [...VIEW_CONFIG_QUERY_KEYS.all, "organization", viewId] as const,

  /**
   * Key para configuración de usuario de una vista
   * @param viewId - ID de la vista
   * @param userName - Nombre del usuario
   * @example VIEW_CONFIG_QUERY_KEYS.user('sales-list', 'johndoe')
   */
  user: (viewId: string, userName?: string) =>
    [...VIEW_CONFIG_QUERY_KEYS.all, "user", viewId, userName ?? "anonymous"] as const,

  /** Key para todas las configuraciones de usuario */
  allUserConfigs: () => [...VIEW_CONFIG_QUERY_KEYS.all, "user"] as const,
} as const;

// ========================================
// AUTH MODULE (Autenticación)
// ========================================

/**
 * Query keys para el módulo de Autenticación
 */
export const AUTH_QUERY_KEYS = {
  /** Key para datos de autenticación del usuario actual */
  auth: ["auth"] as const,
} as const;

// ========================================
// HELPER: INVALIDACIONES COMUNES
// ========================================

/**
 * Helpers para invalidaciones comunes entre módulos
 *
 * Úsalos cuando una acción afecte múltiples entidades.
 *
 * @example
 * // Después de crear una venta:
 * onSuccess: () => {
 *   invalidateAfterSaleChange(queryClient);
 * }
 */
export const INVALIDATION_HELPERS = {
  /**
   * Invalida queries después de cambios en ventas
   * Afecta: sales, products (stock cambia)
   */
  invalidateAfterSaleChange: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
  },

  /**
   * Invalida queries después de cambios en productos
   * Afecta: products, sales-stats, stock
   */
  invalidateAfterProductChange: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
  },

  /**
   * Invalida queries después de cambios en compras
   * Afecta: purchases, products (precio/stock puede cambiar)
   */
  invalidateAfterPurchaseChange: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
  },

  /**
   * Invalida queries después de cambios en transferencias
   * Afecta: transfers, products (stock en sucursales cambia)
   */
  invalidateAfterTransferChange: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: TRANSFER_QUERY_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
  },

  /**
   * Invalida queries después de cambios en devoluciones
   * Afecta: returns, products, sales
   */
  invalidateAfterReturnChange: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: RETURN_QUERY_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all });
    queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.lists() });
  },
} as const;
