import type { CollectionRepository } from '../collections.repository';
import type { Collection } from '../types';
import { db } from '../../dexie/db';

export class DexieCollectionStorage implements CollectionRepository {
  async get(id: string): Promise<Collection | null> {
    const col = await db.collections.get(id);
    return col || null;
  }

  async save(collection: Collection): Promise<void> {
    await db.collections.put(collection);
  }

  async delete(id: string): Promise<void> {
    await db.collections.delete(id);
  }

  async list(): Promise<Collection[]> {
    return db.collections.toArray();
  }
}
