import { storage } from "../storage";
import type { NoteDocument, Folder } from '../storage/core/types';

export const documentService = {
  async getDocument(id: string): Promise<NoteDocument | null> {
    return storage.documents.get(id);
  },

  async saveDocument(doc: NoteDocument): Promise<void> {
    const docWithMetadata = {
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return storage.documents.save(docWithMetadata);
  },

  async deleteDocument(id: string): Promise<void> {
    return storage.documents.delete(id);
  },

  async listDocuments(): Promise<NoteDocument[]> {
    return storage.documents.list();
  },

  async getFolder(id: string): Promise<Folder | null> {
    return storage.folders.get(id);
  },

  async saveFolder(folder: Folder): Promise<void> {
    return storage.folders.save(folder);
  },

  async deleteFolder(id: string): Promise<void> {
    return storage.folders.delete(id);
  },

  async listFolders(): Promise<Folder[]> {
    return storage.folders.list();
  },

  async getMetadata<T>(key: string): Promise<T | null> {
    return storage.metadata.get<T>(key);
  },

  async setMetadata<T>(key: string, value: T): Promise<void> {
    return storage.metadata.set<T>(key, value);
  }
};
