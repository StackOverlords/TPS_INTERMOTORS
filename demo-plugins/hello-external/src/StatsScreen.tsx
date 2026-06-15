/**
 * StatsScreen.tsx — Vista de estadísticas del plugin Tareas Demo.
 *
 * Lee el mismo storage que TasksScreen para mostrar stats derivadas.
 * Demuestra: múltiples rutas en el mismo plugin, storage compartido, getTheme().
 */

import { useState, useEffect } from "react";
import { BarChart2Icon } from "lucide-react";
import type { PluginAPI } from "@tps/plugin-sdk";
import { Task, PRIORITY, priorityLabel } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatsScreenProps {
  api: PluginAPI;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "tasks";

interface Stats {
  total: number;
  done: number;
  pending: number;
  high: number;
  med: number;
  low: number;
  pct: number;
}

function computeStats(tasks: Task[]): Stats {
  const done = tasks.filter((t) => t.done).length;
  const pending = tasks.length - done;
  const high = tasks.filter((t) => t.priority === PRIORITY.HIGH).length;
  const med = tasks.filter((t) => t.priority === PRIORITY.MED).length;
  const low = tasks.filter((t) => t.priority === PRIORITY.LOW).length;
  const pct = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);
  return { total: tasks.length, done, pending, high, med, low, pct };
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function StatsScreen({ api }: StatsScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = api.getTheme();
  const rootClass = `dtp-root dtp-stats-root${theme === "dark" ? " dtp-dark" : ""}`;

  useEffect(() => {
    api.storage.get<Task[]>(STORAGE_KEY).then((saved) => {
      if (saved && Array.isArray(saved)) setTasks(saved);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className={rootClass}>
        <div className="dtp-loading" style={{ flex: 1 }}>
          <div className="dtp-spinner" />
          Calculando estadísticas...
        </div>
      </div>
    );
  }

  const s = computeStats(tasks);
  const max = Math.max(s.high, s.med, s.low, 1);

  return (
    <div className={rootClass}>
      {/* Header */}
      <div className="dtp-stats-header">
        <h1 className="dtp-stats-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BarChart2Icon size={20} />
          Estadísticas de Tareas
        </h1>
        <p className="dtp-stats-subtitle">
          Datos derivados del mismo storage que la vista principal
        </p>
      </div>

      {/* Body */}
      <div className="dtp-stats-body">
        {s.total === 0 ? (
          <div className="dtp-empty">
            <div className="dtp-empty-icon">📊</div>
            <p className="dtp-empty-title">Sin datos aún</p>
            <p className="dtp-empty-desc">
              Creá algunas tareas en la vista principal para ver las estadísticas.
            </p>
          </div>
        ) : (
          <>
            {/* Cards resumen */}
            <div className="dtp-stat-cards">
              <div className="dtp-stat-card">
                <div className="dtp-stat-value" style={{ color: "var(--dtp-text)" }}>
                  {s.total}
                </div>
                <div className="dtp-stat-label">Total</div>
              </div>
              <div className="dtp-stat-card">
                <div className="dtp-stat-value" style={{ color: "var(--dtp-accent)" }}>
                  {s.pending}
                </div>
                <div className="dtp-stat-label">Pendientes</div>
              </div>
              <div className="dtp-stat-card">
                <div className="dtp-stat-value" style={{ color: "var(--dtp-success)" }}>
                  {s.done}
                </div>
                <div className="dtp-stat-label">Completadas</div>
              </div>
              <div className="dtp-stat-card">
                <div className="dtp-stat-value">
                  {s.pct}%
                </div>
                <div className="dtp-stat-label">Avance</div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="dtp-progress-card">
              <div className="dtp-progress-label">
                <span>Progreso general</span>
                <span className="dtp-progress-pct">{s.pct}%</span>
              </div>
              <div className="dtp-progress-track">
                <div
                  className="dtp-progress-fill"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>

            {/* Barras de prioridad */}
            <div className="dtp-priority-bars">
              <p className="dtp-prio-title">Desglose por prioridad</p>

              {(
                [
                  { value: PRIORITY.HIGH, count: s.high, cls: "dtp-prio-high" },
                  { value: PRIORITY.MED, count: s.med, cls: "dtp-prio-med" },
                  { value: PRIORITY.LOW, count: s.low, cls: "dtp-prio-low" },
                ] as const
              ).map(({ value, count, cls }) => (
                <div key={value} className={`dtp-prio-row ${cls}`}>
                  <span className="dtp-prio-label">
                    {priorityLabel(value)}
                  </span>
                  <div className="dtp-prio-track">
                    <div
                      className="dtp-prio-fill"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="dtp-prio-count">{count}</span>
                </div>
              ))}
            </div>

            {/* Plugin info */}
            <div
              style={{
                background: "var(--dtp-bg-card)",
                border: "1px solid var(--dtp-border)",
                borderRadius: "var(--dtp-radius)",
                padding: "0.875rem 1.25rem",
                fontSize: "0.75rem",
                color: "var(--dtp-text-muted)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--dtp-text)", display: "block", marginBottom: "0.25rem" }}>
                Sobre este plugin
              </strong>
              Plugin ID: <code>com.tps.demo-external</code> · Federation: <code>helloExternal</code>
              <br />
              APIs ejercitadas: storage, notify, confirm, prompt, getAuthState, getTheme,
              emitEvent, onEvent, registerCommand, registerKeybinding, registerSettingsAction,
              registerSidebarSection, registerRoutes
            </div>
          </>
        )}
      </div>
    </div>
  );
}
