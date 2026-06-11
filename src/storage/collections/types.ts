export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'multi-select'
  | 'url'
  | 'email'
  | 'phone'
  | 'document-relation'
  | 'task-relation'
  | 'tag-relation'
  | 'collection-relation'
  | 'media'
  | 'rich-text';

export interface CollectionFieldOption {
  id: string;
  name: string;
  color: string;
}

export interface CollectionField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  options?: CollectionFieldOption[];
  relationCollectionId?: string; // Target collection for relation fields
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  fields: CollectionField[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  order?: number;
  backdropType?: 'none' | 'solid' | 'gradient';
  backdropStyle?: 'immersive' | 'faded';
  backdropColor?: string;
  backdropGradientStart?: string;
  backdropGradientEnd?: string;
  backdropGradientDirection?: string;
  documentColor?: string;
  cardColor?: string;
  documentColorType?: 'solid' | 'gradient';
  documentGradientStart?: string;
  documentGradientEnd?: string;
  documentGradientDirection?: string;
  textColor?: string;
  topSectionColor?: string;
  topSectionColorType?: 'solid' | 'gradient';
  topSectionGradientStart?: string;
  topSectionGradientEnd?: string;
  topSectionGradientDirection?: string;
  topSectionTextColor?: string;
  fontFamily?: string;
  fontSize?: 'small' | 'normal' | 'large';
  lineHeight?: 'compact' | 'normal' | 'loose';
  pageWidth?: 'narrow' | 'wide';
  linkBackdropToCover?: boolean;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  values: Record<string, any>; // fieldId -> value representation (dependent on type)
  createdAt: string;
  updatedAt: string;
}
