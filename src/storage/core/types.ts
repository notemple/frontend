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
  documentColorType?: 'solid' | 'gradient';
  documentGradientStart?: string;
  documentGradientEnd?: string;
  documentGradientDirection?: string;
  textColor?: string;
  color?: string;
  fontFamily?: string;
  folderId?: string | null;
  isFavorite?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
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
}
