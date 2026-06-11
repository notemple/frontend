import type { Collection, CollectionField, CollectionItem, FieldType } from '@/storage/collections/types';

export * from '@/storage/collections/types';

export type ViewType = 'table' | 'list' | 'gallery' | 'calendar' | 'board';

export interface CollectionFilter {
  id: string;
  fieldId: string;
  operator: 'contains' | 'equals' | 'not-equals' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'checked' | 'unchecked';
  value?: any;
}

export interface CollectionSort {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export interface CollectionViewState {
  activeView: ViewType;
  filters: CollectionFilter[];
  sorts: CollectionSort[];
  visibleFields: string[]; // List of field IDs that are visible
  fieldWidths: Record<string, number>; // fieldId -> width in px
  fieldOrder: string[]; // Order of field IDs in the table view
}
