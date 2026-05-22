/**
 * Query keys for Transfer Requests
 *
 * Follows the same nested-object pattern used throughout the project.
 */
export const TRANSFER_REQUEST_QUERY_KEYS = {
  /** Base key for all transfer request queries */
  all: ["transfer-requests"] as const,

  /** Base key for all detail queries */
  details: () => [...TRANSFER_REQUEST_QUERY_KEYS.all, "detail"] as const,

  /**
   * Key for a specific transfer request by ID
   * @param id - Transfer request ID
   * @example TRANSFER_REQUEST_QUERY_KEYS.detail(42)
   */
  detail: (id: number) =>
    [...TRANSFER_REQUEST_QUERY_KEYS.details(), id] as const,

  /**
   * Key for the import data of a specific transfer request.
   * Separate from detail because import is a mutation that also transitions
   * request estado — distinct caching concern.
   * @param id - Transfer request ID
   * @example TRANSFER_REQUEST_QUERY_KEYS.importData(42)
   */
  importData: (id: number) =>
    [...TRANSFER_REQUEST_QUERY_KEYS.all, "import", id] as const,
};
