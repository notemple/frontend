import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  title: string;
  list: 'Today' | 'Upcoming' | 'All Tasks';
  completed: boolean;
  startDate?: string; // UTC ISO string
  deadline?: string; // UTC ISO string
  createdAt: string; // UTC ISO string
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: 'task-1',
          title: 'Finish the website',
          list: 'Today',
          completed: false,
          deadline: 'Next Wednesday',
          createdAt: new Date().toISOString(),
        }
      ],
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: `task-${crypto.randomUUID()}`, createdAt: new Date().toISOString() }]
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t?.id === id ? { ...t, ...updates } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t?.id !== id)
      })),
    }),
    {
      name: 'task-storage',
    }
  )
);
