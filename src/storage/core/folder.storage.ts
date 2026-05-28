import type { Folder } from './types';

export interface FolderStorage {
  get(id: string): Promise<Folder | null>;
  save(folder: Folder): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Folder[]>;
}
