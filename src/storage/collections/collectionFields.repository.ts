import type { CollectionField } from './types';

export interface CollectionFieldRepository {
  getField(collectionId: string, fieldId: string): Promise<CollectionField | null>;
  saveField(collectionId: string, field: CollectionField): Promise<void>;
  deleteField(collectionId: string, fieldId: string): Promise<void>;
  listFields(collectionId: string): Promise<CollectionField[]>;
}
