import type { TaskStorage } from '../core/task.storage';
import type { Task } from '../core/types';
import { db } from "./db";

export class DexieTaskStorage implements TaskStorage {
  async get(id: string): Promise<Task | null> {
    const task = await db.tasks.get(id);
    return task || null;
  }

  async save(task: Task): Promise<void> {
    await db.tasks.put(task);
  }

  async delete(id: string): Promise<void> {
    await db.tasks.delete(id);
  }

  async list(): Promise<Task[]> {
    return db.tasks.toArray();
  }
}
