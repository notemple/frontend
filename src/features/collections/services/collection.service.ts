import { storage } from '@/storage';
import type { Collection, CollectionItem, CollectionViewState } from '../types';

export const collectionService = {
  async listCollections(): Promise<Collection[]> {
    return storage.collections.list();
  },

  async saveCollection(collection: Collection): Promise<void> {
    await storage.collections.save(collection);
  },

  async deleteCollection(id: string): Promise<void> {
    await storage.collections.delete(id);
    // Clean up items inside this collection
    const items = await storage.collectionItems.list(id);
    for (const item of items) {
      await storage.collectionItems.delete(item.id);
    }
  },

  async listItems(collectionId: string): Promise<CollectionItem[]> {
    return storage.collectionItems.list(collectionId);
  },

  async listAllItems(): Promise<CollectionItem[]> {
    return storage.collectionItems.listAll();
  },

  async saveItem(item: CollectionItem): Promise<void> {
    await storage.collectionItems.save(item);
  },

  async deleteItem(id: string): Promise<void> {
    await storage.collectionItems.delete(id);
  },

  async getViewState(collectionId: string): Promise<CollectionViewState | null> {
    return storage.metadata.get<CollectionViewState>(`collection_view_state_${collectionId}`);
  },

  async saveViewState(collectionId: string, state: CollectionViewState): Promise<void> {
    await storage.metadata.set(`collection_view_state_${collectionId}`, state);
  }
};
