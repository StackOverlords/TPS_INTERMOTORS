import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import {
  KpisResponseSchema,
  AlertasResponseSchema,
  FeedResponseSchema,
} from "../schemas/dashboard.schema";
import type {
  KpisResponse,
  AlertasResponse,
  FeedResponse,
  DashboardKpisParams,
  DashboardScopeParams,
} from "../types/dashboard.types";

const MODULE_NAME = "DASHBOARD_SERVICE";

/**
 * Fetch KPIs for the given sucursal and date range.
 *
 * GET /dashboard/kpis?sucursal_id=&fecha_inicio=&fecha_fin=
 * Response envelope: { data: KpisResponse }
 */
export const getKpis = async (params: DashboardKpisParams): Promise<KpisResponse> => {
  Logger.info("Fetching dashboard KPIs", { params }, MODULE_NAME);

  const response = await ApiService.get(
    "/dashboard/kpis",
    KpisResponseSchema,
    {
      params: {
        sucursal_id: params.sucursalId,
        ...(params.fechaInicio !== undefined && { fecha_inicio: params.fechaInicio }),
        ...(params.fechaFin !== undefined && { fecha_fin: params.fechaFin }),
      },
    },
    { unwrapData: true },
  );

  Logger.info("Dashboard KPIs fetched successfully", {}, MODULE_NAME);
  return response;
};

/**
 * Fetch dashboard alertas for the given sucursal.
 *
 * GET /dashboard/alertas?sucursal_id=
 * Response envelope: { data: AlertasResponse }
 */
export const getAlertas = async (params: DashboardScopeParams): Promise<AlertasResponse> => {
  Logger.info("Fetching dashboard alertas", { params }, MODULE_NAME);

  const response = await ApiService.get(
    "/dashboard/alertas",
    AlertasResponseSchema,
    {
      params: {
        sucursal_id: params.sucursalId,
      },
    },
    { unwrapData: true },
  );

  Logger.info("Dashboard alertas fetched successfully", {}, MODULE_NAME);
  return response;
};

/**
 * Fetch the real-time sales feed for the given sucursal.
 *
 * GET /dashboard/feed?sucursal_id=
 * Response envelope: { data: { ventas_hoy: FeedItem[] } }
 */
export const getFeed = async (params: DashboardScopeParams): Promise<FeedResponse> => {
  Logger.info("Fetching dashboard feed", { params }, MODULE_NAME);

  const response = await ApiService.get(
    "/dashboard/feed",
    FeedResponseSchema,
    {
      params: {
        sucursal_id: params.sucursalId,
      },
    },
    { unwrapData: true },
  );

  Logger.info("Dashboard feed fetched successfully", {}, MODULE_NAME);
  return response;
};
