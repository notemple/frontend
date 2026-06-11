import type { CollectionItem } from './types';

export interface CollectionItemRepository {
  get(id: string): Promise<CollectionItem | null>;
  save(item: CollectionItem): Promise<void>;
  delete(id: string): Promise<void>;
  list(collectionId: string): Promise<CollectionItem[]>;
  listAll(): Promise<CollectionItem[]>;
}
