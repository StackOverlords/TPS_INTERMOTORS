import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type TaskStatus = 'pending' | 'in-progress' | 'success' | 'error';

export interface TaskNotification {
  id: string;
  title: string;
  message?: string;
  status: TaskStatus;
  timestamp: number;
  autoDismiss?: boolean;
  dismissAfter?: number; // milliseconds
  showFloatingNotification?: boolean; // Si false, solo aparece en el panel del bell, no flotante
}

interface TaskNotificationsProps {
  tasks: TaskNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const TaskNotifications: React.FC<TaskNotificationsProps> = ({
  tasks,
  onDismiss,
  position = 'bottom-right'
}) => {
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [activeTimeouts, setActiveTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-dismiss para tareas completadas
  useEffect(() => {
    tasks.forEach(task => {
      // Solo crear timeout si la tarea necesita auto-dismiss y no tiene uno activo
      if (task.autoDismiss &&
          (task.status === 'success' || task.status === 'error') &&
          !activeTimeouts.has(task.id)) {

        const timeout = setTimeout(() => {
          handleDismiss(task.id);
          setActiveTimeouts(prev => {
            const next = new Map(prev);
            next.delete(task.id);
            return next;
          });
        }, task.dismissAfter || 5000);

        setActiveTimeouts(prev => new Map(prev).set(task.id, timeout));
      }
    });

    // Cleanup: limpiar timeouts de tareas que ya no existen
    return () => {
      const currentTaskIds = new Set(tasks.map(t => t.id));
      activeTimeouts.forEach((timeout, taskId) => {
        if (!currentTaskIds.has(taskId)) {
          clearTimeout(timeout);
          setActiveTimeouts(prev => {
            const next = new Map(prev);
            next.delete(taskId);
            return next;
          });
        }
      });
    };
  }, [tasks, activeTimeouts]);

  const handleDismiss = (id: string) => {
    setDismissingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      onDismiss(id);
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300); // Duración de la animación
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'in-progress':
      case 'pending':
        return <Loader2 className="size-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="size-4 text-green-600" />;
      case 'error':
        return <XCircle className="size-4 text-red-600" />;
    }
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case 'in-progress':
      case 'pending':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Filtrar solo las tareas que deben mostrarse como flotantes
  const floatingTasks = tasks.filter(task => task.showFloatingNotification !== false);

  if (floatingTasks.length === 0) return null;

  return (
    <div className={cn(
      'fixed z-50 flex flex-col gap-2 max-w-md w-full px-4',
      positionClasses[position]
    )}>
      {floatingTasks.map((task) => {
        const isDismissing = dismissingIds.has(task.id);

        return (
          <Card
            key={task.id}
            className={cn(
              'p-3 shadow-lg border-l-4 transition-all duration-300',
              isDismissing && 'opacity-0 translate-x-full',
              task.status === 'in-progress' && 'border-l-blue-500',
              task.status === 'success' && 'border-l-green-500',
              task.status === 'error' && 'border-l-red-500',
              task.status === 'pending' && 'border-l-gray-400'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icono de estado */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(task.status)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {task.title}
                  </h4>
                  <Badge
                    variant={getStatusBadgeVariant(task.status)}
                    className="text-xs shrink-0"
                  >
                    {task.status === 'in-progress' && 'En progreso'}
                    {task.status === 'pending' && 'Pendiente'}
                    {task.status === 'success' && 'Completado'}
                    {task.status === 'error' && 'Error'}
                  </Badge>
                </div>

                {task.message && (
                  <p className="text-xs text-muted-foreground">
                    {task.message}
                  </p>
                )}
              </div>

              {/* Botón cerrar */}
              {(task.status === 'success' || task.status === 'error') && (
                <Button
                  variant="ghost"
                  size="sm" 
                  onClick={() => handleDismiss(task.id)}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskNotifications;
