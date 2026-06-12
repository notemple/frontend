import { useDocumentStore } from '@/features/documents/store';
import { cn, getFolderActiveHexColor, getFolderHexColor } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { gsap } from 'gsap';
import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ColorPicker } from '@/shared/ui/ColorPicker';
import { TnLogo } from '@/shared/ui/TnLogo';
import {
  Book,
  CalendarBlank,
  CaretDown,
  CaretRight,
  CheckSquare,
  Eye,
  FileText,
  Gear,
  GraduationCap,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Question,
  Sparkle,
  SquaresFour,
  Star,
  Tag,
  Trash,
  User
} from '@phosphor-icons/react';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { SidebarFolderItem } from "./SidebarFolderItem";
import { SidebarItem } from "./SidebarItem";
import { useCollectionStore } from '@/features/collections/store/collectionStore';
import { CreateCollectionDialog } from '@/features/collections/components/CreateCollectionDialog';
import { PushPin } from '@phosphor-icons/react';
import { PopupMenu } from '@/shared/ui/PopupMenu';

// Optimized item for individual documents inside the sidebar list.
// By using a specific selector with useShallow, it ONLY re-renders if its own title or type changes.
// It will NEVER re-render when the user is typing content inside the editor!
const SidebarDocumentItem = ({
  docId,
  isOpen,
  isActive,
  isRenaming = false,
  onRenameComplete,
  onRenameCancel,
  onClick
}: {
  docId: string;
  isOpen: boolean;
  isActive: boolean;
  isRenaming?: boolean;
  onRenameComplete?: (newTitle: string) => void;
  onRenameCancel?: () => void;
  onClick: () => void;
}) => {
  const docSelector = React.useCallback(
    (state: any) => {
      const d = state.documents[docId];
      return d ? { title: d.title, type: d.type, icon: d.icon, cardColor: d.cardColor } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  const [tempTitle, setTempTitle] = useState(doc?.title || '');
  const originalTitleRef = React.useRef(doc?.title || '');

  // Keep track of original title when renaming starts so we can revert on Escape
  useEffect(() => {
    if (isRenaming && doc) {
      originalTitleRef.current = doc.title || '';
      setTempTitle(doc.title || '');
    }
  }, [isRenaming]);

  useEffect(() => {
    if (doc && doc.title !== tempTitle) {
      setTempTitle(doc.title || '');
    }
  }, [doc?.title]);

  if (!doc) return null;

  const cardColor = doc.cardColor || getFolderActiveHexColor(docId, {}, doc.title || 'Untitled');

  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm-sm bg-muted border border-border w-full shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 text-muted-foreground">
          {getIconForType(doc.type || 'page', doc.icon, cardColor)}
        </div>
        <input
          autoFocus
          value={tempTitle}
          onChange={(e) => {
            const val = e.target.value;
            setTempTitle(val);
            useDocumentStore.getState().updateDocument(docId, { title: val });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const finalTitle = tempTitle.trim() ? tempTitle : (originalTitleRef.current || 'Untitled');
              useDocumentStore.getState().updateDocument(docId, { title: finalTitle });
              if (onRenameComplete) onRenameComplete(finalTitle);
            } else if (e.key === 'Escape') {
              useDocumentStore.getState().updateDocument(docId, { title: originalTitleRef.current });
              if (onRenameCancel) onRenameCancel();
            }
          }}
          onBlur={() => {
            const finalTitle = tempTitle.trim() ? tempTitle : (originalTitleRef.current || 'Untitled');
            useDocumentStore.getState().updateDocument(docId, { title: finalTitle });
            if (onRenameComplete) onRenameComplete(finalTitle);
          }}
          className="bg-transparent border-none outline-none text-xs text-foreground w-full font-medium py-0.5"
        />
      </div>
    );
  }

  return (
    <SidebarItem
      icon={getIconForType(doc.type || 'page', doc.icon, cardColor)}
      label={doc.title || 'Untitled'}
      isOpen={isOpen}
      highlight={isActive}
      onClick={onClick}
      highlightColor={cardColor}
    />
  );
};
// Optimized context menu component to isolate right-click re-renders.
// It selects ONLY the specific document's isFavorite field to avoid global re-renders.
const SidebarContextMenu = ({
  contextMenu,
  handleFavoriteToggle,
  handleRename,
  handleDelete
}: {
  contextMenu: { x: number, y: number, id: string, type: 'document' | 'folder' };
  handleFavoriteToggle: () => void;
  handleRename: () => void;
  handleDelete: () => void;
}) => {
  const isFavoriteSelector = React.useCallback(
    (state: any) => state.documents[contextMenu.id]?.isFavorite || false,
    [contextMenu.id]
  );
  const isFavorite = useDocumentStore(isFavoriteSelector);

  const documentColorSelector = React.useCallback(
    (state: any) => state.documents[contextMenu.id]?.cardColor || '',
    [contextMenu.id]
  );
  const documentColor = useDocumentStore(documentColorSelector);
  const updateDocument = useDocumentStore(state => state.updateDocument);

  return (
    <div
      className="fixed z-50 bg-background neu-panel rounded-sm-sm py-1 min-w-35 shadow-sm-sm border border-border"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === 'document' && (
        <button
          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
          onClick={handleFavoriteToggle}
        >
          <Star size={14} weight={isFavorite ? "fill" : "regular"} className={isFavorite ? "text-yellow-400" : ""} />
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
      )}
      {(contextMenu.type === 'document' || contextMenu.type === 'folder') && (
        <button
          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
          onClick={handleRename}
        >
          <PencilSimple size={14} className="text-muted-foreground" />
          Rename
        </button>
      )}
      <button
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer border-t border-border"
        onClick={handleDelete}
      >
        <Trash size={14} />
        Delete
      </button>
      {contextMenu.type === 'document' && (
        <div className="border-t border-border mt-1">
          <ColorPicker
            currentColor={documentColor}
            onChange={(color) => {
              updateDocument(contextMenu.id, { cardColor: color });
            }}
            label="Document Color"
          />
        </div>
      )}
    </div>
  );
};

// Isolated list rendering for folder contents.
// By isolating folder list logic, only the affected folder re-renders when files are dragged inside.
const FolderDocumentsList = ({
  folderId,
  isOpen,
  isDocActive,
  handleDocClick,
  handleContextMenu,
  draggedItem,
  setDraggedItem,
  moveDocument,
  renamingDocId,
  onRenameComplete,
  onRenameCancel
}: {
  folderId: string;
  isOpen: boolean;
  isDocActive: (id: string) => boolean;
  handleDocClick: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string, type: 'document') => void;
  draggedItem: any;
  setDraggedItem: any;
  moveDocument: any;
  renamingDocId: string | null;
  onRenameComplete: (docId: string, newTitle: string) => void;
  onRenameCancel: () => void;
}) => {
  const docIdsSelector = React.useCallback(
    (state: any) => state.documentOrder.filter((id: string) => state.documents[id]?.folderId === folderId && !state.documents[id]?.isDeleted),
    [folderId]
  );
  const docIds = useDocumentStore(useShallow(docIdsSelector));

  return (
    <>
      {docIds.map((docId, docIndex) => (
        <div
          id={`sidebar-doc-${docId}`}
          key={docId}
          className={isOpen ? "pl-4" : "pl-0"}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedItem({ id: docId, type: 'document' });
            e.dataTransfer.setData('text/plain', docId);
            e.dataTransfer.setData('templnote/document-id', docId);
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedItem?.type === 'document' && draggedItem.id !== docId) {
              moveDocument(draggedItem.id, folderId, docIndex);
            }
            setDraggedItem(null);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            handleContextMenu(e, docId, 'document');
          }}
        >
          <SidebarDocumentItem
            docId={docId}
            isOpen={isOpen}
            isActive={isDocActive(docId)}
            isRenaming={renamingDocId === docId}
            onRenameComplete={(newTitle) => onRenameComplete(docId, newTitle)}
            onRenameCancel={onRenameCancel}
            onClick={() => handleDocClick(docId)}
          />
        </div>
      ))}
    </>
  );
};

const foldersSelector = (state: any) => state.folders.filter((f: any) => f && !f.isDeleted);
const folderOrderSelector = (state: any) => state.folderOrder;
const documentOrderSelector = (state: any) => state.documentOrder;

let lastDocumentOrderFav: any = null;
let lastDocumentsFav: any = null;
let cachedFavoriteDocIds: string[] = [];

const favoriteDocIdsSelector = (state: any) => {
  if (state.documentOrder === lastDocumentOrderFav && state.documents === lastDocumentsFav) {
    return cachedFavoriteDocIds;
  }
  lastDocumentOrderFav = state.documentOrder;
  lastDocumentsFav = state.documents;
  cachedFavoriteDocIds = state.documentOrder.filter((id: string) => state.documents[id]?.isFavorite && !state.documents[id]?.isDeleted);
  return cachedFavoriteDocIds;
};

let lastDocumentOrderUncat: any = null;
let lastDocumentsUncat: any = null;
let cachedUncategorizedDocIds: string[] = [];

const GSAPAccordion = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitial = useRef(true);
  const [initialStyle] = useState(() => ({
    height: isOpen ? "auto" : 0,
    opacity: isOpen ? 1 : 0
  }));

  useEffect(() => {
    if (containerRef.current) {
      if (isInitial.current) {
        isInitial.current = false;
      } else {
        gsap.killTweensOf(containerRef.current);
        if (isOpen) {
          gsap.fromTo(containerRef.current,
            { height: 0, opacity: 0 },
            {
              height: "auto",
              opacity: 1,
              duration: 0.22,
              ease: "power2.out"
            }
          );
        } else {
          gsap.to(containerRef.current, {
            height: 0,
            opacity: 0,
            duration: 0.18,
            ease: "power2.inOut"
          });
        }
      }
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="overflow-hidden" style={initialStyle}>
      {children}
    </div>
  );
};

const uncategorizedDocIdsSelector = (state: any) => {
  if (state.documentOrder === lastDocumentOrderUncat && state.documents === lastDocumentsUncat) {
    return cachedUncategorizedDocIds;
  }
  lastDocumentOrderUncat = state.documentOrder;
  lastDocumentsUncat = state.documents;
  cachedUncategorizedDocIds = state.documentOrder.filter((id: string) => {
    const doc = state.documents[id];
    return doc && !doc.folderId && !doc.isDeleted && !id.startsWith('daily-note-') && !id.startsWith('task-');
  });
  return cachedUncategorizedDocIds;
};

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, openDocument, panes, activePaneId, isTutorialActive, isNavbarVisible } = useUiStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
      openDocument: state.openDocument,
      panes: state.panes,
      activePaneId: state.activePaneId,
      isTutorialActive: state.isTutorialActive,
      isNavbarVisible: state.isNavbarVisible,
    }))
  );
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Stable selector references
  const folders = useDocumentStore(useShallow(foldersSelector));
  const folderOrder = useDocumentStore(useShallow(folderOrderSelector));
  const documentOrder = useDocumentStore(useShallow(documentOrderSelector));
  const favoriteDocIds = useDocumentStore(useShallow(favoriteDocIdsSelector));
  const uncategorizedDocIds = useDocumentStore(useShallow(uncategorizedDocIdsSelector));
  const folderColors = useDocumentStore(state => state.folderColors) || {};
  const collections = useCollectionStore(state => state.collections);

  // Store static references to actions so they never trigger extra re-renders.
  const createFolder = useDocumentStore(state => state.createFolder);
  const updateFolder = useDocumentStore(state => state.updateFolder);
  const deleteFolder = useDocumentStore(state => state.deleteFolder);
  const moveDocument = useDocumentStore(state => state.moveDocument);
  const moveFolder = useDocumentStore(state => state.moveFolder);
  const deleteDocument = useDocumentStore(state => state.deleteDocument);
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const addDocument = useDocumentStore(state => state.addDocument);

  const activePane = panes.find(p => p?.id === activePaneId);
  const activeDocId = activePane?.activeTabId || null;

  // Keyboard navigation cursor — separate from what's actually open in the pane.
  // Arrow keys move this; Enter commits (opens). Mouse clicks clear it.
  const [kbFocusId, setKbFocusId] = useState<string | null>(null);
  const kbFocusIdRef = useRef<string | null>(null);
  kbFocusIdRef.current = kbFocusId;

  // Highlight follows keyboard cursor when active, otherwise follows open tab
  const isDocActive = (docId: string) =>
    kbFocusId !== null ? kbFocusId === docId : activeDocId === docId;

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'document' | 'folder' } | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null);
  const [renamingCollectionName, setRenamingCollectionName] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'document' | 'folder' } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded-folders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return new Set(parsed);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return new Set<string>(['section-collections']);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-folders', JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingFolderName, setDeletingFolderName] = useState('');
  const [deletingFolderFilesCount, setDeletingFolderFilesCount] = useState(0);

  // Automatically scroll the active document into view ONLY when selection changes, replacing the CPU heavy keystroke listener!
  useEffect(() => {
    if (!activeDocId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`sidebar-doc-${activeDocId}`) || document.getElementById(`sidebar-fav-${activeDocId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeDocId]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const toggleFolderCollapse = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Keyboard navigation: ArrowUp / ArrowDown / Enter through visible sidebar items
  useEffect(() => {
    const COLLAPSIBLE_SECTIONS = new Set([
      'section-favorites',
      'section-folders',
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      const isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown';
      const isEnter = e.key === 'Enter';
      if (!isArrow && !isEnter) return;
      if (!isSidebarOpen) return;

      // Don't steal keys from inputs, textareas, or the editor
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      // Current keyboard cursor position (falls back to actually-open doc on first use)
      const { panes: livePanes, activePaneId: liveActivePaneId } = useUiStore.getState();
      const livePane = livePanes.find(p => p?.id === liveActivePaneId);
      const currentDocId = kbFocusIdRef.current ?? livePane?.activeTabId ?? null;

      // Enter: open the focused item or toggle collapse
      if (isEnter) {
        if (!currentDocId) return;
        if (COLLAPSIBLE_SECTIONS.has(currentDocId)) {
          e.preventDefault();
          toggleFolderCollapse(currentDocId);
          return;
        }
        if (currentDocId.startsWith('section-folder-')) {
          e.preventDefault();
          const folderId = currentDocId.replace('section-folder-', '');
          toggleFolderCollapse(folderId);
          return;
        }
        if (currentDocId === 'section-tutorial') {
          e.preventDefault();
          useUiStore.getState().startTutorial();
          setKbFocusId(null);
          return;
        }
        // Regular item — open it and clear the keyboard cursor
        e.preventDefault();
        openDocument(currentDocId);
        setKbFocusId(null);
        return;
      }

      e.preventDefault();

      // Build a flat ordered list of all currently-visible navigable IDs
      const ids: string[] = [
        'section-ask-ai',
        'section-daily-notes',
        'section-tasks',
        'section-tags',
        'section-glance',
        'section-wall',
      ];

      // Always include section headers; only include children when expanded
      ids.push('section-favorites');
      if (expandedFolders.has('section-favorites')) {
        ids.push(...favoriteDocIds);
      }

      ids.push('section-folders');
      if (expandedFolders.has('section-folders')) {
        for (const folderId of folderOrder) {
          ids.push(`section-folder-${folderId}`);
          if (expandedFolders.has(folderId)) {
            const { documents: docs, documentOrder: order } = useDocumentStore.getState();
            const folderDocs = order.filter(id => {
              const doc = docs[id];
              return doc && doc.folderId === folderId && !doc.isDeleted;
            });
            ids.push(...folderDocs);
          }
        }
      }

      ids.push(...uncategorizedDocIds);

      ids.push('section-trash', 'section-tutorial', 'section-help', 'section-settings');

      const currentIdx = ids.indexOf(currentDocId || '');
      let nextIdx: number;

      if (currentIdx === -1) {
        nextIdx = e.key === 'ArrowDown' ? 0 : ids.length - 1;
      } else if (e.key === 'ArrowDown') {
        nextIdx = Math.min(currentIdx + 1, ids.length - 1);
      } else {
        nextIdx = Math.max(currentIdx - 1, 0);
      }

      const nextId = ids[nextIdx];
      if (nextId) setKbFocusId(nextId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, expandedFolders, favoriteDocIds, folderOrder, uncategorizedDocIds, openDocument, toggleFolderCollapse]);




  // Track folder creation to automatically expand the parent Folders section
  const prevFolderCountRef = useRef(folderOrder.length);
  useEffect(() => {
    if (folderOrder.length > prevFolderCountRef.current) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add('section-folders');
        return next;
      });
    }
    prevFolderCountRef.current = folderOrder.length;
  }, [folderOrder.length]);

  const handleDocClick = (id: string) => {
    setKbFocusId(null); // clear keyboard cursor on mouse click
    openDocument(id);
  };

  const handleNewNoteClick = () => {
    const newId = `doc-${crypto.randomUUID()}`;
    addDocument({
      id: newId,
      title: '',
      content: '',
      type: 'page',
      tags: [],
      updatedAt: new Date().toISOString()
    });
    openDocument(newId);
  };

  const handleNewNoteInFolderClick = (folderId: string) => {
    const newId = `doc-${crypto.randomUUID()}`;
    addDocument({
      id: newId,
      title: '',
      content: '',
      type: 'page',
      tags: [],
      folderId: folderId,
      updatedAt: new Date().toISOString()
    });
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
    openDocument(newId);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'document' | 'folder') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id, type });
  };



  const handleFavoriteToggle = () => {
    if (!contextMenu || contextMenu.type !== 'document' || !contextMenu.id) return;
    const doc = useDocumentStore.getState().documents[contextMenu.id];
    if (doc) {
      updateDocument(contextMenu.id, { isFavorite: !doc.isFavorite });
    }
    setContextMenu(null);
  };

  const handleRenameTrigger = () => {
    if (!contextMenu || !contextMenu.id) return;
    if (contextMenu.type === 'document') {
      setRenamingDocId(contextMenu.id);
    } else if (contextMenu.type === 'folder') {
      setRenamingFolderId(contextMenu.id);
    }
    setContextMenu(null);
  };

  const handleRenameComplete = (docId: string, newTitle: string) => {
    if (newTitle.trim()) {
      updateDocument(docId, { title: newTitle });
    }
    setRenamingDocId(null);
  };

  const handleDelete = () => {
    if (!contextMenu || !contextMenu.id) return;
    if (contextMenu.type === 'document') {
      deleteDocument(contextMenu.id);
      setContextMenu(null);
    } else {
      const folderId = contextMenu.id;
      const folder = folders.find(f => f.id === folderId);
      const folderName = folder ? folder.name : 'Folder';
      const allDocs = useDocumentStore.getState().documents;
      const folderDocsCount = Object.values(allDocs).filter(
        (doc: any) => doc.folderId === folderId && !doc.isDeleted
      ).length;

      if (folderDocsCount > 0) {
        setDeletingFolderId(folderId);
        setDeletingFolderName(folderName);
        setDeletingFolderFilesCount(folderDocsCount);
        setDeleteFolderDialogOpen(true);
        setContextMenu(null);
      } else {
        deleteFolder(folderId);
        setContextMenu(null);
      }
    }
  };

  const handleConfirmDeleteFolder = (
    action: 'delete' | 'uncategorize' | 'move',
    targetFolderId?: string
  ) => {
    if (!deletingFolderId) return;
    deleteFolder(deletingFolderId, { type: action, targetFolderId });
    setDeleteFolderDialogOpen(false);
    setDeletingFolderId(null);
  };

  return (
    <>
    <motion.div
      ref={sidebarRef}
      className={cn("h-[calc(100%-3rem)] flex flex-col border-r border-border bg-muted absolute left-0 bottom-8 z-30 group/sidebar shadow-md", isNavbarVisible ? "top-[56px]" : "top-0")}
      initial={false}
      animate={{
        width: isSidebarOpen ? 260 : 0,
        padding: isSidebarOpen ? "24px" : "24px 0px",
        opacity: isSidebarOpen ? 1 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        mass: 0.8
      }}
      style={{
        pointerEvents: isSidebarOpen ? "auto" : "none"
      }}
    >
      <div className={cn("flex items-center mb-8 shrink-0 relative z-10 w-full", isSidebarOpen ? "justify-start px-1.5 h-11" : "justify-center px-0 h-8")}>
        {isSidebarOpen ? (
          <div className="flex items-center gap-3 transition-all whitespace-nowrap overflow-hidden">
            {/* Small periodic table logo */}
            <TnLogo className="w-8 h-8 shrink-0" glow={false} />

            {/* Stacked Branding text logo */}
            <div className="flex flex-col select-none cursor-pointer" style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
              <span
                className="text-[22px] font-black leading-none tracking-tighter lowercase bg-gradient-to-br from-[#4A90D9] via-[#D96A9E] to-[#45B88E] bg-clip-text text-transparent"
              >
                templ
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center py-1.5">
            <TnLogo className="w-7 h-7" glow={false} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 min-w-0">
        {/* Core Actions */}
        <div className="space-y-[2px]">
          <SidebarItem icon={<Plus size={16} className={isDocActive('new-note') ? "text-current" : "text-rose-500/90 dark:text-rose-400/90"} />} label="New Document" isOpen={isSidebarOpen} highlight={isDocActive('new-note')} onClick={handleNewNoteClick} activeBgClass="bg-blush-pop/90 dark:bg-blush-pop/35 border-blush-pop/75 dark:border-blush-pop/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          <SidebarItem icon={<MagnifyingGlass size={16} className="text-sky-500/80 dark:text-sky-400/80" />} label="Search" isOpen={isSidebarOpen} />

          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-daily-notes');
              e.dataTransfer.setData('templnote/document-id', 'section-daily-notes');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<CalendarBlank size={16} className={isDocActive('section-daily-notes') ? "text-current" : "text-emerald-500/90 dark:text-emerald-400/90"} />} label="Daily Notes" isOpen={isSidebarOpen} highlight={isDocActive('section-daily-notes')} onClick={() => handleDocClick('section-daily-notes')} activeBgClass="bg-icy-blue/90 dark:bg-icy-blue/35 border-icy-blue/75 dark:border-icy-blue/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-tasks');
              e.dataTransfer.setData('templnote/document-id', 'section-tasks');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem id="onboarding-tasks-tab" icon={<CheckSquare size={16} className={isDocActive('section-tasks') ? "text-current" : "text-blue-500/90 dark:text-blue-400/90"} />} label="Tasks" isOpen={isSidebarOpen} highlight={isDocActive('section-tasks')} onClick={() => handleDocClick('section-tasks')} activeBgClass="bg-sky-blue/90 dark:bg-sky-blue/35 border-sky-blue/75 dark:border-sky-blue/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-tags');
              e.dataTransfer.setData('templnote/document-id', 'section-tags');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<Tag size={16} className={isDocActive('section-tags') ? "text-current" : "text-purple-500/90 dark:text-purple-400/90"} />} label="Tags" isOpen={isSidebarOpen} highlight={isDocActive('section-tags')} onClick={() => handleDocClick('section-tags')} activeBgClass="bg-pink-orchid/90 dark:bg-pink-orchid/35 border-pink-orchid/75 dark:border-pink-orchid/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-glance');
              e.dataTransfer.setData('templnote/document-id', 'section-glance');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<Eye size={16} className={isDocActive('section-glance') ? "text-current" : "text-amber-500/90 dark:text-amber-400/90"} />} label="Glance" isOpen={isSidebarOpen} highlight={isDocActive('section-glance')} onClick={() => handleDocClick('section-glance')} activeBgClass="bg-blush-pop/90 dark:bg-blush-pop/35 border-blush-pop/75 dark:border-blush-pop/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-wall');
              e.dataTransfer.setData('templnote/document-id', 'section-wall');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<SquaresFour size={16} className={isDocActive('section-wall') ? "text-current" : "text-rose-500/90 dark:text-rose-400/90"} />} label="Wall" isOpen={isSidebarOpen} highlight={isDocActive('section-wall')} onClick={() => handleDocClick('section-wall')} activeBgClass="bg-pink-orchid/90 dark:bg-pink-orchid/35 border-pink-orchid/75 dark:border-pink-orchid/50 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
        </div>

        {/* Favorites Section */}
        <div className="space-y-[2px] group/favorites">
          {isSidebarOpen && (
            <div className={cn("flex items-center justify-between px-2 py-1 mb-1 rounded-sm transition-colors", isDocActive('section-favorites') ? "bg-muted/40" : "group-hover/favorites:bg-transparent")}>
              <div
                onClick={() => handleDocClick('section-favorites')}
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1", isDocActive('section-favorites') ? "text-rose-500 dark:text-rose-400" : "text-muted-foreground hover:text-foreground")}
              >
                Favorites
              </div>
              <button
                onClick={() => toggleFolderCollapse('section-favorites')}
                className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
              >
                {expandedFolders.has('section-favorites') ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
            </div>
          )}
          <GSAPAccordion isOpen={expandedFolders.has('section-favorites')}>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {favoriteDocIds.map(docId => (
                <div
                  id={`sidebar-fav-${docId}`}
                  key={`fav-${docId}`}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('text/plain', docId);
                    e.dataTransfer.setData('templnote/document-id', docId);
                    e.dataTransfer.effectAllowed = 'copyMove';
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, docId, 'document');
                  }}
                >
                  <SidebarDocumentItem
                    docId={docId}
                    isOpen={isSidebarOpen}
                    isActive={isDocActive(docId)}
                    isRenaming={renamingDocId === docId}
                    onRenameComplete={(newTitle) => handleRenameComplete(docId, newTitle)}
                    onRenameCancel={() => setRenamingDocId(null)}
                    onClick={() => handleDocClick(docId)}
                  />
                </div>
              ))}
            </div>
          </GSAPAccordion>
        </div>

        {/* Folders Section */}
        <div className="space-y-[2px] group/folders">
          {isSidebarOpen && (
            <div className={cn("flex items-center justify-between px-2 py-1 mb-1 rounded-sm transition-colors", isDocActive('section-folders') ? "bg-muted/40" : "group-hover/folders:bg-transparent")}>
              <div
                onClick={() => handleDocClick('section-folders')}
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1", isDocActive('section-folders') ? "text-sky-500 dark:text-sky-400" : "text-muted-foreground hover:text-foreground")}
              >
                Folders
              </div>
              <div className="flex items-center gap-1">
                <button
                  id="onboarding-create-folder-button"
                  onClick={() => createFolder('New Folder')}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-opacity flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm",
                    isTutorialActive ? "opacity-100" : "opacity-0 group-hover/folders:opacity-100"
                  )}
                  title="New Folder"
                >
                  <Plus size={12} weight="bold" />
                </button>
                <button
                  onClick={() => toggleFolderCollapse('section-folders')}
                  className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
                >
                  {expandedFolders.has('section-folders') ? <CaretDown size={14} /> : <CaretRight size={14} />}
                </button>
              </div>
            </div>
          )}

          <GSAPAccordion isOpen={expandedFolders.has('section-folders')}>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {folderOrder.map((folderId, index) => {
                const folder = folders.find(f => f?.id === folderId);
                if (!folder) return null;

                return (
                  <div
                    key={folder.id}
                    data-onboarding-folder-item={folder.id}
                    className="space-y-[2px]"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedItem({ id: folder.id, type: 'folder' });
                      const folderDocId = `section-folder-${folder.id}`;
                      e.dataTransfer.setData('text/plain', folderDocId);
                      e.dataTransfer.setData('templnote/document-id', folderDocId);
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedItem) return;
                      if (draggedItem.type === 'document') {
                        const folderDocCount = useDocumentStore.getState().documentOrder.filter(id => useDocumentStore.getState().documents[id]?.folderId === folder.id).length;
                        moveDocument(draggedItem.id, folder.id, folderDocCount);
                      } else if (draggedItem.type === 'folder' && draggedItem.id !== folder.id) {
                        moveFolder(draggedItem.id, index);
                      }
                      setDraggedItem(null);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
                  >
                    <SidebarFolderItem
                      folderId={folder.id}
                      folderName={folder.name}
                      isOpen={isSidebarOpen}
                      isRenaming={renamingFolderId === folder.id}
                      onRenameComplete={() => setRenamingFolderId(null)}
                      onRenameCancel={() => setRenamingFolderId(null)}
                      onClick={() => handleDocClick(`section-folder-${folder.id}`)}
                      highlight={isDocActive(`section-folder-${folder.id}`)}
                      folderColor={getFolderHexColor(folder.id, folderColors)}
                      rightElement={
                        <div className="flex items-center gap-1 relative z-30">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleNewNoteInFolderClick(folder.id);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-foreground p-0.5 hover:bg-muted/80 rounded-sm transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                            title="Create new note in folder"
                          >
                            <Plus size={14} />
                          </button>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFolderCollapse(folder.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                toggleFolderCollapse(folder.id);
                              }
                            }}
                            className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200 cursor-pointer"
                          >
                            {expandedFolders.has(folder.id) ? <CaretDown size={14} /> : <CaretRight size={14} />}
                          </div>
                        </div>
                      }
                    />
                    {/* Render documents inside folder with smooth transition */}
                    <GSAPAccordion isOpen={expandedFolders.has(folder.id)}>
                      <FolderDocumentsList
                        folderId={folder.id}
                        isOpen={isSidebarOpen}
                        isDocActive={isDocActive}
                        handleDocClick={handleDocClick}
                        handleContextMenu={handleContextMenu}
                        draggedItem={draggedItem}
                        setDraggedItem={setDraggedItem}
                        moveDocument={moveDocument}
                        renamingDocId={renamingDocId}
                        onRenameComplete={handleRenameComplete}
                        onRenameCancel={() => setRenamingDocId(null)}
                      />
                    </GSAPAccordion>
                  </div>
                );
              })}
            </div>
          </GSAPAccordion>
        </div>

        {/* Collections Section */}
        <div className="space-y-[2px] group/collections">
          {isSidebarOpen && (
            <div className={cn("flex items-center justify-between px-2 py-1 mb-1 rounded-sm transition-colors", isDocActive('section-collections') ? "bg-muted/40" : "group-hover/collections:bg-transparent")}>
              <div
                onClick={() => {
                  openDocument('section-collections');
                }}
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1 text-muted-foreground hover:text-foreground", isDocActive('section-collections') && "text-purple-600 dark:text-purple-400")}
              >
                Collections
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateCollection(true);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-opacity flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm cursor-pointer"
                  title="New Collection"
                >
                  <Plus size={12} weight="bold" />
                </button>
                <button
                  onClick={() => toggleFolderCollapse('section-collections')}
                  className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
                >
                  {expandedFolders.has('section-collections') ? <CaretDown size={14} /> : <CaretRight size={14} />}
                </button>
              </div>
            </div>
          )}

          <GSAPAccordion isOpen={expandedFolders.has('section-collections')}>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {Object.values(collections)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((col, index) => {
                  const sectionId = `section-collection-${col.id}`;
                  const isActive = isDocActive(sectionId);
                  return (
                    <div
                      key={col.id}
                      className="space-y-[2px]"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        // @ts-ignore
                        setDraggedItem({ id: col.id, type: 'collection' });
                        e.dataTransfer.setData('text/plain', sectionId);
                        e.dataTransfer.setData('templnote/document-id', sectionId);
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        // @ts-ignore
                        if (draggedItem && draggedItem.type === 'collection' && draggedItem.id !== col.id) {
                          const ordered = Object.values(collections)
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map(c => c.id);
                          // @ts-ignore
                          const sourceIndex = ordered.indexOf(draggedItem.id);
                          const targetIndex = ordered.indexOf(col.id);
                          if (sourceIndex > -1 && targetIndex > -1) {
                            // @ts-ignore
                            ordered.splice(sourceIndex, 1);
                            // @ts-ignore
                            ordered.splice(targetIndex, 0, draggedItem.id);
                            useCollectionStore.getState().reorderCollections(ordered);
                          }
                        }
                        setDraggedItem(null);
                      }}
                    >
                      <SidebarItem
                        id={`sidebar-col-${col.id}`}
                        label={col.name}
                        isOpen={isSidebarOpen}
                        highlight={isActive}
                        onClick={() => openDocument(sectionId)}
                        icon={<span className="text-sm">{col.icon || '📚'}</span>}
                        highlightColor={col.color}
                        rightElement={
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                useCollectionStore.getState().togglePinCollection(col.id);
                              }}
                              className={cn(
                                "p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center",
                                col.pinned ? "text-amber-500 hover:text-amber-600" : ""
                              )}
                              title={col.pinned ? "Unpin database" : "Pin database"}
                            >
                              <PushPin size={12} weight={col.pinned ? "fill" : "regular"} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingCollectionId(col.id);
                                setRenamingCollectionName(col.name);
                              }}
                              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                              title="Rename"
                            >
                              <PencilSimple size={12} />
                            </button>
                          </div>
                        }
                      />
                    </div>
                  );
                })}

              {Object.keys(collections).length === 0 && (
                <div className="py-4 text-center text-[10px] text-muted-foreground/60 italic">
                  No collections created yet
                </div>
              )}
            </div>
          </GSAPAccordion>
        </div>

        {/* Root Documents (not in a folder) */}
        <div
          className="space-y-[2px] pb-4 group/uncategorized"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedItem?.type === 'document') {
              moveDocument(draggedItem.id, null, uncategorizedDocIds.length);
            }
            setDraggedItem(null);
          }}
        >
          <div className="max-h-[320px] overflow-y-auto no-scrollbar">
            {uncategorizedDocIds.map((docId) => (
              <div
                id={`sidebar-doc-${docId}`}
                key={docId}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDraggedItem({ id: docId, type: 'document' });
                  e.dataTransfer.setData('text/plain', docId);
                  e.dataTransfer.setData('templnote/document-id', docId);
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedItem?.type === 'document' && draggedItem.id !== docId) {
                    const targetIndex = uncategorizedDocIds.indexOf(docId);
                    moveDocument(draggedItem.id, null, targetIndex);
                  }
                  setDraggedItem(null);
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, docId, 'document');
                }}
              >
                <SidebarDocumentItem
                  docId={docId}
                  isOpen={isSidebarOpen}
                  isActive={isDocActive(docId)}
                  isRenaming={renamingDocId === docId}
                  onRenameComplete={(newTitle) => handleRenameComplete(docId, newTitle)}
                  onRenameCancel={() => setRenamingDocId(null)}
                  onClick={() => handleDocClick(docId)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreateCollectionDialog
        isOpen={showCreateCollection}
        onClose={() => setShowCreateCollection(false)}
      />

      <DeleteFolderDialog
        isOpen={deleteFolderDialogOpen}
        onClose={() => setDeleteFolderDialogOpen(false)}
        folderId={deletingFolderId || ''}
        folderName={deletingFolderName}
        fileCount={deletingFolderFilesCount}
        onConfirm={handleConfirmDeleteFolder}
      />

      {/* Rename Collection Dialog */}
      <PopupMenu
        isOpen={!!renamingCollectionId}
        onClose={() => setRenamingCollectionId(null)}
        title="Rename Collection"
        variant="center"
        footer={
          <>
            <button
              onClick={() => setRenamingCollectionId(null)}
              className="px-3.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground transition-all cursor-pointer border border-border"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (renamingCollectionId && renamingCollectionName.trim()) {
                  useCollectionStore.getState().updateCollection(renamingCollectionId, {
                    name: renamingCollectionName.trim()
                  });
                  setRenamingCollectionId(null);
                }
              }}
              disabled={!renamingCollectionName.trim()}
              className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
            >
              Save
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5 font-sans text-left">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={renamingCollectionName}
            onChange={(e) => setRenamingCollectionName(e.target.value)}
            className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors animate-fadeIn"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (renamingCollectionId && renamingCollectionName.trim()) {
                  useCollectionStore.getState().updateCollection(renamingCollectionId, {
                    name: renamingCollectionName.trim()
                  });
                  setRenamingCollectionId(null);
                }
              }
            }}
          />
        </div>
      </PopupMenu>

      {/* Context Menu */}
      {contextMenu && (
        <SidebarContextMenu
          contextMenu={contextMenu}
          handleFavoriteToggle={handleFavoriteToggle}
          handleRename={handleRenameTrigger}
          handleDelete={handleDelete}
        />
      )}
    </motion.div>

      {/* Bottom Actions - Fixed outside animated sidebar */}
      <motion.div
        className={cn(
          "absolute z-40 flex flex-shrink-0 overflow-hidden",
          isSidebarOpen
            ? "flex-row items-center justify-evenly left-0 bottom-8 pt-3 border-t border-black/[0.08] dark:border-white/[0.08]"
            : "flex-col items-center gap-1.5 p-1.5 left-0 bottom-8"
        )}
        initial={false}
        animate={{
          width: isSidebarOpen ? 260 : 44,
          opacity: 1
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 26,
          mass: 0.8
        }}
      >
        {/* Trash */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'section-trash');
            e.dataTransfer.setData('templnote/document-id', 'section-trash');
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
        >
          <button
            onClick={() => handleDocClick('section-trash')}
            className={cn(
              "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]",
              isDocActive('section-trash')
                ? "bg-red-500/25 text-red-400 shadow-sm-sm border border-red-500/30"
                : "text-red-500/70 hover:bg-zinc-800/40 hover:text-red-400"
            )}
            title="Trash"
          >
            <Trash size={18} weight={isDocActive('section-trash') ? "fill" : "regular"} />
          </button>
        </div>

        {/* Tutorial */}
        <button
          id="section-tutorial"
          onClick={() => {
            useUiStore.getState().startTutorial();
          }}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]",
            isDocActive('section-tutorial')
              ? "bg-yellow-500/25 text-yellow-400 shadow-sm-sm border border-yellow-500/30"
              : "text-yellow-500/70 hover:bg-zinc-800/40 hover:text-yellow-400"
          )}
          title="Tutorial"
        >
          <GraduationCap size={18} weight={isDocActive('section-tutorial') ? "fill" : "regular"} />
        </button>

        {/* Help */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'section-help');
            e.dataTransfer.setData('templnote/document-id', 'section-help');
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
        >
          <button
            onClick={() => handleDocClick('section-help')}
            className={cn(
              "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]",
              isDocActive('section-help')
                ? "bg-teal-500/25 text-teal-400 shadow-sm-sm border border-teal-500/30"
                : "text-teal-500/70 hover:bg-zinc-800/40 hover:text-teal-400"
            )}
            title="Help"
          >
            <Question size={18} weight={isDocActive('section-help') ? "fill" : "regular"} />
          </button>
        </div>

        {/* Settings */}
        <button
          id="onboarding-settings-tab"
          onClick={() => openDocument('section-settings', activePaneId || undefined)}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]",
            isDocActive('section-settings')
              ? "bg-slate-500/25 text-slate-200 shadow-sm-sm border border-slate-500/30"
              : "text-slate-500/70 hover:bg-zinc-800/40 hover:text-slate-200"
          )}
          title="Settings"
        >
          <Gear size={18} weight={isDocActive('section-settings') ? "fill" : "regular"} />
        </button>
      </motion.div>
    </>
  );
};

function getIconForType(type: string, emoji?: string, customColor?: string) {
  if (emoji) {
    return <span className="text-[15px] font-sans leading-none flex items-center justify-center w-5 h-5 select-none">{emoji}</span>;
  }
  const style = customColor ? { color: customColor } : undefined;
  switch (type) {
    case 'page': return <FileText size={16} className={customColor ? undefined : "text-cyan-600/80 dark:text-cyan-400/80"} style={style} />;
    case 'book': return <Book size={16} className={customColor ? undefined : "text-orange-600/80 dark:text-orange-400/80"} style={style} />;
    case 'person': return <User size={16} className={customColor ? undefined : "text-purple-600/80 dark:text-purple-400/80"} style={style} />;
    default: return <FileText size={16} className={customColor ? undefined : "text-sky-600/80 dark:text-sky-400/80"} style={style} />;
  }
}
