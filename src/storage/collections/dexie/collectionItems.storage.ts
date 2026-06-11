import type { CollectionItemRepository } from '../collectionItems.repository';
import type { CollectionItem } from '../types';
import { db } from '../../dexie/db';

export class DexieCollectionItemStorage implements CollectionItemRepository {
  async get(id: string): Promise<CollectionItem | null> {
    const item = await db.collectionItems.get(id);
    return item || null;
  }

  async save(item: CollectionItem): Promise<void> {
    await db.collectionItems.put(item);
  }

  async delete(id: string): Promise<void> {
    await db.collectionItems.delete(id);
  }

  async list(collectionId: string): Promise<CollectionItem[]> {
    return db.collectionItems.where('collectionId').equals(collectionId).toArray();
  }

  async listAll(): Promise<CollectionItem[]> {
    return db.collectionItems.toArray();
  }
}
