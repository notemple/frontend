import type { MetadataStorage } from '../core/metadata.storage';
import { db } from "./db";

export class DexieMetadataStorage implements MetadataStorage {
  async get<T>(key: string): Promise<T | null> {
    const entry = await db.metadata.get(key);
    return entry ? (entry.value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await db.metadata.put({ key, value });
  }

  async delete(key: string): Promise<void> {
    await db.metadata.delete(key);
  }
}
