import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Folder {
  id: string;
  name: string;
}

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: string;
  updatedAt: string;
  createdAt?: string;
  author?: string;
  backdropType?: 'none' | 'solid' | 'gradient';
  backdropStyle?: 'immersive' | 'faded';
  backdropColor?: string;
  backdropGradientStart?: string;
  backdropGradientEnd?: string;
  backdropGradientDirection?: string;
  documentColor?: string;
  textColor?: string;
  color?: string;
  fontFamily?: string;
  folderId?: string | null;
  isFavorite?: boolean;
}

interface DocumentStore {
  documents: Record<string, NoteDocument>;
  folders: Folder[];
  folderOrder: string[];
  documentOrder: string[]; // Order of root documents

  addDocument: (doc: NoteDocument) => void;
  updateDocument: (id: string, updates: Partial<NoteDocument>) => void;
  deleteDocument: (id: string) => void;
  renameTag: (oldTag: string, newTag: string) => void;
  deleteTag: (tag: string) => void;

  createFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Reordering
  moveDocument: (docId: string, targetFolderId: string | null, targetIndex: number) => void;
  moveFolder: (folderId: string, targetIndex: number) => void;
  setFolderOrder: (order: string[]) => void;
  setDocumentOrder: (order: string[]) => void;
}

const initialDocs: Record<string, NoteDocument> = {};
const initialDocOrder: string[] = [];

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      documents: initialDocs,
      folders: [],
      folderOrder: [],
      documentOrder: initialDocOrder,

      addDocument: (doc) => set((state) => {
        const isUpdating = !!state.documents[doc.id];
        const docWithMetadata = {
          ...doc,
          createdAt: doc.createdAt || new Date().toISOString(),
          author: doc.author || 'new user',
        };
        return {
          documents: { ...state.documents, [doc.id]: docWithMetadata },
          documentOrder: isUpdating ? state.documentOrder : [...state.documentOrder, doc.id]
        };
      }),
      updateDocument: (id, updates) => set((state) => {
        const existing = state.documents[id];
        if (!existing) {
          const newDoc: NoteDocument = {
            id,
            title: updates.title || '',
            content: updates.content || '',
            tags: updates.tags || [],
            type: updates.type || 'page',
            createdAt: updates.createdAt || new Date().toISOString(),
            author: updates.author || 'new user',
            updatedAt: new Date().toISOString(),
            ...updates
          };
          return {
            documents: { ...state.documents, [id]: newDoc },
            documentOrder: [...state.documentOrder, id]
          };
        }
        return {
          documents: {
            ...state.documents,
            [id]: {
              ...existing,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
        };
      }),
      deleteDocument: (id) => set((state) => {
        const newDocs = { ...state.documents };
        delete newDocs[id];
        return {
          documents: newDocs,
          documentOrder: state.documentOrder.filter(docId => docId !== id)
        };
      }),

      renameTag: (oldTag, newTag) => set((state) => {
        const newDocs = { ...state.documents };
        Object.keys(newDocs).forEach(docId => {
          if (newDocs[docId].tags?.includes(oldTag)) {
            newDocs[docId].tags = newDocs[docId].tags.map(t => t === oldTag ? newTag : t);
          }
        });
        return { documents: newDocs };
      }),
      deleteTag: (tag) => set((state) => {
        const newDocs = { ...state.documents };
        Object.keys(newDocs).forEach(docId => {
          if (newDocs[docId].tags?.includes(tag)) {
            newDocs[docId].tags = newDocs[docId].tags.filter(t => t !== tag);
          }
        });
        return { documents: newDocs };
      }),

      createFolder: (name) => set((state) => {
        const id = `folder-${crypto.randomUUID()}`;
        return {
          folders: [...state.folders, { id, name }],
          folderOrder: [...state.folderOrder, id]
        };
      }),
      updateFolder: (id, name) => set((state) => ({
        folders: state.folders.map(f => f?.id === id ? { ...f, name } : f)
      })),
      deleteFolder: (id) => set((state) => {
        const newDocs = { ...state.documents };
        Object.keys(newDocs).forEach(docId => {
          if (newDocs[docId].folderId === id) {
            newDocs[docId].folderId = null;
          }
        });
        return {
          folders: state.folders.filter(f => f?.id !== id),
          folderOrder: state.folderOrder.filter(fId => fId !== id),
          documents: newDocs
        };
      }),

      moveDocument: (docId, targetFolderId, targetIndex) => set((state) => {
        const doc = state.documents[docId];
        if (!doc) return state;

        const updatedDocs = { ...state.documents, [docId]: { ...doc, folderId: targetFolderId } };
        const newDocumentOrder = state.documentOrder.filter(id => id !== docId);

        let absoluteIndex = 0;
        if (targetFolderId === null) {
          let count = 0;
          while (absoluteIndex < newDocumentOrder.length && count < targetIndex) {
            if (!updatedDocs[newDocumentOrder[absoluteIndex]]?.folderId) count++;
            absoluteIndex++;
          }
        } else {
          let count = 0;
          while (absoluteIndex < newDocumentOrder.length && count < targetIndex) {
            if (updatedDocs[newDocumentOrder[absoluteIndex]]?.folderId === targetFolderId) count++;
            absoluteIndex++;
          }
        }

        newDocumentOrder.splice(absoluteIndex, 0, docId);

        return {
          documents: updatedDocs,
          documentOrder: newDocumentOrder
        };
      }),
      moveFolder: (folderId, targetIndex) => set((state) => {
        const newOrder = state.folderOrder.filter(id => id !== folderId);
        newOrder.splice(targetIndex, 0, folderId);
        return { folderOrder: newOrder };
      }),
      setFolderOrder: (order) => set({ folderOrder: order }),
      setDocumentOrder: (order) => set({ documentOrder: order })
    }),
    {
      name: 'document-storage-v4',
    }
  )
);

