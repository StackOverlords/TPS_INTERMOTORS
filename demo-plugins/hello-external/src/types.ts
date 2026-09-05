/**
 * types.ts — Tipos y helpers del plugin Tareas Demo.
 *
 * Sigue el patrón "Const Types" de la skill TypeScript:
 * const object primero, luego se extrae el tipo.
 * Sin `any`, sin union types directas.
 */

// ---------------------------------------------------------------------------
// Priority
// ---------------------------------------------------------------------------

export const PRIORITY = {
  LOW: "low",
  MED: "med",
  HIGH: "high",
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

// ---------------------------------------------------------------------------
// Task model
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export const FILTER = {
  ALL: "all",
  PENDING: "pending",
  DONE: "done",
} as const;

export type Filter = (typeof FILTER)[keyof typeof FILTER];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Genera un ID único basado en timestamp + random. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Formatea un timestamp como fecha relativa legible. */
export function relativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return "ayer";
  return `hace ${days}d`;
}

/** Label legible de prioridad. */
export function priorityLabel(p: Priority): string {
  if (p === PRIORITY.HIGH) return "Alta";
  if (p === PRIORITY.MED) return "Media";
  return "Baja";
}

/** Ordena tareas: done al final, luego por prioridad desc, luego por fecha desc. */
export function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder: Record<Priority, number> = { high: 3, med: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pd = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (pd !== 0) return pd;
    return b.createdAt - a.createdAt;
  });
}
