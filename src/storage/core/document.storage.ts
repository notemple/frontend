import type { NoteDocument } from './types';

export interface DocumentStorage {
  get(id: string): Promise<NoteDocument | null>;
  save(doc: NoteDocument): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<NoteDocument[]>;
}
