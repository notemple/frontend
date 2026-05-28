import type { DocumentStorage } from '../core/document.storage';
import type { NoteDocument } from '../core/types';
import { db } from "./db";

export class DexieDocumentStorage implements DocumentStorage {
  async get(id: string): Promise<NoteDocument | null> {
    const doc = await db.documents.get(id);
    return doc || null;
  }

  async save(doc: NoteDocument): Promise<void> {
    await db.documents.put(doc);
  }

  async delete(id: string): Promise<void> {
    await db.documents.delete(id);
  }

  async list(): Promise<NoteDocument[]> {
    return db.documents.toArray();
  }
}
