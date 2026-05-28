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
  status?: 'open' | 'in progress' | 'done';
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
          status: 'open',
          deadline: 'Next Wednesday',
          createdAt: new Date().toISOString(),
        }
      ],
      addTask: (task) => set((state) => {
        const defaultStatus = task.completed ? 'done' : 'open';
        return {
          tasks: [...state.tasks, { ...task, status: task.status || defaultStatus, id: `task-${crypto.randomUUID()}`, createdAt: new Date().toISOString() }]
        };
      }),
      updateTask: (id, updates) => set((state) => {
        return {
          tasks: state.tasks.map(t => {
            if (t?.id !== id) return t;
            
            const newUpdates = { ...updates };
            
            // Sync completed and status if one of them is updated
            if (updates.completed !== undefined && updates.status === undefined) {
              newUpdates.status = updates.completed ? 'done' : 'open';
            } else if (updates.status !== undefined && updates.completed === undefined) {
              newUpdates.completed = updates.status === 'done';
            }
            
            return { ...t, ...newUpdates };
          })
        };
      }),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t?.id !== id)
      })),
    }),
    {
      name: 'task-storage',
    }
  )
);
