import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { StockMinimoItem } from "../types/StockMinimoReport.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { AlertTriangle, TrendingDown, CheckCircle2, Package } from "lucide-react";

interface StockDistributionChartProps {
  data: StockMinimoItem[];
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  description: string;
  percentage: number;
}

// Componente de tooltip personalizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-sm">{data.name}</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Productos:</span>
            <span className="font-bold">{data.value.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Porcentaje:</span>
            <span className="font-bold">{data.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Label personalizado para el gráfico
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Solo mostrar label si el porcentaje es mayor al 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="font-bold drop-shadow-md"
      style={{ fontSize: "14px" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StockDistributionChart({ data }: StockDistributionChartProps) {
  const { distributionData, totalItems } = useMemo(() => {
    // Categorizar productos
    const critico = data.filter(
      (item) => parseFloat(item.stock_actual) <= 0
    ).length;

    const bajoMinimo = data.filter(
      (item) => item.diferencia < 0 && parseFloat(item.stock_actual) > 0
    ).length;

    const normal = data.filter((item) => item.diferencia >= 0).length;

    const total = data.length;

    const categories: DistributionData[] = [
      {
        name: "Stock Crítico",
        value: critico,
        color: "#ef4444",
        gradient: "url(#gradientRed)",
        icon: <AlertTriangle className="size-5" />,
        description: "Sin stock disponible",
        percentage: total > 0 ? (critico / total) * 100 : 0,
      },
      {
        name: "Bajo Mínimo",
        value: bajoMinimo,
        color: "#f97316",
        gradient: "url(#gradientOrange)",
        icon: <TrendingDown className="size-5" />,
        description: "Por debajo del mínimo",
        percentage: total > 0 ? (bajoMinimo / total) * 100 : 0,
      },
      {
        name: "Normal",
        value: normal,
        color: "#22c55e",
        gradient: "url(#gradientGreen)",
        icon: <CheckCircle2 className="size-5" />,
        description: "Niveles normales",
        percentage: total > 0 ? (normal / total) * 100 : 0,
      },
    ].filter((item) => item.value > 0);

    return { distributionData: categories, totalItems: total };
  }, [data]);

  if (totalItems === 0) {
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
      {/* Cards de resumen superiores */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {distributionData.map((item, index) => (
          <Card
            key={index}
            className="border-l-4 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: item.color }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <div style={{ color: item.color }}>{item.icon}</div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold" style={{ color: item.color }}>
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: item.color }}
                  >
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">del total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Gráfico de pastel mejorado */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">📊</span>
            Distribución Visual de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Gráfico */}
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    {/* Gradientes */}
                    <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="gradientOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    paddingAngle={2}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.gradient}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda personalizada */}
            <div className="space-y-4 min-w-[200px]">
              <div className="text-sm font-semibold text-muted-foreground mb-4">
                Resumen General
              </div>

              {distributionData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-default"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.value.toLocaleString()} productos
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold flex-shrink-0"
                    style={{ color: item.color }}
                  >
                    {item.percentage.toFixed(0)}%
                  </div>
                </div>
              ))}

              {/* Total general */}
              <div className="pt-4 mt-4 border-t border-border">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-sm font-semibold">Productos</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {totalItems.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
