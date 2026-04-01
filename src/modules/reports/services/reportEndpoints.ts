export const REPORT_ENDPOINTS = {
  sales: {
    general: "/sales/reports/general",
    masVendido: "/sales/reports/masvendido",
    mayorIngreso: "/sales/reports/mayoringreso",
  },
  products: {
    kardex: "/products/reports/kardex",
  },
  orders: {
    general: "/placeorders/reports/general",
    topProveedores: "/placeorders/reports/top-proveedores",
    tiempoMedio: "/placeorders/reports/tiempo-medio",
  },
  purchases: {
    general: "/purchases/reports/general",
    masComprado: "/purchases/reports/mascomprado",
    mayorCosto: "/purchases/reports/mayorcosto",
  },
} as const;
