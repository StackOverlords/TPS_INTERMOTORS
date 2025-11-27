import type { TaskNotification, TaskStatus } from '@/components/common/TaskNotifications';
import { useCallback, useState } from 'react';

// Hook para gestionar notificaciones de tareas
export const useTaskNotifications = () => {
  const [tasks, setTasks] = useState<TaskNotification[]>([]);

  /**
   * Agregar una nueva tarea
   */
  const addTask = useCallback((
    title: string,
    options?: {
      message?: string;
      status?: TaskStatus;
      autoDismiss?: boolean;
      dismissAfter?: number;
      id?: string;
      showFloatingNotification?: boolean;
    }
  ) => {
    const taskId = options?.id || `task-${Date.now()}-${Math.random()}`;

    const newTask: TaskNotification = {
      id: taskId,
      title,
      message: options?.message,
      status: options?.status || 'pending',
      timestamp: Date.now(),
      autoDismiss: options?.autoDismiss ?? false,
      dismissAfter: options?.dismissAfter || 5000,
      showFloatingNotification: options?.showFloatingNotification ?? true, // Por defecto true
    };

    setTasks(prev => [...prev, newTask]);

    return taskId;
  }, []);

  /**
   * Actualizar el estado de una tarea
   */
  const updateTask = useCallback((id: string, updates: Partial<Omit<TaskNotification, 'id' | 'timestamp'>>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates }
          : task
      )
    );
  }, []);

  /**
   * Eliminar una tarea
   */
  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  /**
   * Limpiar todas las tareas
   */
  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  /**
   * Marcar tarea como en progreso
   */
  const startTask = useCallback((id: string, message?: string) => {
    updateTask(id, {
      status: 'in-progress',
      ...(message && { message })
    });
  }, [updateTask]);

  /**
   * Marcar tarea como completada exitosamente
   */
  const completeTask = useCallback((id: string, message?: string, dismissAfter?: number) => {
    updateTask(id, {
      status: 'success',
      message: message || 'Tarea completada exitosamente',
      autoDismiss: true,
      dismissAfter: dismissAfter || 5000, // Por defecto 5 segundos
    });
  }, [updateTask]);

  /**
   * Marcar tarea como fallida
   */
  const failTask = useCallback((id: string, message?: string, dismissAfter?: number) => {
    updateTask(id, {
      status: 'error',
      message: message || 'Ocurrió un error al procesar la tarea',
      autoDismiss: true,
      dismissAfter: dismissAfter || 5000, // Por defecto 5 segundos
    });
  }, [updateTask]);

  /**
   * Crear una tarea que inicia automáticamente
   */
  const addAndStartTask = useCallback((
    title: string,
    message?: string,
    showFloatingNotification: boolean = true
  ) => {
    const id = addTask(title, {
      status: 'in-progress',
      message,
      showFloatingNotification,
    });
    return id;
  }, [addTask]);

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    clearTasks,
    startTask,
    completeTask,
    failTask,
    addAndStartTask,
  };
};
