import { create } from 'zustand';
import { collectionService } from '../services/collection.service';
import type {
  Collection,
  CollectionField,
  CollectionItem,
  CollectionViewState,
  CollectionFilter,
  CollectionSort,
  FieldType,
  CollectionFieldOption,
  ViewType
} from '../types';

interface CollectionState {
  collections: Record<string, Collection>;
  items: Record<string, CollectionItem[]>;
  viewStates: Record<string, CollectionViewState>;
  activeCollectionId: string | null;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setActiveCollectionId: (id: string | null) => void;

  // Collection CRUD
  createCollection: (name: string, icon: string, color: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  duplicateCollection: (id: string) => Promise<void>;
  reorderCollections: (orderedIds: string[]) => Promise<void>;
  togglePinCollection: (id: string) => Promise<void>;

  // Field Management
  addField: (collectionId: string, name: string, type: FieldType, required: boolean, options?: CollectionFieldOption[], relationCollectionId?: string) => Promise<void>;
  updateField: (collectionId: string, fieldId: string, updates: Partial<CollectionField>) => Promise<void>;
  deleteField: (collectionId: string, fieldId: string) => Promise<void>;
  reorderFields: (collectionId: string, fieldOrder: string[]) => Promise<void>;

  // Item (Row) Management
  addItem: (collectionId: string, initialValues?: Record<string, any>) => Promise<CollectionItem>;
  updateItemValue: (collectionId: string, itemId: string, fieldId: string, value: any) => Promise<void>;
  deleteItem: (collectionId: string, itemId: string) => Promise<void>;
  duplicateItem: (collectionId: string, itemId: string) => Promise<void>;

  // View Settings
  setActiveView: (collectionId: string, view: ViewType) => Promise<void>;
  setFilters: (collectionId: string, filters: CollectionFilter[]) => Promise<void>;
  setSorts: (collectionId: string, sorts: CollectionSort[]) => Promise<void>;
  setFieldWidths: (collectionId: string, widths: Record<string, number>) => Promise<void>;
  setFieldVisibility: (collectionId: string, fieldId: string, visible: boolean) => Promise<void>;
}

const DEFAULT_VIEW_STATE = (fields: CollectionField[]): CollectionViewState => {
  const fieldIds = fields.map(f => f.id);
  return {
    activeView: 'table',
    filters: [],
    sorts: [],
    visibleFields: fieldIds,
    fieldWidths: {},
    fieldOrder: fieldIds
  };
};

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: {},
  items: {},
  viewStates: {},
  activeCollectionId: null,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const list = await collectionService.listCollections();
      const collectionsMap: Record<string, Collection> = {};
      const itemsMap: Record<string, CollectionItem[]> = {};
      const viewStatesMap: Record<string, CollectionViewState> = {};

      for (const col of list) {
        collectionsMap[col.id] = col;
        itemsMap[col.id] = await collectionService.listItems(col.id);
        
        let vs = await collectionService.getViewState(col.id);
        if (!vs) {
          vs = DEFAULT_VIEW_STATE(col.fields);
          await collectionService.saveViewState(col.id, vs);
        }
        viewStatesMap[col.id] = vs;
      }

      // Check if we need to prepopulate defaults (Books, Recipes, Projects, Investments)
      if (list.length === 0) {
        const defaults = [
          {
            id: 'col-books',
            name: 'Books',
            icon: '📚',
            color: '#3B82F6',
            description: 'My reading list database',
            order: 0,
            fields: [
              { id: 'f-title', name: 'Title', type: 'text' as const, required: true },
              { id: 'f-author', name: 'Author', type: 'text' as const, required: false },
              {
                id: 'f-genre',
                name: 'Genre',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-fiction', name: 'Fiction', color: '#8B5CF6' },
                  { id: 'o-nonfiction', name: 'Non-Fiction', color: '#10B981' },
                  { id: 'o-sci-fi', name: 'Sci-Fi', color: '#3B82F6' },
                  { id: 'o-biography', name: 'Biography', color: '#F59E0B' }
                ]
              },
              {
                id: 'f-status',
                name: 'Status',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-to-read', name: 'To Read', color: '#6B7280' },
                  { id: 'o-reading', name: 'Reading', color: '#3B82F6' },
                  { id: 'o-completed', name: 'Completed', color: '#10B981' }
                ]
              },
              { id: 'f-rating', name: 'Rating', type: 'number' as const, required: false }
            ]
          },
          {
            id: 'col-recipes',
            name: 'Recipes',
            icon: '🍳',
            color: '#F59E0B',
            description: 'Delicious recipes collection',
            order: 1,
            fields: [
              { id: 'f-rec-name', name: 'Recipe Name', type: 'text' as const, required: true },
              {
                id: 'f-rec-cat',
                name: 'Category',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-bf', name: 'Breakfast', color: '#F59E0B' },
                  { id: 'o-lunch', name: 'Lunch', color: '#3B82F6' },
                  { id: 'o-dinner', name: 'Dinner', color: '#EF4444' },
                  { id: 'o-dessert', name: 'Dessert', color: '#EC4899' }
                ]
              },
              { id: 'f-rec-prep', name: 'Prep Time (mins)', type: 'number' as const, required: false },
              { id: 'f-rec-ing', name: 'Ingredients', type: 'rich-text' as const, required: false }
            ]
          },
          {
            id: 'col-projects',
            name: 'Projects',
            icon: '💼',
            color: '#EF4444',
            description: 'Work & personal project management',
            order: 2,
            fields: [
              { id: 'f-proj-name', name: 'Project Name', type: 'text' as const, required: true },
              {
                id: 'f-proj-status',
                name: 'Status',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-ns', name: 'Not Started', color: '#6B7280' },
                  { id: 'o-ip', name: 'In Progress', color: '#3B82F6' },
                  { id: 'o-oh', name: 'On Hold', color: '#F59E0B' },
                  { id: 'o-done', name: 'Completed', color: '#10B981' }
                ]
              },
              {
                id: 'f-proj-pri',
                name: 'Priority',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-low', name: 'Low', color: '#10B981' },
                  { id: 'o-med', name: 'Medium', color: '#3B82F6' },
                  { id: 'o-high', name: 'High', color: '#F59E0B' },
                  { id: 'o-crit', name: 'Critical', color: '#EF4444' }
                ]
              },
              { id: 'f-proj-due', name: 'Due Date', type: 'date' as const, required: false },
              { id: 'f-proj-tasks', name: 'Tasks Relation', type: 'task-relation' as const, required: false }
            ]
          },
          {
            id: 'col-investments',
            name: 'Investments',
            icon: '📈',
            color: '#10B981',
            description: 'Financial portfolio tracker',
            order: 3,
            fields: [
              { id: 'f-inv-name', name: 'Asset Name', type: 'text' as const, required: true },
              {
                id: 'f-inv-type',
                name: 'Asset Type',
                type: 'select' as const,
                required: false,
                options: [
                  { id: 'o-stock', name: 'Stock', color: '#3B82F6' },
                  { id: 'o-crypto', name: 'Crypto', color: '#8B5CF6' },
                  { id: 'o-re', name: 'Real Estate', color: '#F59E0B' },
                  { id: 'o-cash', name: 'Cash', color: '#10B981' }
                ]
              },
              { id: 'f-inv-amt', name: 'Amount Owned', type: 'number' as const, required: false },
              { id: 'f-inv-val', name: 'Current Price', type: 'number' as const, required: false }
            ]
          }
        ];

        for (const def of defaults) {
          const col: Collection = {
            ...def,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pinned: false
          };
          await collectionService.saveCollection(col);
          collectionsMap[col.id] = col;

          // Save default items
          let itemValues: Record<string, any>[] = [];
          if (def.id === 'col-books') {
            itemValues = [
              { 'f-title': 'The Hobbit', 'f-author': 'J.R.R. Tolkien', 'f-genre': 'o-sci-fi', 'f-status': 'o-completed', 'f-rating': 5 },
              { 'f-title': 'Atomic Habits', 'f-author': 'James Clear', 'f-genre': 'o-nonfiction', 'f-status': 'o-reading', 'f-rating': 4 }
            ];
          } else if (def.id === 'col-recipes') {
            itemValues = [
              { 'f-rec-name': 'Avocado Toast', 'f-rec-cat': 'o-bf', 'f-rec-prep': 10, 'f-rec-ing': 'Avocado, sourdough bread, salt, pepper, olive oil' }
            ];
          } else if (def.id === 'col-projects') {
            itemValues = [
              { 'f-proj-name': 'Revamp Website', 'f-proj-status': 'o-ip', 'f-proj-pri': 'o-high', 'f-proj-due': new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] }
            ];
          } else if (def.id === 'col-investments') {
            itemValues = [
              { 'f-inv-name': 'Apple Inc. (AAPL)', 'f-inv-type': 'o-stock', 'f-inv-amt': 15, 'f-inv-val': 175.50 }
            ];
          }

          const itemsList: CollectionItem[] = [];
          for (const vals of itemValues) {
            const item: CollectionItem = {
              id: `item-${crypto.randomUUID()}`,
              collectionId: col.id,
              values: vals,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await collectionService.saveItem(item);
            itemsList.push(item);
          }
          itemsMap[col.id] = itemsList;

          const vs = DEFAULT_VIEW_STATE(col.fields);
          await collectionService.saveViewState(col.id, vs);
          viewStatesMap[col.id] = vs;
        }
      }

      set({
        collections: collectionsMap,
        items: itemsMap,
        viewStates: viewStatesMap,
        isInitialized: true
      });
    } catch (e) {
      console.error('Failed to initialize collection store', e);
    }
  },

  setActiveCollectionId: (id) => set({ activeCollectionId: id }),

  createCollection: async (name, icon, color, description) => {
    const id = `col-${crypto.randomUUID()}`;
    const newCol: Collection = {
      id,
      name,
      icon,
      color,
      description,
      fields: [{ id: 'f-title', name: 'Name', type: 'text', required: true }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      order: Object.keys(get().collections).length
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [id]: newCol },
      items: { ...state.items, [id]: [] },
      viewStates: { ...state.viewStates, [id]: DEFAULT_VIEW_STATE(newCol.fields) }
    }));

    await collectionService.saveCollection(newCol);
    await collectionService.saveViewState(id, DEFAULT_VIEW_STATE(newCol.fields));
    return newCol;
  },

  updateCollection: async (id, updates) => {
    const existing = get().collections[id];
    if (!existing) return;

    const updatedCol = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [id]: updatedCol }
    }));

    await collectionService.saveCollection(updatedCol);
  },

  deleteCollection: async (id) => {
    const collections = { ...get().collections };
    const items = { ...get().items };
    const viewStates = { ...get().viewStates };

    delete collections[id];
    delete items[id];
    delete viewStates[id];

    // Optimistic update
    set({
      collections,
      items,
      viewStates,
      activeCollectionId: get().activeCollectionId === id ? null : get().activeCollectionId
    });

    await collectionService.deleteCollection(id);
  },

  duplicateCollection: async (id) => {
    const existing = get().collections[id];
    if (!existing) return;

    const newId = `col-${crypto.randomUUID()}`;
    const duplicated: Collection = {
      ...existing,
      id: newId,
      name: `${existing.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      order: Object.keys(get().collections).length
    };

    // Copy items
    const oldItems = get().items[id] || [];
    const newItems = oldItems.map((item) => ({
      ...item,
      id: `item-${crypto.randomUUID()}`,
      collectionId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Save duplicate
    set((state) => ({
      collections: { ...state.collections, [newId]: duplicated },
      items: { ...state.items, [newId]: newItems },
      viewStates: { ...state.viewStates, [newId]: state.viewStates[id] || DEFAULT_VIEW_STATE(duplicated.fields) }
    }));

    await collectionService.saveCollection(duplicated);
    for (const item of newItems) {
      await collectionService.saveItem(item);
    }
  },

  reorderCollections: async (orderedIds) => {
    const collections = { ...get().collections };
    orderedIds.forEach((id, index) => {
      if (collections[id]) {
        collections[id] = { ...collections[id], order: index };
      }
    });

    // Optimistic update
    set({ collections });

    // Background sync
    for (const id of orderedIds) {
      if (collections[id]) {
        await collectionService.saveCollection(collections[id]);
      }
    }
  },

  togglePinCollection: async (id) => {
    const existing = get().collections[id];
    if (!existing) return;

    const updated = {
      ...existing,
      pinned: !existing.pinned,
      updatedAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [id]: updated }
    }));

    await collectionService.saveCollection(updated);
  },

  // Field operations
  addField: async (collectionId, name, type, required, options, relationCollectionId) => {
    const collection = get().collections[collectionId];
    if (!collection) return;

    const newField: CollectionField = {
      id: `f-${crypto.randomUUID()}`,
      name,
      type,
      required,
      options,
      relationCollectionId
    };

    const updatedFields = [...collection.fields, newField];
    const updatedCol = {
      ...collection,
      fields: updatedFields,
      updatedAt: new Date().toISOString()
    };

    // Update view state
    const vs = get().viewStates[collectionId] || DEFAULT_VIEW_STATE(updatedFields);
    const updatedVs = {
      ...vs,
      visibleFields: [...vs.visibleFields, newField.id],
      fieldOrder: [...vs.fieldOrder, newField.id]
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [collectionId]: updatedCol },
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));

    await collectionService.saveCollection(updatedCol);
    await collectionService.saveViewState(collectionId, updatedVs);
  },

  updateField: async (collectionId, fieldId, updates) => {
    const collection = get().collections[collectionId];
    if (!collection) return;

    const updatedFields = collection.fields.map((f) => {
      if (f.id === fieldId) {
        return { ...f, ...updates };
      }
      return f;
    });

    const updatedCol = {
      ...collection,
      fields: updatedFields,
      updatedAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [collectionId]: updatedCol }
    }));

    await collectionService.saveCollection(updatedCol);
  },

  deleteField: async (collectionId, fieldId) => {
    const collection = get().collections[collectionId];
    if (!collection) return;

    const updatedFields = collection.fields.filter((f) => f.id !== fieldId);
    const updatedCol = {
      ...collection,
      fields: updatedFields,
      updatedAt: new Date().toISOString()
    };

    // Update items to strip the deleted field values
    const colItems = get().items[collectionId] || [];
    const updatedItems = colItems.map((item) => {
      const values = { ...item.values };
      delete values[fieldId];
      return { ...item, values };
    });

    // Update view state
    const vs = get().viewStates[collectionId] || DEFAULT_VIEW_STATE(updatedFields);
    const updatedVs = {
      ...vs,
      visibleFields: vs.visibleFields.filter((id) => id !== fieldId),
      fieldOrder: vs.fieldOrder.filter((id) => id !== fieldId)
    };

    // Optimistic update
    set((state) => ({
      collections: { ...state.collections, [collectionId]: updatedCol },
      items: { ...state.items, [collectionId]: updatedItems },
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));

    await collectionService.saveCollection(updatedCol);
    await collectionService.saveViewState(collectionId, updatedVs);

    // Save items background updates
    for (const item of updatedItems) {
      await collectionService.saveItem(item);
    }
  },

  reorderFields: async (collectionId, fieldOrder) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const updatedVs = {
      ...vs,
      fieldOrder
    };

    // Optimistic update
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));

    await collectionService.saveViewState(collectionId, updatedVs);
  },

  // Item operations
  addItem: async (collectionId, initialValues = {}) => {
    const itemId = `item-${crypto.randomUUID()}`;
    const newItem: CollectionItem = {
      id: itemId,
      collectionId,
      values: initialValues,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic update
    set((state) => {
      const list = state.items[collectionId] || [];
      return {
        items: { ...state.items, [collectionId]: [...list, newItem] }
      };
    });

    await collectionService.saveItem(newItem);
    return newItem;
  },

  updateItemValue: async (collectionId, itemId, fieldId, value) => {
    const list = get().items[collectionId] || [];
    const index = list.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const updatedItem = {
      ...list[index],
      values: {
        ...list[index].values,
        [fieldId]: value
      },
      updatedAt: new Date().toISOString()
    };

    const newList = [...list];
    newList[index] = updatedItem;

    // Optimistic update
    set((state) => ({
      items: { ...state.items, [collectionId]: newList }
    }));

    await collectionService.saveItem(updatedItem);
  },

  deleteItem: async (collectionId, itemId) => {
    const list = get().items[collectionId] || [];
    const newList = list.filter((item) => item.id !== itemId);

    // Optimistic update
    set((state) => ({
      items: { ...state.items, [collectionId]: newList }
    }));

    await collectionService.deleteItem(itemId);
  },

  duplicateItem: async (collectionId, itemId) => {
    const list = get().items[collectionId] || [];
    const item = list.find((i) => i.id === itemId);
    if (!item) return;

    const duplicatedItem: CollectionItem = {
      ...item,
      id: `item-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      values: { ...item.values }
    };

    // Optimistic update
    set((state) => ({
      items: { ...state.items, [collectionId]: [...list, duplicatedItem] }
    }));

    await collectionService.saveItem(duplicatedItem);
  },

  // View state operations
  setActiveView: async (collectionId, view) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const updatedVs = { ...vs, activeView: view };
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));
    await collectionService.saveViewState(collectionId, updatedVs);
  },

  setFilters: async (collectionId, filters) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const updatedVs = { ...vs, filters };
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));
    await collectionService.saveViewState(collectionId, updatedVs);
  },

  setSorts: async (collectionId, sorts) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const updatedVs = { ...vs, sorts };
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));
    await collectionService.saveViewState(collectionId, updatedVs);
  },

  setFieldWidths: async (collectionId, widths) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const updatedVs = {
      ...vs,
      fieldWidths: { ...vs.fieldWidths, ...widths }
    };
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));
    await collectionService.saveViewState(collectionId, updatedVs);
  },

  setFieldVisibility: async (collectionId, fieldId, visible) => {
    const vs = get().viewStates[collectionId];
    if (!vs) return;

    const visibleFields = visible
      ? [...vs.visibleFields, fieldId]
      : vs.visibleFields.filter((id) => id !== fieldId);

    const updatedVs = { ...vs, visibleFields };
    set((state) => ({
      viewStates: { ...state.viewStates, [collectionId]: updatedVs }
    }));
    await collectionService.saveViewState(collectionId, updatedVs);
  }
}));
