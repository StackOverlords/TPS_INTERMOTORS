export const CATEGORY_ENDPOINTS = {
    all: "/categories",
    create: "/categories",
    byId: (categoria: string | number) => `/categories/${categoria}`,
    update: (id_categoria: string | number) => `/categories/${id_categoria}`,
    delete: (id_categoria: string | number) => `/categories/${id_categoria}`,
    syncPreview: (id_categoria: string | number) => `/categories/commons/sync-preview/${id_categoria}`,
};