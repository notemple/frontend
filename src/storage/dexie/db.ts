import Dexie,{ type Table } from "dexie";
import type { Folder,NoteDocument,Task } from '../core/types';

export interface MetadataEntry {
  key: string;
  value: any;
}

export class TemplnoteDexieDB extends Dexie {
  documents!: Table<NoteDocument, string>;
  folders!: Table<Folder, string>;
  tasks!: Table<Task, string>;
  metadata!: Table<MetadataEntry, string>;

  constructor() {
    super("NotempleDatabase");
    
    // Define database schema
    this.version(1).stores({
      documents: "id, folderId, updatedAt, isFavorite",
      folders: "id",
      tasks: "id, completed, deadline, createdAt",
      metadata: "key"
    });
  }
}

export const db = new TemplnoteDexieDB();
