import type { BranchFilters } from "../types/branch.types";

export const BRANCH_QUERY_KEYS = {
  all: ["branches"] as const,
  lists: () => [...BRANCH_QUERY_KEYS.all, "list"] as const,
  list: (filters?: BranchFilters) =>
    [...BRANCH_QUERY_KEYS.lists(), { filters }] as const,

  details: () => [...BRANCH_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string | number) =>
    [...BRANCH_QUERY_KEYS.details(), id] as const,

  users: () => [...BRANCH_QUERY_KEYS.all, "users"] as const,
  branchUsers: (branchId: string | number) =>
    [...BRANCH_QUERY_KEYS.users(), branchId] as const,

  roles: () => [...BRANCH_QUERY_KEYS.all, "roles"] as const,
};
