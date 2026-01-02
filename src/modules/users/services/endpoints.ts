export const USER_ENDPOINTS = {
  all: "/users",
  byNickName: (nickname: string) => `/users?pagina=1&pagina_registros=20&nickname=${nickname}`,
  byId: (id: number) => `/users/${id}`,
  create: "/users",
  update: (id: number) => `/users/${id}`,
  delete: (id: number) => `/users/${id}`,
  permissions: "/permissions/list",
  userPermissions: (userId: number) => `/users/permissions?usuario=${userId}`,
  updatePermissions: "/users/permissions",
} as const;
