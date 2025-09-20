export interface SelectOption {
  value: string | number;
  label: string;
}

export interface PurchaseType {
  [key: string]: string;
}

export interface PurchaseModality {
  [key: string]: string;
}

export interface ResponsibleData {
  id: number;
  nombre: string;
}

export interface ResponsiblesResponse {
  data: ResponsibleData[];
}

// Constantes para validaciones de formulario
export const PURCHASE_FORM_CONSTANTS = {
  MIN_COMPROBANTE_LENGTH: 1,
  MAX_COMPROBANTE_LENGTH: 50,
  MIN_COMENTARIO_LENGTH: 0,
  MAX_COMENTARIO_LENGTH: 500,
  REQUIRED_FIELDS: [
    'fecha',
    'nro_comprobante',
    'id_proveedor',
    'tipo_compra',
    'forma_compra',
    'id_responsable'
  ] as const,
} as const;
