import type { Collection } from './types';

export interface CollectionRepository {
  get(id: string): Promise<Collection | null>;
  save(collection: Collection): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Collection[]>;
}
