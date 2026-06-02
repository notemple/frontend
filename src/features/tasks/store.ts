import { create } from 'zustand';
import { taskService } from '@/services/task.service';
import type { Task } from '@/storage/core/types';
export type { Task } from '@/storage/core/types';

interface TaskStore {
  tasks: Task[];
  isInitialized: boolean;

  initialize: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Trash operations
  restoreTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;
  restoreAllTasks: () => Promise<void>;
  permanentlyDeleteAllTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const tasks = await taskService.listTasks();
      set({ tasks, isInitialized: true });
    } catch (error) {
      console.error("Failed to initialize Task Store from local storage:", error);
    }
  },

  addTask: async (task) => {
    const defaultStatus = task.completed ? 'done' : 'open';
    const isCompleted = task.status === 'done' || (task.status === undefined && task.completed);
    const newTask: Task = {
      id: task.id || `task-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      ...task,
      status: task.status || defaultStatus
    };

    set({ tasks: [...get().tasks, newTask] });
    await taskService.saveTask(newTask);
  },

  updateTask: async (id, updates) => {
    const existing = get().tasks.find(t => t.id === id);
    if (!existing) return;

    const newUpdates = { ...updates };
    
    // Sync completed and status if one of them is updated
    if (updates.completed !== undefined && updates.status === undefined) {
      newUpdates.status = updates.completed ? 'done' : 'open';
    } else if (updates.status !== undefined && updates.completed === undefined) {
      newUpdates.completed = updates.status === 'done';
    }

    if (newUpdates.completed) {
      newUpdates.completedAt = existing.completedAt || new Date().toISOString();
    } else if (newUpdates.completed === false) {
      newUpdates.completedAt = undefined;
    }

    const updatedTask: Task = { ...existing, ...newUpdates };
    
    set({
      tasks: get().tasks.map(t => t.id === id ? updatedTask : t)
    });

    await taskService.saveTask(updatedTask);
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      isDeleted: true,
      deletedAt: new Date().toISOString()
    };

    set({
      tasks: get().tasks.map(t => t.id === id ? updatedTask : t)
    });
    await taskService.saveTask(updatedTask);
  },

  restoreTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      isDeleted: false,
      deletedAt: undefined
    };

    set({
      tasks: get().tasks.map(t => t.id === id ? updatedTask : t)
    });
    await taskService.saveTask(updatedTask);
  },

  permanentlyDeleteTask: async (id) => {
    set({
      tasks: get().tasks.filter(t => t.id !== id)
    });
    await taskService.deleteTask(id);
  },

  restoreAllTasks: async () => {
    const tasksToSave: Task[] = [];
    const newTasks = get().tasks.map(t => {
      if (t.isDeleted) {
        const updated = { ...t, isDeleted: false, deletedAt: undefined };
        tasksToSave.push(updated);
        return updated;
      }
      return t;
    });

    set({ tasks: newTasks });
    for (const t of tasksToSave) {
      await taskService.saveTask(t);
    }
  },

  permanentlyDeleteAllTasks: async () => {
    const deletedTaskIds: string[] = [];
    const newTasks = get().tasks.filter(t => {
      if (t.isDeleted) {
        deletedTaskIds.push(t.id);
        return false;
      }
      return true;
    });

    set({ tasks: newTasks });
    for (const id of deletedTaskIds) {
      await taskService.deleteTask(id);
    }
  }
}));
