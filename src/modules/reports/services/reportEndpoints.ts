export const REPORT_ENDPOINTS = {
  sales: {
    general: '/sales/reports/general',
    masVendido: '/sales/reports/masvendido',
    mayorIngreso: '/sales/reports/mayoringreso',
  },
  products:{
    kardex: '/products/reports/kardex',
  }
} as const;