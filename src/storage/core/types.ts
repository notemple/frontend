export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  isUnsaved?: boolean;
  /** Serialised Lexical EditorState JSON — used by the Lexical editor for persistence */
  lexicalState?: string | null;
  /** Plain-text snapshot extracted from the Lexical state (for word count & search) */
  contentText?: string | null;
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
  color?: string;
  fontFamily?: string;
  fontSize?: 'small' | 'normal' | 'large';
  lineHeight?: 'compact' | 'normal' | 'loose';
  pageWidth?: 'narrow' | 'wide';
  folderId?: string | null;
  isFavorite?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  icon?: string;
  linkBackdropToCover?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  list: 'Today' | 'Upcoming' | 'All Tasks';
  completed: boolean;
  startDate?: string;
  deadline?: string;
  createdAt: string;
  status?: 'open' | 'in progress' | 'done';
  priority?: 'low' | 'medium' | 'urgent';
  isDeleted?: boolean;
  deletedAt?: string;
  completedAt?: string;
}

