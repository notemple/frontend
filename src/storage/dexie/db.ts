import Dexie,{ type Table } from "dexie";
import type { Folder,NoteDocument,Task } from '../core/types';
import type { Collection, CollectionItem } from '../collections/types';

export interface MetadataEntry {
  key: string;
  value: any;
}

export interface ImageEntry {
  id: string;
  data: string;
}

export class TemplnoteDexieDB extends Dexie {
  documents!: Table<NoteDocument, string>;
  folders!: Table<Folder, string>;
  tasks!: Table<Task, string>;
  metadata!: Table<MetadataEntry, string>;
  images!: Table<ImageEntry, string>;
  collections!: Table<Collection, string>;
  collectionItems!: Table<CollectionItem, string>;

  constructor() {
    super("NotempleDatabase");
    
    // Define database schema
    this.version(2).stores({
      documents: "id, folderId, updatedAt, isFavorite",
      folders: "id",
      tasks: "id, completed, deadline, createdAt",
      metadata: "key",
      images: "id"
    });
    // Version 3: adds lexicalState column for Lexical editor persistence
    this.version(3).stores({
      documents: "id, folderId, updatedAt, isFavorite",
      folders: "id",
      tasks: "id, completed, deadline, createdAt",
      metadata: "key",
      images: "id"
    });
    // Version 4: adds collections and collectionItems tables for custom databases
    this.version(4).stores({
      documents: "id, folderId, updatedAt, isFavorite",
      folders: "id",
      tasks: "id, completed, deadline, createdAt",
      metadata: "key",
      images: "id",
      collections: "id, name",
      collectionItems: "id, collectionId"
    });
  }
}

export const db = new TemplnoteDexieDB();

