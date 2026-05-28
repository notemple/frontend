import type { FolderStorage } from '../core/folder.storage';
import type { Folder } from '../core/types';
import { db } from "./db";

export class DexieFolderStorage implements FolderStorage {
  async get(id: string): Promise<Folder | null> {
    const folder = await db.folders.get(id);
    return folder || null;
  }

  async save(folder: Folder): Promise<void> {
    await db.folders.put(folder);
  }

  async delete(id: string): Promise<void> {
    await db.folders.delete(id);
  }

  async list(): Promise<Folder[]> {
    return db.folders.toArray();
  }
}
