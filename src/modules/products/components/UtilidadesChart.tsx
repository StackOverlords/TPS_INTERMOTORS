import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { UtilidadesItem } from "../types/UtilidadesReport.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { DollarSign, TrendingUp, TrendingDown, Package } from "lucide-react";

interface UtilidadesChartProps {
  data: UtilidadesItem[];
  limit?: number; // Cantidad de productos a mostrar
}

// Tooltip personalizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const utilidad = parseFloat(data.utilidad.toString());
    const margen =
      parseFloat(data.importe_venta.toString()) > 0
        ? (utilidad / parseFloat(data.importe_venta.toString())) * 100
        : 0;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[250px]">
        <div className="font-semibold text-sm mb-2 truncate" title={data.producto}>
          {data.producto}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Código:</span>
            <span className="font-medium">{data.codigo}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Unidades:</span>
            <span className="font-bold">
              {parseFloat(data.ventas.toString()).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Costo:</span>
            <span className="font-medium text-red-600">
              Bs. {parseFloat(data.importe_costo.toString()).toLocaleString("es-BO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ingreso:</span>
            <span className="font-medium text-blue-600">
              Bs. {parseFloat(data.importe_venta.toString()).toLocaleString("es-BO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">Utilidad:</span>
              <span
                className={`font-bold ${
                  utilidad > 0
                    ? "text-green-600"
                    : utilidad < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                Bs. {utilidad.toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Margen:</span>
              <span
                className={`font-semibold ${
                  margen > 0
                    ? "text-green-600"
                    : margen < 0
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {margen.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function UtilidadesChart({ data, limit = 20 }: UtilidadesChartProps) {
  const chartData = useMemo(() => {
    // Tomar solo los top N productos ordenados por utilidad (de mayor a menor)
    const sortedData = [...data]
      .map((item) => ({
        ...item,
        utilidad: parseFloat(item.utilidad.toString()),
        producto_short:
          item.producto.length > 30
            ? item.producto.substring(0, 30) + "..."
            : item.producto,
      }))
      // Ordenar de mayor a menor utilidad (descendente)
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, limit);

    return sortedData;
  }, [data, limit]);

  const stats = useMemo(() => {
    const totalUtilidad = data.reduce(
      (sum, item) => sum + parseFloat(item.utilidad.toString()),
      0
    );
    const totalIngreso = data.reduce(
      (sum, item) => sum + parseFloat(item.importe_venta.toString()),
      0
    );
    const margenPromedio = totalIngreso > 0 ? (totalUtilidad / totalIngreso) * 100 : 0;
    const rentables = data.filter((item) => parseFloat(item.utilidad.toString()) > 0).length;
    const noRentables = data.filter((item) => parseFloat(item.utilidad.toString()) <= 0).length;

    return {
      totalUtilidad,
      margenPromedio,
      rentables,
      noRentables,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-16">
          <Package className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin datos disponibles</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            No hay productos para mostrar. Ajusta los filtros y presiona "Buscar" para cargar el reporte.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Cards de métricas superiores */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="size-5 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Utilidad Total
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  Bs. {stats.totalUtilidad.toLocaleString("es-BO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-5 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Margen Promedio
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.margenPromedio.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="size-5 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Rentables / No Rentables
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  <span className="text-green-600">{stats.rentables}</span>
                  <span className="text-muted-foreground mx-2">/</span>
                  <span className="text-red-600">{stats.noRentables}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Gráfico de barras horizontales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">📊</span>
            {chartData.length === data.length
              ? `Todos los Productos (${data.length}) - Mayor a Menor`
              : `Top ${Math.min(limit, data.length)} Productos - Mayor a Menor Utilidad`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  `Bs. ${value.toLocaleString("es-BO", {
                    maximumFractionDigits: 0,
                  })}`
                }
              />
              <YAxis
                dataKey="producto_short"
                type="category"
                width={140}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
              <Legend />
              <Bar dataKey="utilidad" name="Utilidad (Bs.)" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.utilidad > 0 ? "#22c55e" : entry.utilidad < 0 ? "#ef4444" : "#9ca3af"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
