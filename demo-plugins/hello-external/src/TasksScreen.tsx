/**
 * TasksScreen.tsx — Vista principal del plugin Tareas Demo.
 *
 * Ejerce: storage, notify, confirm, prompt, getAuthState, getTheme, emitEvent.
 * NO importa nada del host. Solo React + tipos del SDK (via prop api).
 *
 * React 19 rules:
 *   - Named imports only
 *   - NO useMemo / useCallback (React Compiler lo maneja)
 *   - ref as prop (no forwardRef)
 */

import { useState, useEffect } from "react";
import { CheckIcon, PencilIcon, TrashIcon, PlusIcon, SearchIcon } from "lucide-react";
import type { PluginAPI } from "@tps/plugin-sdk";
import {
  Task,
  Filter,
  FILTER,
  PRIORITY,
  Priority,
  generateId,
  relativeDate,
  priorityLabel,
  sortTasks,
} from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TasksScreenProps {
  api: PluginAPI;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const STORAGE_KEY = "tasks";

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function priorityClass(p: Priority): string {
  if (p === PRIORITY.HIGH) return "dtp-badge dtp-badge-high";
  if (p === PRIORITY.MED) return "dtp-badge dtp-badge-med";
  return "dtp-badge dtp-badge-low";
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function TasksScreen({ api }: TasksScreenProps) {
  // ── Estado ────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(FILTER.ALL);

  const theme = api.getTheme();
  const auth = api.getAuthState();
  const userName = auth.user?.name ?? "Anónimo";

  // ── Cargar tareas del storage ──────────────────────────────────────────
  useEffect(() => {
    api.storage.get<Task[]>(STORAGE_KEY).then((saved) => {
      if (saved && Array.isArray(saved)) setTasks(saved);
      setLoading(false);
    });
  }, []);

  // ── Persistir en cada cambio ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return; // no sobreescribir con [] en la carga inicial
    api.storage.set(STORAGE_KEY, tasks);
  }, [tasks, loading]);

  // ── Filtrado + ordenamiento ───────────────────────────────────────────────
  const visibleTasks = sortTasks(
    tasks.filter((t) => {
      if (filter === FILTER.PENDING && t.done) return false;
      if (filter === FILTER.DONE && !t.done) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.notes?.toLowerCase().includes(q) ?? false);
      }
      return true;
    })
  );

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleNewTask() {
    const result = await api.prompt({
      title: "Nueva tarea",
      description: "Completá los datos de la nueva tarea.",
      fields: [
        {
          id: "title",
          label: "Título",
          type: "text",
          placeholder: "¿Qué necesitás hacer?",
          required: true,
        },
        {
          id: "notes",
          label: "Notas (opcional)",
          type: "textarea",
          placeholder: "Detalles adicionales...",
        },
        {
          id: "priority",
          label: "Prioridad (alta / media / baja)",
          type: "text",
          placeholder: "media",
          defaultValue: "media",
        },
      ],
      confirmLabel: "Crear tarea",
      cancelLabel: "Cancelar",
    });

    if (!result) return;

    const rawPriority = result.priority?.toLowerCase().trim();
    const priority: Priority =
      rawPriority === "alta" || rawPriority === "high"
        ? PRIORITY.HIGH
        : rawPriority === "baja" || rawPriority === "low"
        ? PRIORITY.LOW
        : PRIORITY.MED;

    const task: Task = {
      id: generateId(),
      title: result.title.trim(),
      notes: result.notes?.trim() || undefined,
      priority,
      done: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [task, ...prev]);

    api.notify(`Tarea creada: "${task.title}"`, { variant: "success" });
    api.emitEvent("demoTasks.taskCreated", task);
  }

  async function handleEdit(task: Task) {
    const result = await api.prompt({
      title: "Editar tarea",
      fields: [
        {
          id: "title",
          label: "Título",
          type: "text",
          required: true,
          defaultValue: task.title,
        },
        {
          id: "notes",
          label: "Notas",
          type: "textarea",
          defaultValue: task.notes ?? "",
        },
        {
          id: "priority",
          label: "Prioridad (alta / media / baja)",
          type: "text",
          defaultValue:
            task.priority === PRIORITY.HIGH
              ? "alta"
              : task.priority === PRIORITY.LOW
              ? "baja"
              : "media",
        },
      ],
      confirmLabel: "Guardar",
      cancelLabel: "Cancelar",
    });

    if (!result) return;

    const rawPriority = result.priority?.toLowerCase().trim();
    const priority: Priority =
      rawPriority === "alta" || rawPriority === "high"
        ? PRIORITY.HIGH
        : rawPriority === "baja" || rawPriority === "low"
        ? PRIORITY.LOW
        : PRIORITY.MED;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, title: result.title.trim(), notes: result.notes?.trim() || undefined, priority }
          : t
      )
    );

    api.notify("Tarea actualizada", { variant: "info" });
  }

  async function handleDelete(task: Task) {
    const confirmed = await api.confirm({
      title: "Eliminar tarea",
      message: `¿Eliminás "${task.title}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      destructive: true,
    });

    if (!confirmed) return;

    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    api.notify(`Tarea eliminada`, { variant: "warning" });
  }

  function handleToggleDone(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const rootClass = `dtp-root${theme === "dark" ? " dtp-dark" : ""}`;

  return (
    <div className={rootClass}>
      {/* Header */}
      <div className="dtp-header">
        <div className="dtp-header-left">
          <h1 className="dtp-header-title">
            <span>📋</span>
            Tareas Demo
          </h1>
          <p className="dtp-header-subtitle">
            Plugin de demostración — ejercita toda la superficie del PluginAPI
          </p>
        </div>
        <div className="dtp-header-right">
          <span className={`dtp-badge dtp-badge-user`}>{userName}</span>
          <span className="dtp-badge dtp-badge-theme">
            {theme === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dtp-toolbar">
        <div className="dtp-search-wrap">
          <span className="dtp-search-icon">
            <SearchIcon size={14} />
          </span>
          <input
            className="dtp-search-input"
            type="text"
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dtp-filter-group">
          {(
            [
              [FILTER.ALL, "Todas"],
              [FILTER.PENDING, "Pendientes"],
              [FILTER.DONE, "Completadas"],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              className={`dtp-filter-btn${filter === f ? " dtp-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {label}
            </button>
          ))}
        </div>

        <button className="dtp-btn-new" onClick={handleNewTask}>
          <PlusIcon size={15} />
          Nueva tarea
        </button>
      </div>

      {/* Summary strip */}
      <div className="dtp-summary">
        <span>
          <strong>{pendingCount}</strong> pendientes
        </span>
        <div className="dtp-summary-sep" />
        <span>
          <strong>{doneCount}</strong> completadas
        </span>
        <div className="dtp-summary-sep" />
        <span>
          <strong>{tasks.length}</strong> total
        </span>
        {search.trim() && (
          <>
            <div className="dtp-summary-sep" />
            <span>{visibleTasks.length} resultado(s) para "{search}"</span>
          </>
        )}
      </div>

      {/* Task list */}
      <div className="dtp-list">
        {loading ? (
          <div className="dtp-loading">
            <div className="dtp-spinner" />
            Cargando tareas...
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="dtp-empty">
            <div className="dtp-empty-icon">
              {search.trim() ? "🔍" : filter === FILTER.DONE ? "✅" : "📭"}
            </div>
            <p className="dtp-empty-title">
              {search.trim()
                ? "Sin resultados"
                : filter === FILTER.DONE
                ? "Sin completadas aún"
                : filter === FILTER.PENDING
                ? "¡Todo al día!"
                : "Sin tareas aún"}
            </p>
            <p className="dtp-empty-desc">
              {search.trim()
                ? "Intentá con otro término de búsqueda."
                : filter !== FILTER.ALL
                ? "Cambiá el filtro o creá nuevas tareas."
                : 'Presioná "Nueva tarea" o usá Ctrl+Shift+N para agregar la primera.'}
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div
              key={task.id}
              className={`dtp-task-card${task.done ? " dtp-task-done" : ""}`}
            >
              {/* Checkbox */}
              <div
                className={`dtp-checkbox${task.done ? " dtp-checked" : ""}`}
                onClick={() => handleToggleDone(task.id)}
                role="checkbox"
                aria-checked={task.done}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleToggleDone(task.id)}
              >
                {task.done && <CheckIcon size={12} color="white" strokeWidth={3} />}
              </div>

              {/* Body */}
              <div className="dtp-task-body">
                <p className={`dtp-task-title${task.done ? " dtp-done" : ""}`}>
                  {task.title}
                </p>
                {task.notes && (
                  <p className="dtp-task-notes">{task.notes}</p>
                )}
                <div className="dtp-task-meta">
                  <span className={priorityClass(task.priority)}>
                    {priorityLabel(task.priority)}
                  </span>
                  <span className="dtp-date">{relativeDate(task.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="dtp-task-actions">
                <button
                  className="dtp-icon-btn"
                  onClick={() => handleEdit(task)}
                  title="Editar tarea"
                >
                  <PencilIcon size={14} />
                </button>
                <button
                  className="dtp-icon-btn dtp-danger"
                  onClick={() => handleDelete(task)}
                  title="Eliminar tarea"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
