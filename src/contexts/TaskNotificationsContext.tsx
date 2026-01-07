import TaskNotifications from '@/components/common/TaskNotifications';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import authSDK from '@/services/sdk-simple-auth';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

// Contexto para gestionar notificaciones de tareas a nivel global

interface TaskNotificationsContextType {
  addTask: ReturnType<typeof useTaskNotifications>['addTask'];
  updateTask: ReturnType<typeof useTaskNotifications>['updateTask'];
  removeTask: ReturnType<typeof useTaskNotifications>['removeTask'];
  clearTasks: ReturnType<typeof useTaskNotifications>['clearTasks'];
  startTask: ReturnType<typeof useTaskNotifications>['startTask'];
  completeTask: ReturnType<typeof useTaskNotifications>['completeTask'];
  failTask: ReturnType<typeof useTaskNotifications>['failTask'];
  addAndStartTask: ReturnType<typeof useTaskNotifications>['addAndStartTask'];
  tasks: ReturnType<typeof useTaskNotifications>['tasks'];
}

const TaskNotificationsContext = createContext<TaskNotificationsContextType | null>(null);

interface TaskNotificationsProviderProps {
  children: ReactNode;
}

export const TaskNotificationsProvider = ({ children }: TaskNotificationsProviderProps) => {
  const {
    tasks,
    addTask,
    updateTask,
    removeTask,
    clearTasks,
    startTask,
    completeTask,
    failTask,
    addAndStartTask,
  } = useTaskNotifications();

  const value: TaskNotificationsContextType = {
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
  return (
    <TaskNotificationsContext.Provider value={value}>
      {children}

      {/* Renderizar las notificaciones en bottom-right */}
      <TaskNotifications
        tasks={tasks}
        onDismiss={removeTask}
        position="bottom-right"
      />
    </TaskNotificationsContext.Provider>
  );
};

export const useTaskNotificationsContext = () => {
  const context = useContext(TaskNotificationsContext);
  if (!context) {
    throw new Error('useTaskNotificationsContext must be used within TaskNotificationsProvider');
  }
  return context;
};
