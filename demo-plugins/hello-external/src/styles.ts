/**
 * styles.ts — Estilos self-contained del plugin Tareas Demo.
 *
 * Estrategia:
 *  - UN <style> inyectado con id "dtp-styles" (idempotente).
 *  - Prefijo de clase "dtp-" para evitar colisiones con el host.
 *  - Variables CSS bajo .dtp-root (light) y .dtp-root.dtp-dark (dark).
 *  - NO confiamos en Tailwind del host — el plugin se buildea aparte.
 */

export const DTP_STYLE_ID = "dtp-styles";

const CSS = `
/* ── Variables de tema ──────────────────────────────────────────────────── */
.dtp-root {
  --dtp-bg: #f8fafc;
  --dtp-bg-card: #ffffff;
  --dtp-bg-input: #ffffff;
  --dtp-bg-hover: #f1f5f9;
  --dtp-bg-badge-low: #dbeafe;
  --dtp-bg-badge-med: #fef9c3;
  --dtp-bg-badge-high: #fee2e2;
  --dtp-bg-empty: #f1f5f9;
  --dtp-border: #e2e8f0;
  --dtp-border-focus: #6366f1;
  --dtp-text: #0f172a;
  --dtp-text-muted: #64748b;
  --dtp-text-dim: #94a3b8;
  --dtp-text-badge-low: #1d4ed8;
  --dtp-text-badge-med: #854d0e;
  --dtp-text-badge-high: #b91c1c;
  --dtp-accent: #6366f1;
  --dtp-accent-hover: #4f46e5;
  --dtp-accent-text: #ffffff;
  --dtp-success: #16a34a;
  --dtp-danger: #dc2626;
  --dtp-danger-hover: #b91c1c;
  --dtp-shadow-card: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  --dtp-shadow-bar: 0 1px 3px rgba(0,0,0,0.06);
  --dtp-radius: 0.75rem;
  --dtp-radius-sm: 0.375rem;
  --dtp-radius-xs: 0.25rem;
  --dtp-transition: 150ms ease;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.dtp-root.dtp-dark {
  --dtp-bg: #0f172a;
  --dtp-bg-card: #1e293b;
  --dtp-bg-input: #1e293b;
  --dtp-bg-hover: #334155;
  --dtp-bg-badge-low: #1e3a5f;
  --dtp-bg-badge-med: #3d2b00;
  --dtp-bg-badge-high: #3d1010;
  --dtp-bg-empty: #1e293b;
  --dtp-border: #334155;
  --dtp-border-focus: #818cf8;
  --dtp-text: #f1f5f9;
  --dtp-text-muted: #94a3b8;
  --dtp-text-dim: #64748b;
  --dtp-text-badge-low: #93c5fd;
  --dtp-text-badge-med: #fde68a;
  --dtp-text-badge-high: #fca5a5;
  --dtp-accent: #818cf8;
  --dtp-accent-hover: #6366f1;
  --dtp-accent-text: #ffffff;
  --dtp-success: #4ade80;
  --dtp-danger: #f87171;
  --dtp-danger-hover: #ef4444;
  --dtp-shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --dtp-shadow-bar: 0 1px 3px rgba(0,0,0,0.2);
}

/* ── Root layout ─────────────────────────────────────────────────────────── */
.dtp-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  background: var(--dtp-bg);
  color: var(--dtp-text);
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.dtp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--dtp-border);
  background: var(--dtp-bg-card);
  box-shadow: var(--dtp-shadow-bar);
  flex-shrink: 0;
}

.dtp-header-left {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.dtp-header-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--dtp-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dtp-header-subtitle {
  font-size: 0.8rem;
  color: var(--dtp-text-muted);
  margin: 0;
}

.dtp-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dtp-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.dtp-badge-theme {
  background: var(--dtp-bg-hover);
  color: var(--dtp-text-muted);
  border: 1px solid var(--dtp-border);
}

.dtp-badge-user {
  background: var(--dtp-accent);
  color: var(--dtp-accent-text);
}

.dtp-badge-low {
  background: var(--dtp-bg-badge-low);
  color: var(--dtp-text-badge-low);
}
.dtp-badge-med {
  background: var(--dtp-bg-badge-med);
  color: var(--dtp-text-badge-med);
}
.dtp-badge-high {
  background: var(--dtp-bg-badge-high);
  color: var(--dtp-text-badge-high);
}

/* ── Toolbar (search, filter, new) ──────────────────────────────────────── */
.dtp-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid var(--dtp-border);
  background: var(--dtp-bg-card);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.dtp-search-wrap {
  position: relative;
  flex: 1;
  min-width: 160px;
}

.dtp-search-icon {
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dtp-text-dim);
  pointer-events: none;
}

.dtp-search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius-sm);
  background: var(--dtp-bg-input);
  color: var(--dtp-text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--dtp-transition);
  box-sizing: border-box;
}

.dtp-search-input:focus {
  border-color: var(--dtp-border-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dtp-border-focus) 20%, transparent);
}

.dtp-search-input::placeholder {
  color: var(--dtp-text-dim);
}

.dtp-filter-group {
  display: flex;
  gap: 0.25rem;
  background: var(--dtp-bg);
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius-sm);
  padding: 0.125rem;
}

.dtp-filter-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--dtp-text-muted);
  border-radius: calc(var(--dtp-radius-sm) - 2px);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dtp-transition), color var(--dtp-transition);
  white-space: nowrap;
}

.dtp-filter-btn:hover {
  background: var(--dtp-bg-hover);
  color: var(--dtp-text);
}

.dtp-filter-btn.dtp-active {
  background: var(--dtp-accent);
  color: var(--dtp-accent-text);
}

.dtp-btn-new {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--dtp-accent);
  color: var(--dtp-accent-text);
  border: none;
  border-radius: var(--dtp-radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--dtp-transition), transform 80ms ease;
  white-space: nowrap;
}

.dtp-btn-new:hover {
  background: var(--dtp-accent-hover);
}

.dtp-btn-new:active {
  transform: scale(0.97);
}

/* ── Summary strip ───────────────────────────────────────────────────────── */
.dtp-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  background: var(--dtp-bg);
  border-bottom: 1px solid var(--dtp-border);
  font-size: 0.75rem;
  color: var(--dtp-text-muted);
  flex-shrink: 0;
}

.dtp-summary-sep {
  width: 1px;
  height: 12px;
  background: var(--dtp-border);
}

.dtp-summary strong {
  color: var(--dtp-text);
}

/* ── Task list ───────────────────────────────────────────────────────────── */
.dtp-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dtp-list::-webkit-scrollbar {
  width: 6px;
}
.dtp-list::-webkit-scrollbar-track {
  background: transparent;
}
.dtp-list::-webkit-scrollbar-thumb {
  background: var(--dtp-border);
  border-radius: 3px;
}

/* ── Task card ───────────────────────────────────────────────────────────── */
.dtp-task-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--dtp-bg-card);
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius);
  box-shadow: var(--dtp-shadow-card);
  transition: box-shadow var(--dtp-transition), border-color var(--dtp-transition);
}

.dtp-task-card:hover {
  border-color: var(--dtp-accent);
  box-shadow: 0 2px 8px rgba(99,102,241,0.12);
}

.dtp-task-card.dtp-task-done {
  opacity: 0.6;
}

.dtp-checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.1rem;
  border: 2px solid var(--dtp-border);
  border-radius: var(--dtp-radius-xs);
  background: var(--dtp-bg-input);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dtp-transition), border-color var(--dtp-transition);
  user-select: none;
}

.dtp-checkbox:hover {
  border-color: var(--dtp-accent);
}

.dtp-checkbox.dtp-checked {
  background: var(--dtp-success);
  border-color: var(--dtp-success);
}

.dtp-task-body {
  flex: 1;
  min-width: 0;
}

.dtp-task-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dtp-text);
  margin: 0 0 0.25rem;
  word-break: break-word;
}

.dtp-task-title.dtp-done {
  text-decoration: line-through;
  color: var(--dtp-text-muted);
}

.dtp-task-notes {
  font-size: 0.8rem;
  color: var(--dtp-text-muted);
  margin: 0 0 0.4rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.dtp-task-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dtp-date {
  font-size: 0.7rem;
  color: var(--dtp-text-dim);
}

.dtp-task-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.dtp-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--dtp-radius-xs);
  background: transparent;
  color: var(--dtp-text-dim);
  cursor: pointer;
  transition: background var(--dtp-transition), color var(--dtp-transition);
}

.dtp-icon-btn:hover {
  background: var(--dtp-bg-hover);
  color: var(--dtp-text);
}

.dtp-icon-btn.dtp-danger:hover {
  background: color-mix(in srgb, var(--dtp-danger) 15%, transparent);
  color: var(--dtp-danger);
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.dtp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--dtp-text-muted);
  gap: 0.75rem;
  background: var(--dtp-bg-empty);
  border: 1px dashed var(--dtp-border);
  border-radius: var(--dtp-radius);
  margin: 0.5rem 0;
}

.dtp-empty-icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.dtp-empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--dtp-text);
  margin: 0;
}

.dtp-empty-desc {
  font-size: 0.8rem;
  color: var(--dtp-text-muted);
  margin: 0;
  max-width: 260px;
}

/* ── Loading state ───────────────────────────────────────────────────────── */
.dtp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.5rem;
  color: var(--dtp-text-muted);
  font-size: 0.875rem;
}

.dtp-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--dtp-border);
  border-top-color: var(--dtp-accent);
  border-radius: 50%;
  animation: dtp-spin 0.7s linear infinite;
}

@keyframes dtp-spin {
  to { transform: rotate(360deg); }
}

/* ── Stats screen ────────────────────────────────────────────────────────── */
.dtp-stats-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  background: var(--dtp-bg);
  color: var(--dtp-text);
  overflow-y: auto;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.dtp-stats-header {
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--dtp-border);
  background: var(--dtp-bg-card);
  box-shadow: var(--dtp-shadow-bar);
  flex-shrink: 0;
}

.dtp-stats-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.125rem;
  color: var(--dtp-text);
}

.dtp-stats-subtitle {
  font-size: 0.8rem;
  color: var(--dtp-text-muted);
  margin: 0;
}

.dtp-stats-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dtp-stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.dtp-stat-card {
  background: var(--dtp-bg-card);
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius);
  padding: 1rem;
  box-shadow: var(--dtp-shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dtp-stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--dtp-accent);
  line-height: 1;
}

.dtp-stat-label {
  font-size: 0.75rem;
  color: var(--dtp-text-muted);
  font-weight: 500;
}

.dtp-progress-card {
  background: var(--dtp-bg-card);
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius);
  padding: 1rem 1.25rem;
  box-shadow: var(--dtp-shadow-card);
}

.dtp-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dtp-text);
  margin-bottom: 0.5rem;
}

.dtp-progress-pct {
  color: var(--dtp-accent);
  font-weight: 700;
}

.dtp-progress-track {
  height: 10px;
  background: var(--dtp-bg-hover);
  border-radius: 9999px;
  overflow: hidden;
}

.dtp-progress-fill {
  height: 100%;
  background: var(--dtp-accent);
  border-radius: 9999px;
  transition: width 500ms ease;
}

.dtp-priority-bars {
  background: var(--dtp-bg-card);
  border: 1px solid var(--dtp-border);
  border-radius: var(--dtp-radius);
  padding: 1rem 1.25rem;
  box-shadow: var(--dtp-shadow-card);
}

.dtp-prio-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--dtp-text);
  margin: 0 0 0.875rem;
}

.dtp-prio-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.dtp-prio-row:last-child {
  margin-bottom: 0;
}

.dtp-prio-label {
  width: 3.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.dtp-prio-track {
  flex: 1;
  height: 8px;
  background: var(--dtp-bg-hover);
  border-radius: 9999px;
  overflow: hidden;
}

.dtp-prio-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 500ms ease;
  min-width: 4px;
}

.dtp-prio-count {
  font-size: 0.7rem;
  color: var(--dtp-text-muted);
  width: 1.5rem;
  text-align: right;
}

.dtp-prio-high .dtp-prio-fill { background: var(--dtp-danger); }
.dtp-prio-med .dtp-prio-fill  { background: #f59e0b; }
.dtp-prio-low .dtp-prio-fill  { background: var(--dtp-accent); }
`;

/** Inyecta los estilos del plugin una sola vez. Idempotente. */
export function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(DTP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = DTP_STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Elimina el <style> del plugin (para cleanup en deactivate). */
export function removeStyles(): void {
  if (typeof document === "undefined") return;
  document.getElementById(DTP_STYLE_ID)?.remove();
}
