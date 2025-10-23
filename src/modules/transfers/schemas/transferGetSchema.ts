import { paginatedResponseSchema } from "@/modules/shared/schemas/paginatedResponse.schema";
import { z } from "zod";

// Schema para responsable
const ResponsableSchema = z.object({
    id: z.number(),
    nombre: z.string(),
    apellido_paterno: z.string().nullable(),
    apellido_materno: z.string().nullable(),
    dni: z.number().nullable(),
    celular: z.string().nullable(),
});

// Schema para transferencia en lista
export const TransferGetAllSchema = z.object({
    id: z.number(),
    nro_transferencia: z.string(),
    fecha: z.string(),
    comprobante: z.string().nullable(),
    responsable: ResponsableSchema.nullable(),
    total: z.number(),
    comentarios: z.string().nullable(),
    estado: z.string(),
    fecha_recepcion: z.string().nullable(),
});

// Schema para respuesta paginada
export const TransfersGetAllSchema = paginatedResponseSchema(TransferGetAllSchema);

// Schemas para detalle de transferencia
const CategoriaSchema = z.object({
    id: z.number(),
    categoria: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
    version: z.number().optional(),
});

const SubcategoriaSchema = z.object({
    id: z.number(),
    subcategoria: z.string(),
    id_categoria: z.number(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

const MarcaSchema = z.object({
    id: z.number(),
    marca: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

const ProcedenciaSchema = z.object({
    id: z.number(),
    procedencia: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

const UnidadMedidaSchema = z.object({
    id: z.number(),
    unidad_medida: z.string(),
    id_estado: z.string(),
    codigo_interno: z.number(),
});

const MarcaVehiculoSchema = z.object({
    id: z.number(),
    marca_vehiculo: z.string(),
    codigo_interno: z.number(),
    id_estado: z.string(),
});

const ProductoDetalleSchema = z.object({
    id: z.number(),
    codigo_interno: z.number(),
    descripcion: z.string(),
    descripcion_alt: z.string().nullable(),
    codigo_oem: z.string().nullable(),
    codigo_upc: z.string().nullable(),
    modelo: z.string().nullable(),
    medida: z.string().nullable(),
    nro_motor: z.string().nullable(),
    id_categoria: z.number(),
    categoria: CategoriaSchema.nullable(),
    id_subcategora: z.number().nullable(),
    subcategoria: SubcategoriaSchema.nullable(),
    id_marca: z.number(),
    marca: MarcaSchema,
    id_procedencia: z.number(),
    procedencia: ProcedenciaSchema,
    id_unidad_medida: z.number(),
    unidad_medida: UnidadMedidaSchema,
    costo_referencia: z.string(),
    stock_minimo: z.string(),
    precio_venta: z.string(),
    precio_venta_alt: z.string(),
    id_marca_vehiculo: z.number(),
    marca_vehiculo: MarcaVehiculoSchema,
});

export const TransferDetailGetByIdSchema = z.object({
    id: z.number(),
    producto: ProductoDetalleSchema,
    cantidad: z.string(),
    costo_entrada: z.string(),
    precio_salida: z.string(),
    precio_entrada_venta: z.string(),
    precio_entrada_venta_alt: z.string(),
    monenda: z.string(),
});

export const TransferGetByIdSchema = z.object({
    id: z.number(),
    fecha: z.string(),
    nro: z.number(),
    nro_completo: z.string(),
    nro_comprobante: z.string().nullable(),
    responsable: ResponsableSchema.nullable(),
    comentarios: z.string().nullable(),
    sucursal_origen_id: z.number(),
    sucursal_origen_nombre: z.string(),
    sucursal_destino_id: z.number(),
    sucursal_destino_nombre: z.string(),
    fecha_recepcion: z.string().nullable(),
    estado: z.string(),
    cantidad_detalles: z.number(),
    detalles: z.array(TransferDetailGetByIdSchema),
});
