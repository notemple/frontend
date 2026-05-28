export type DocumentMeta = {
  id: string;
  title: string;
  icon?: string;
  updatedAt: string;
  type: 'page' | 'collection' | 'person' | 'book';
};

// Mock data
export const INITIAL_DOCUMENTS: DocumentMeta[] = [
  { id: 'doc-1', title: 'Getting started', type: 'page', updatedAt: new Date().toISOString() },
  { id: 'doc-2', title: 'Guide to Capacities', type: 'page', updatedAt: new Date().toISOString() },
  { id: 'doc-3', title: 'The Selfish Gene', type: 'book', updatedAt: new Date().toISOString() },
  { id: 'doc-4', title: 'Richard Dawkins', type: 'person', updatedAt: new Date().toISOString() },
];
