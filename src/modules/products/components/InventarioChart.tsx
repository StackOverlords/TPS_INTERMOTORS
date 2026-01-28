import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { InventarioItem } from "../types/InventarioReport.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";

interface InventarioChartProps {
  data: InventarioItem[];
  limit?: number;
}

// Tooltip personalizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
            <span className="text-muted-foreground">Compras:</span>
            <span className="font-bold text-blue-600">
              {parseFloat(data.compras.toString()).toLocaleString()} u.
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ventas:</span>
            <span className="font-bold text-green-600">
              {parseFloat(data.ventas.toString()).toLocaleString()} u.
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Stock:</span>
            <span className="font-bold text-orange-600">
              {parseFloat(data.stock.toString()).toLocaleString()} u.
            </span>
          </div>
          <div className="border-t border-border pt-1 mt-1">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground font-semibold">Valor:</span>
              <span className="font-bold text-primary">
                Bs. {parseFloat(data.valor.toString()).toLocaleString("es-BO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function InventarioChart({ data, limit = 20 }: InventarioChartProps) {
  const chartData = useMemo(() => {
    // Tomar los top N productos ordenados por valor de stock (mayor a menor)
    const sortedData = [...data]
      .map((item) => ({
        ...item,
        compras: parseFloat(item.compras.toString()),
        ventas: parseFloat(item.ventas.toString()),
        stock: parseFloat(item.stock.toString()),
        valor: parseFloat(item.valor.toString()),
        producto_short:
          item.producto.length > 25
            ? item.producto.substring(0, 25) + "..."
            : item.producto,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, limit);

    return sortedData;
  }, [data, limit]);

  const stats = useMemo(() => {
    const totalCompras = data.reduce(
      (sum, item) => sum + parseFloat(item.compras.toString()),
      0
    );
    const totalVentas = data.reduce(
      (sum, item) => sum + parseFloat(item.ventas.toString()),
      0
    );
    const totalStock = data.reduce(
      (sum, item) => sum + parseFloat(item.stock.toString()),
      0
    );
    const totalValor = data.reduce(
      (sum, item) => sum + parseFloat(item.valor.toString()),
      0
    );
    const rotacion = totalStock > 0 ? totalVentas / totalStock : 0;
    const conStock = data.filter((item) => parseFloat(item.stock.toString()) > 0).length;
    const sinStock = data.filter((item) => parseFloat(item.stock.toString()) === 0).length;

    return {
      totalCompras,
      totalVentas,
      totalStock,
      totalValor,
      rotacion,
      conStock,
      sinStock,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-16">
          <Package className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin datos disponibles</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            No hay productos para mostrar. Selecciona la fecha de corte y presiona "Buscar".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Cards de métricas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="size-5 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Compras
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalCompras.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-muted-foreground">unidades</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-5 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Ventas
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalVentas.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-muted-foreground">unidades</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="size-5 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Stock Total
                  </span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalStock.toLocaleString("es-BO", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-muted-foreground">unidades</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="size-5 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Valor Inventario
                  </span>
                </div>
                <div className="text-xl font-bold text-purple-600">
                  Bs. {stats.totalValor.toLocaleString("es-BO", {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Rotación: {stats.rotacion.toFixed(2)}x
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras agrupadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">📊</span>
            {chartData.length === data.length
              ? `Todos los Productos (${data.length}) - Movimientos de Inventario`
              : `Top ${Math.min(limit, data.length)} Productos - Mayor Valor de Stock`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 40)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
              <YAxis
                dataKey="producto_short"
                type="category"
                width={140}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
              <Legend />
              <Bar dataKey="compras" name="Compras" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="stock" name="Stock" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
