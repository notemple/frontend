import type { Task } from './types';

export interface TaskStorage {
  get(id: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Task[]>;
}
