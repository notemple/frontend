import type { CollectionFieldRepository } from '../collectionFields.repository';
import type { CollectionField } from '../types';
import { db } from '../../dexie/db';

export class DexieCollectionFieldStorage implements CollectionFieldRepository {
  async getField(collectionId: string, fieldId: string): Promise<CollectionField | null> {
    const collection = await db.collections.get(collectionId);
    if (!collection) return null;
    return collection.fields.find(f => f.id === fieldId) || null;
  }

  async saveField(collectionId: string, field: CollectionField): Promise<void> {
    const collection = await db.collections.get(collectionId);
    if (!collection) return;
    const index = collection.fields.findIndex(f => f.id === field.id);
    if (index > -1) {
      collection.fields[index] = field;
    } else {
      collection.fields.push(field);
    }
    collection.updatedAt = new Date().toISOString();
    await db.collections.put(collection);
  }

  async deleteField(collectionId: string, fieldId: string): Promise<void> {
    const collection = await db.collections.get(collectionId);
    if (!collection) return;
    collection.fields = collection.fields.filter(f => f.id !== fieldId);
    collection.updatedAt = new Date().toISOString();
    await db.collections.put(collection);
  }

  async listFields(collectionId: string): Promise<CollectionField[]> {
    const collection = await db.collections.get(collectionId);
    if (!collection) return [];
    return collection.fields;
  }
}
