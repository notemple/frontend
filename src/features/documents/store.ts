import { create } from 'zustand';
import { documentService } from '@/services/document.service';
import type { NoteDocument, Folder } from '@/storage/core/types';
export type { NoteDocument, Folder } from '@/storage/core/types';

interface DocumentStore {
  documents: Record<string, NoteDocument>;
  folders: Folder[];
  folderOrder: string[];
  documentOrder: string[]; // Order of root documents
  createdTags: string[];
  tagColors: Record<string, string>;
  folderColors: Record<string, string>;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setTagColor: (tag: string, color: string) => Promise<void>;
  setFolderColor: (folderId: string, color: string) => Promise<void>;

  addDocument: (doc: NoteDocument) => Promise<void>;
  updateDocument: (id: string, updates: Partial<NoteDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  renameTag: (oldTag: string, newTag: string) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  createTag: (tag: string) => Promise<void>;

  createFolder: (name: string) => Promise<void>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Reordering
  moveDocument: (docId: string, targetFolderId: string | null, targetIndex: number) => Promise<void>;
  moveFolder: (folderId: string, targetIndex: number) => Promise<void>;
  setFolderOrder: (order: string[]) => Promise<void>;
  setDocumentOrder: (order: string[]) => Promise<void>;
}

const initialDocs: Record<string, NoteDocument> = {};
const initialDocOrder: string[] = [];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialDocs,
  folders: [],
  folderOrder: [],
  documentOrder: initialDocOrder,
  createdTags: [],
  tagColors: {},
  folderColors: {},
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const docs = await documentService.listDocuments();
      const folders = await documentService.listFolders();
      const folderOrder = await documentService.getMetadata<string[]>("folderOrder") || [];
      const documentOrder = await documentService.getMetadata<string[]>("documentOrder") || [];
      const createdTags = await documentService.getMetadata<string[]>("createdTags") || [];
      const tagColors = await documentService.getMetadata<Record<string, string>>("tagColors") || {};
      const folderColors = await documentService.getMetadata<Record<string, string>>("folderColors") || {};

      const documents: Record<string, NoteDocument> = {};
      docs.forEach(d => {
        documents[d.id] = d;
      });

      // If documentOrder is empty but we have documents, populate it to prevent empty sidebar
      const finalDocOrder = documentOrder.length === 0 && docs.length > 0
        ? docs.map(d => d.id)
        : documentOrder;

      set({
        documents,
        folders,
        folderOrder,
        documentOrder: finalDocOrder,
        createdTags,
        tagColors,
        folderColors,
        isInitialized: true
      });
    } catch (error) {
      console.error("Failed to initialize Document Store from local storage:", error);
    }
  },

  setTagColor: async (tag, color) => {
    const newTagColors = { ...get().tagColors, [tag]: color };
    set({ tagColors: newTagColors });
    await documentService.setMetadata("tagColors", newTagColors);
  },

  setFolderColor: async (folderId, color) => {
    const newFolderColors = { ...get().folderColors, [folderId]: color };
    set({ folderColors: newFolderColors });
    await documentService.setMetadata("folderColors", newFolderColors);
  },

  addDocument: async (doc) => {
    const isUpdating = !!get().documents[doc.id];
    const docWithMetadata = {
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: doc.author || 'new user',
    };

    const newDocs = { ...get().documents, [doc.id]: docWithMetadata };
    const newOrder = isUpdating ? get().documentOrder : [...get().documentOrder, doc.id];

    set({
      documents: newDocs,
      documentOrder: newOrder
    });

    await documentService.saveDocument(docWithMetadata);
    await documentService.setMetadata("documentOrder", newOrder);
  },

  updateDocument: async (id, updates) => {
    const existing = get().documents[id];
    let newDoc: NoteDocument;
    let newOrder = get().documentOrder;

    if (!existing) {
      newDoc = {
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
      newOrder = [...get().documentOrder, id];
    } else {
      newDoc = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }

    set({
      documents: { ...get().documents, [id]: newDoc },
      documentOrder: newOrder
    });

    await documentService.saveDocument(newDoc);
    if (!existing) {
      await documentService.setMetadata("documentOrder", newOrder);
    }
  },

  deleteDocument: async (id) => {
    const newDocs = { ...get().documents };
    delete newDocs[id];
    const newOrder = get().documentOrder.filter(docId => docId !== id);

    set({
      documents: newDocs,
      documentOrder: newOrder
    });

    await documentService.deleteDocument(id);
    await documentService.setMetadata("documentOrder", newOrder);
  },

  renameTag: async (oldTag, newTag) => {
    const newDocs = { ...get().documents };
    const docsToSave: NoteDocument[] = [];

    Object.keys(newDocs).forEach(docId => {
      if (newDocs[docId].tags?.includes(oldTag)) {
        newDocs[docId] = {
          ...newDocs[docId],
          tags: newDocs[docId].tags.map(t => t === oldTag ? newTag : t),
          updatedAt: new Date().toISOString()
        };
        docsToSave.push(newDocs[docId]);
      }
    });

    const updatedCreatedTags = get().createdTags.map(t => t === oldTag ? newTag : t);
    const newTagColors = { ...get().tagColors };
    if (newTagColors[oldTag]) {
      newTagColors[newTag] = newTagColors[oldTag];
      delete newTagColors[oldTag];
    }

    set({
      documents: newDocs,
      createdTags: updatedCreatedTags,
      tagColors: newTagColors
    });

    for (const doc of docsToSave) {
      await documentService.saveDocument(doc);
    }
    await documentService.setMetadata("createdTags", updatedCreatedTags);
    await documentService.setMetadata("tagColors", newTagColors);
  },

  deleteTag: async (tag) => {
    const newDocs = { ...get().documents };
    const docsToSave: NoteDocument[] = [];

    Object.keys(newDocs).forEach(docId => {
      if (newDocs[docId].tags?.includes(tag)) {
        newDocs[docId] = {
          ...newDocs[docId],
          tags: newDocs[docId].tags.filter(t => t !== tag),
          updatedAt: new Date().toISOString()
        };
        docsToSave.push(newDocs[docId]);
      }
    });

    const updatedCreatedTags = get().createdTags.filter(t => t !== tag);
    const newTagColors = { ...get().tagColors };
    delete newTagColors[tag];

    set({
      documents: newDocs,
      createdTags: updatedCreatedTags,
      tagColors: newTagColors
    });

    for (const doc of docsToSave) {
      await documentService.saveDocument(doc);
    }
    await documentService.setMetadata("createdTags", updatedCreatedTags);
    await documentService.setMetadata("tagColors", newTagColors);
  },

  createTag: async (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !get().createdTags.includes(trimmed)) {
      const newCreatedTags = [...get().createdTags, trimmed];
      set({ createdTags: newCreatedTags });
      await documentService.setMetadata("createdTags", newCreatedTags);
    }
  },

  createFolder: async (name) => {
    const id = `folder-${crypto.randomUUID()}`;
    const folder: Folder = { id, name };
    const newFolders = [...get().folders, folder];
    const newOrder = [...get().folderOrder, id];

    set({
      folders: newFolders,
      folderOrder: newOrder
    });

    await documentService.saveFolder(folder);
    await documentService.setMetadata("folderOrder", newOrder);
  },

  updateFolder: async (id, name) => {
    const newFolders = get().folders.map(f => f?.id === id ? { ...f, name } : f);
    set({ folders: newFolders });

    const folder = newFolders.find(f => f.id === id);
    if (folder) {
      await documentService.saveFolder(folder);
    }
  },

  deleteFolder: async (id) => {
    const newDocs = { ...get().documents };
    const docsToSave: NoteDocument[] = [];

    Object.keys(newDocs).forEach(docId => {
      if (newDocs[docId].folderId === id) {
        newDocs[docId] = {
          ...newDocs[docId],
          folderId: null,
          updatedAt: new Date().toISOString()
        };
        docsToSave.push(newDocs[docId]);
      }
    });

    const newFolderColors = { ...get().folderColors };
    delete newFolderColors[id];

    const newFolders = get().folders.filter(f => f?.id !== id);
    const newOrder = get().folderOrder.filter(fId => fId !== id);

    set({
      folders: newFolders,
      folderOrder: newOrder,
      documents: newDocs,
      folderColors: newFolderColors
    });

    await documentService.deleteFolder(id);
    for (const doc of docsToSave) {
      await documentService.saveDocument(doc);
    }
    await documentService.setMetadata("folderOrder", newOrder);
    await documentService.setMetadata("folderColors", newFolderColors);
  },

  moveDocument: async (docId, targetFolderId, targetIndex) => {
    const doc = get().documents[docId];
    if (!doc) return;

    const updatedDoc = {
      ...doc,
      folderId: targetFolderId,
      updatedAt: new Date().toISOString()
    };
    const updatedDocs = { ...get().documents, [docId]: updatedDoc };
    const newDocumentOrder = get().documentOrder.filter(id => id !== docId);

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

    set({
      documents: updatedDocs,
      documentOrder: newDocumentOrder
    });

    await documentService.saveDocument(updatedDoc);
    await documentService.setMetadata("documentOrder", newDocumentOrder);
  },

  moveFolder: async (folderId, targetIndex) => {
    const newOrder = get().folderOrder.filter(id => id !== folderId);
    newOrder.splice(targetIndex, 0, folderId);
    set({ folderOrder: newOrder });
    await documentService.setMetadata("folderOrder", newOrder);
  },

  setFolderOrder: async (order) => {
    set({ folderOrder: order });
    await documentService.setMetadata("folderOrder", order);
  },

  setDocumentOrder: async (order) => {
    set({ documentOrder: order });
    await documentService.setMetadata("documentOrder", order);
  }
}));
