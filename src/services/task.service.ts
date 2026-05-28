import { storage } from "../storage";
import type { Task } from '../storage/core/types';

export const taskService = {
  async getTask(id: string): Promise<Task | null> {
    return storage.tasks.get(id);
  },

  async saveTask(task: Task): Promise<void> {
    return storage.tasks.save(task);
  },

  async deleteTask(id: string): Promise<void> {
    return storage.tasks.delete(id);
  },

  async listTasks(): Promise<Task[]> {
    return storage.tasks.list();
  }
};
