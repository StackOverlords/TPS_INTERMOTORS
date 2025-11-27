import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { ScrollArea } from '@/components/atoms/scroll-area';
import { Separator } from '@/components/atoms/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Trash2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TaskNotification } from './TaskNotifications';

interface NotificationsPanelProps {
  tasks: TaskNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  tasks,
  onDismiss,
  onClearAll,
  isOpen,
  onOpenChange,
  trigger
}) => {
  const getStatusIcon = (status: TaskNotification['status']) => {
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

  const getStatusBadgeVariant = (status: TaskNotification['status']) => {
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

  const inProgressTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'success' || t.status === 'error');

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              Notificaciones
            </h3>
            {tasks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                Limpiar todo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{inProgressTasks.length} en progreso</span>
            <span>•</span>
            <span>{completedTasks.length} completadas</span>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[500px]">
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <CheckCircle2 className="size-12 mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay notificaciones
              </p>
            </div>
          ) : (
            <div className="p-2">
            {/* Tareas en progreso */}
            {inProgressTasks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
                  En progreso
                </h4>
                <div className="space-y-2">
                  {inProgressTasks.map(task => (
                    <Card
                      key={task.id}
                      className={cn(
                        'p-3 border-l-4 hover:bg-gray-50 transition-colors',
                        task.status === 'in-progress' && 'border-l-blue-500',
                        task.status === 'pending' && 'border-l-gray-400'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(task.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </h4>
                            <Badge
                              variant={getStatusBadgeVariant(task.status)}
                              className="text-xs shrink-0"
                            >
                              {task.status === 'in-progress' && 'En progreso'}
                              {task.status === 'pending' && 'Pendiente'}
                            </Badge>
                          </div>

                          {task.message && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {task.message}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(task.timestamp, {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {inProgressTasks.length > 0 && completedTasks.length > 0 && (
              <Separator className="my-4" />
            )}

            {/* Tareas completadas */}
            {completedTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
                  Recientes
                </h4>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <Card
                      key={task.id}
                      className={cn(
                        'p-3 border-l-4 hover:bg-gray-50 transition-colors',
                        task.status === 'success' && 'border-l-green-500',
                        task.status === 'error' && 'border-l-red-500'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(task.status)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </h4>
                            <Badge
                              variant={getStatusBadgeVariant(task.status)}
                              className="text-xs shrink-0"
                            >
                              {task.status === 'success' && 'Completado'}
                              {task.status === 'error' && 'Error'}
                            </Badge>
                          </div>

                          {task.message && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {task.message}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(task.timestamp, {
                                addSuffix: true,
                                locale: es
                              })}
                            </p>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0"
                              onClick={() => onDismiss(task.id)}
                            >
                              <Trash2 className="size-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsPanel;
