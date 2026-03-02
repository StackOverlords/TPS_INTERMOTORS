import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/atoms/button";

// ─── Utilidades ───────────────────────────────────────────────────────────────

/** Clase base para el pulso animado del skeleton */
const PULSE = "animate-pulse bg-muted rounded";

// ═══════════════════════════════════════════════════════════════════════════════
// Estado de error — compartido por todos los tipos
// ═══════════════════════════════════════════════════════════════════════════════

interface ChartErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ChartError({
  message = "No se pudieron cargar los datos",
  onRetry,
  className = "h-full",
}: ChartErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center px-4 ${className}`}
    >
      <div className="p-3 rounded-full bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Intenta recargar los datos
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-1.5 h-7 text-xs"
        >
          <RefreshCw className="size-3" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton — Gráfico de área / línea  (KardexSaldoChart, BaseAreaChart)
// ═══════════════════════════════════════════════════════════════════════════════

interface AreaSkeletonProps {
  className?: string;
}

export function AreaChartSkeleton({
  className = "h-full w-full",
}: AreaSkeletonProps) {
  return (
    <div className={`flex flex-col gap-2 p-3 ${className}`}>
      {/* Eje Y */}
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex flex-col justify-between py-1 w-8 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-2 w-full ${PULSE}`} />
          ))}
        </div>

        {/* Área del gráfico */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full border-t border-dashed border-muted"
              />
            ))}
          </div>

          {/* Forma del área — SVG simulado */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 300 100"
          >
            <defs>
              <linearGradient id="skel-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--muted-foreground))"
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--muted-foreground))"
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>
            {/* Línea ondulada simulada */}
            <path
              d="M0,70 C30,60 60,40 90,45 C120,50 150,30 180,35 C210,40 240,55 270,45 L300,50"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.2}
              strokeWidth={2}
              className="animate-pulse"
            />
            {/* Área rellena */}
            <path
              d="M0,70 C30,60 60,40 90,45 C120,50 150,30 180,35 C210,40 240,55 270,45 L300,50 L300,100 L0,100 Z"
              fill="url(#skel-area-grad)"
              className="animate-pulse"
            />
            {/* Puntos en la línea */}
            {[
              [0, 70],
              [90, 45],
              [180, 35],
              [270, 45],
              [300, 50],
            ].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.2}
                className="animate-pulse"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Eje X */}
      <div className="flex gap-3 pl-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 ${PULSE}`}
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton — Gráfico de barras verticales (BaseBarChart, KardexEntradasSalidasChart)
// ═══════════════════════════════════════════════════════════════════════════════

interface BarSkeletonProps {
  bars?: number;
  series?: number;
  className?: string;
}

export function BarChartSkeleton({
  bars = 7,
  series = 2,
  className = "h-full w-full",
}: BarSkeletonProps) {
  // Alturas aleatorias pero deterministas para que no cambien en cada render
  const heights = [65, 85, 45, 90, 55, 75, 40, 80, 60, 70].slice(0, bars);

  return (
    <div className={`flex flex-col gap-2 p-3 ${className}`}>
      {/* Legend */}
      <div className="flex gap-3 justify-center flex-shrink-0">
        {[...Array(series)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${PULSE}`} />
            <div className={`h-2 w-12 ${PULSE}`} />
          </div>
        ))}
      </div>

      {/* Barras */}
      <div className="flex gap-2 flex-1 min-h-0">
        {/* Eje Y */}
        <div className="flex flex-col justify-between py-1 w-8 flex-shrink-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-2 w-full ${PULSE}`} />
          ))}
        </div>

        {/* Área de barras */}
        <div className="flex-1 flex items-end gap-1 pb-1 relative min-h-0">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full border-t border-dashed border-muted"
              />
            ))}
          </div>

          {heights.map((h, i) => (
            <div key={i} className="flex-1 flex items-end gap-0.5">
              {[...Array(series)].map((_, s) => (
                <div
                  key={s}
                  className={`flex-1 rounded-t ${PULSE}`}
                  style={{
                    height: `${s === 0 ? h : h * 0.6}%`,
                    animationDelay: `${(i * series + s) * 60}ms`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Eje X */}
      <div className="flex gap-1 pl-10">
        {heights.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 ${PULSE}`}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton — Gráfico de barras horizontales (BaseHorizontalBarChart)
// ═══════════════════════════════════════════════════════════════════════════════

interface HorizontalBarSkeletonProps {
  rows?: number;
  className?: string;
}

export function HorizontalBarChartSkeleton({
  rows = 8,
  className = "h-full w-full",
}: HorizontalBarSkeletonProps) {
  const widths = [85, 60, 92, 45, 75, 55, 80, 40, 70, 65].slice(0, rows);

  return (
    <div className={`flex gap-3 p-3 ${className}`}>
      {/* Eje Y (labels) */}
      <div className="flex flex-col gap-3 w-28 flex-shrink-0 justify-around">
        {widths.map((_, i) => (
          <div
            key={i}
            className={`h-3 ${PULSE}`}
            style={{
              width: `${55 + (i % 3) * 15}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Barras */}
      <div className="flex-1 flex flex-col gap-3 justify-around relative">
        {/* Grid lines verticales */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-full border-l border-dashed border-muted"
            />
          ))}
        </div>

        {widths.map((w, i) => (
          <div
            key={i}
            className={`h-4 rounded-r ${PULSE}`}
            style={{
              width: `${w}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton — Donut / Pie (ReceivablesDonutChart, BasePieChart)
// ═══════════════════════════════════════════════════════════════════════════════

interface DonutSkeletonProps {
  legendItems?: number;
  className?: string;
}

export function DonutChartSkeleton({
  legendItems = 5,
  className = "h-full w-full",
}: DonutSkeletonProps) {
  return (
    <div className={`flex flex-col items-center gap-3 p-3 ${className}`}>
      {/* Donut */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative aspect-square h-full max-h-40">
          {/* Anillo exterior */}
          <div
            className={`absolute inset-0 rounded-full ${PULSE}`}
            style={{ opacity: 0.3 }}
          />
          {/* Hueco interior */}
          <div
            className="absolute bg-background rounded-full"
            style={{
              inset: "25%",
            }}
          />
          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className={`h-2 w-8 ${PULSE}`} />
            <div className={`h-3 w-14 ${PULSE}`} />
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 flex-shrink-0">
        {[...Array(legendItems)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className={`size-2 rounded-full ${PULSE}`}
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <div
              className={`h-2 w-12 ${PULSE}`}
              style={{ animationDelay: `${i * 80}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Skeleton — Stacked Bar (BaseStackedBarChart, ReceivablesCard)
// ═══════════════════════════════════════════════════════════════════════════════

interface StackedBarSkeletonProps {
  bars?: number;
  className?: string;
}

export function StackedBarChartSkeleton({
  bars = 6,
  className = "h-full w-full",
}: StackedBarSkeletonProps) {
  const heights = [
    [50, 30],
    [65, 20],
    [40, 45],
    [80, 15],
    [55, 35],
    [70, 25],
  ].slice(0, bars);

  return (
    <div className={`flex flex-col gap-2 p-3 ${className}`}>
      {/* Legend */}
      <div className="flex gap-3 justify-center flex-shrink-0">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${PULSE}`} />
            <div className={`h-2 w-14 ${PULSE}`} />
          </div>
        ))}
      </div>

      {/* Barras apiladas */}
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex flex-col justify-between py-1 w-8 flex-shrink-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-2 w-full ${PULSE}`} />
          ))}
        </div>

        <div className="flex-1 flex items-end gap-2 pb-1 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full border-t border-dashed border-muted"
              />
            ))}
          </div>

          {heights.map(([h1, h2], i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-stretch justify-end"
            >
              <div
                className={`rounded-t-sm ${PULSE}`}
                style={{ height: `${h2}%`, animationDelay: `${i * 70 + 35}ms` }}
              />
              <div
                className={`${PULSE}`}
                style={{
                  height: `${h1}%`,
                  animationDelay: `${i * 70}ms`,
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Eje X */}
      <div className="flex gap-2 pl-10">
        {heights.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 ${PULSE}`}
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
