export const BRANCH_ENDPOINTS = {
    all: "/branches",
    create: "/branches",
    byId: (id: string | number) => `/branches/${id}`,
    update: (id: string | number) => `/branches/${id}`,
    delete: (id: string | number) => `/branches/${id}`,
    // Users management
    getUsers: (branchId: string | number) => `/branches/actions/get_users/${branchId}`,
    addUser: (branchId: string | number) => `/branches/actions/add_user/${branchId}`,
    removeUser: (branchId: string | number, userId: string | number) => `/branches/actions/remove_user/${branchId}/${userId}`,
    getRoles: "/branches/commons/get_roles",
};
