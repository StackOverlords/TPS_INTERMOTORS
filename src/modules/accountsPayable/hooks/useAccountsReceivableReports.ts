import { useQuery, useMutation } from "@tanstack/react-query";
import { accountsReceivableReportService } from "../services/accountsReceivableReportService";
import type {
  AccountsReceivableGeneralFilters,
  AccountsReceivablePaidFilters,
  AccountsReceivableByCustomerFilters,
} from "../types/AccountsReceivableReport.types";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";

interface UseReportOptions<T> {
  filters: T;
  enabled?: boolean;
}

// ============================================================================
// Hooks para Reporte General
// ============================================================================

export function useGeneralReport({ filters, enabled = true }: UseReportOptions<AccountsReceivableGeneralFilters>) {
  return useQuery({
    queryKey: ["accounts-receivable-general-report", filters],
    queryFn: () => accountsReceivableReportService.getGeneralReport(filters),
    enabled: enabled && !!filters.fecha_inicio && !!filters.fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDownloadGeneralReport() {
  return useMutation({
    mutationFn: (filters: AccountsReceivableGeneralFilters) =>
      accountsReceivableReportService.downloadGeneralReport(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cuentas_por_cobrar_general_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte se descargó correctamente",
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el reporte",
      });
    },
  });
}

// ============================================================================
// Hooks para Reporte de Pagadas
// ============================================================================

export function usePaidReport({ filters, enabled = true }: UseReportOptions<AccountsReceivablePaidFilters>) {
  return useQuery({
    queryKey: ["accounts-receivable-paid-report", filters],
    queryFn: () => accountsReceivableReportService.getPaidReport(filters),
    enabled: enabled && !!filters.pago_fecha_ini && !!filters.pago_fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDownloadPaidReport() {
  return useMutation({
    mutationFn: (filters: AccountsReceivablePaidFilters) =>
      accountsReceivableReportService.downloadPaidReport(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cuentas_por_cobrar_pagadas_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte se descargó correctamente",
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el reporte",
      });
    },
  });
}

// ============================================================================
// Hooks para Reporte Por Cliente
// ============================================================================

export function useByCustomerReport({ filters, enabled = true }: UseReportOptions<AccountsReceivableByCustomerFilters>) {
  return useQuery({
    queryKey: ["accounts-receivable-by-customer-report", filters],
    queryFn: () => accountsReceivableReportService.getByCustomerReport(filters),
    enabled: enabled && !!filters.fecha_inicio && !!filters.fecha_fin && !!filters.cliente,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useDownloadByCustomerReport() {
  return useMutation({
    mutationFn: (filters: AccountsReceivableByCustomerFilters) =>
      accountsReceivableReportService.downloadByCustomerReport(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cuentas_por_cobrar_por_cliente_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccessToast({
        title: "Descarga exitosa",
        description: "El reporte se descargó correctamente",
      });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: "Error al descargar",
        description: error.message || "No se pudo descargar el reporte",
      });
    },
  });
}
