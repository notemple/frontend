import { create } from 'zustand';
import { taskService } from '@/services/task.service';
import type { Task } from '@/storage/core/types';
export type { Task } from '@/storage/core/types';

interface TaskStore {
  tasks: Task[];
  isInitialized: boolean;

  initialize: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
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
    const newTask: Task = {
      ...task,
      id: `task-${crypto.randomUUID()}`,
      status: task.status || defaultStatus,
      createdAt: new Date().toISOString()
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

    const updatedTask: Task = { ...existing, ...newUpdates };
    
    set({
      tasks: get().tasks.map(t => t.id === id ? updatedTask : t)
    });

    await taskService.saveTask(updatedTask);
  },

  deleteTask: async (id) => {
    set({
      tasks: get().tasks.filter(t => t.id !== id)
    });
    await taskService.deleteTask(id);
  }
}));
