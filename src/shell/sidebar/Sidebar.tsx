import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useShallow } from 'zustand/react/shallow';
import { cn, getFolderHexColor } from '@/shared/lib/utils';

import { DeleteFolderDialog } from './DeleteFolderDialog';
import { ColorPicker } from '@/shared/ui/ColorPicker';
import {
  MagnifyingGlass,
  CalendarBlank,
  FileText,
  Book,
  User,
  Plus,
  Gear,
  Trash,
  Star,
  Sparkle,
  CaretDown,
  CaretRight,
  Folder,
  CheckSquare,
  PencilSimple,
  Tag,
  Eye,
  SquaresFour,
  Question
} from '@phosphor-icons/react';
import { SidebarItem } from "./SidebarItem";
import { SidebarFolderItem } from "./SidebarFolderItem";
import { useSettingsStore } from '@/features/settings/store';

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

  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm-sm bg-muted border border-border w-full shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 text-muted-foreground">
          {getIconForType(doc.type || 'page', doc.icon, doc.cardColor)}
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
      icon={getIconForType(doc.type || 'page', doc.icon, doc.cardColor)}
      label={doc.title || 'Untitled'}
      isOpen={isOpen}
      highlight={isActive}
      onClick={onClick}
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

  useEffect(() => {
    if (containerRef.current) {
      if (isInitial.current) {
        gsap.set(containerRef.current, {
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        });
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
    <div ref={containerRef} className="overflow-hidden">
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
  const { isSidebarOpen, toggleSidebar, openDocument, panes, activePaneId } = useUiStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
      openDocument: state.openDocument,
      panes: state.panes,
      activePaneId: state.activePaneId,
    }))
  );

  const { spaceName, spaceIcon } = useSettingsStore(
    useShallow((state) => ({
      spaceName: state.spaceName,
      spaceIcon: state.spaceIcon,
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
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'document' | 'folder' } | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set(['section-favorites', 'section-folders', 'section-uncategorized', ...folderOrder]));

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
    setCollapsedFolders(prev => {
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
      'section-uncategorized',
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
        // Regular item — open it and clear the keyboard cursor
        e.preventDefault();
        openDocument(currentDocId);
        setKbFocusId(null);
        return;
      }

      e.preventDefault();

      // Build a flat ordered list of all currently-visible navigable IDs
      const ids: string[] = [
        'section-daily-notes',
        'section-tasks',
        'section-tags',
        'section-glance',
        'section-wall',
      ];

      // Always include section headers; only include children when expanded
      ids.push('section-favorites');
      if (!collapsedFolders.has('section-favorites')) {
        ids.push(...favoriteDocIds);
      }

      ids.push('section-folders');
      if (!collapsedFolders.has('section-folders')) {
        for (const folderId of folderOrder) {
          ids.push(`section-folder-${folderId}`);
          if (!collapsedFolders.has(folderId)) {
            const { documents: docs, documentOrder: order } = useDocumentStore.getState();
            const folderDocs = order.filter(id => {
              const doc = docs[id];
              return doc && doc.folderId === folderId && !doc.isDeleted;
            });
            ids.push(...folderDocs);
          }
        }
      }

      ids.push('section-uncategorized');
      if (!collapsedFolders.has('section-uncategorized')) {
        ids.push(...uncategorizedDocIds);
      }

      ids.push('section-trash', 'section-help', 'section-settings');

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
  }, [isSidebarOpen, collapsedFolders, favoriteDocIds, folderOrder, uncategorizedDocIds, openDocument, toggleFolderCollapse]);




  // Track folder creation to automatically uncollapse the parent Folders section
  const prevFolderCountRef = useRef(folderOrder.length);
  useEffect(() => {
    if (folderOrder.length > prevFolderCountRef.current) {
      setCollapsedFolders(prev => {
        const next = new Set(prev);
        next.delete('section-folders');
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
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      next.delete(folderId);
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
    <motion.div
      ref={sidebarRef}
      className="h-full flex flex-col border-r border-border bg-muted absolute left-0 top-0 bottom-0 z-30 overflow-y-auto no-scrollbar group/sidebar shadow-md"
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
      <div className={cn("flex items-center mb-8 shrink-0 relative z-10 h-8 w-full", isSidebarOpen ? "justify-between px-1" : "justify-center px-0")}>
          {isSidebarOpen ? (
            <button
              className="flex items-center gap-2.5 px-2 hover:bg-muted py-1.5 rounded-sm-sm w-full text-left transition-all whitespace-nowrap overflow-hidden group/personal"
            >
              <div className="w-5 h-5 bg-muted flex items-center justify-center text-foreground font-bold text-[10px] shrink-0 rounded-sm-sm border border-border shadow-sm-sm group-hover/personal:bg-muted/80 transition-all">
                {spaceIcon}
              </div>
              <span className="font-semibold tracking-tight text-[13px] flex-1 truncate text-foreground">{spaceName}</span>
              <CaretDown size={12} className="text-muted-foreground mr-2 group-hover/personal:text-foreground" />
            </button>
          ) : (
            <div
              className="w-full flex justify-center py-1.5"
            >
              <div className="w-6 h-6 bg-muted flex items-center justify-center text-foreground font-bold text-xs shrink-0 rounded-sm-sm border border-border shadow-sm-sm">
                {spaceIcon}
              </div>
            </div>
          )}
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        {/* Core Actions */}
        <div className="space-y-[2px]">
          <SidebarItem icon={<Plus size={16} className={isDocActive('new-note') ? "text-current" : "text-rose-500/90 dark:text-rose-400/90"} />} label="New Note" isOpen={isSidebarOpen} highlight={isDocActive('new-note')} onClick={handleNewNoteClick} activeBgClass="bg-blush-pop/70 dark:bg-blush-pop/20 border-blush-pop/50 dark:border-blush-pop/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          <SidebarItem icon={<MagnifyingGlass size={16} className="text-sky-500/80 dark:text-sky-400/80" />} label="Search" isOpen={isSidebarOpen} />
          <SidebarItem icon={<Sparkle size={16} className="text-purple-500/90 dark:text-purple-400/90" />} label="Ask AI" isOpen={isSidebarOpen} />
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-daily-notes');
              e.dataTransfer.setData('templnote/document-id', 'section-daily-notes');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<CalendarBlank size={16} className={isDocActive('section-daily-notes') ? "text-current" : "text-emerald-500/90 dark:text-emerald-400/90"} />} label="Daily Notes" isOpen={isSidebarOpen} highlight={isDocActive('section-daily-notes')} onClick={() => handleDocClick('section-daily-notes')} activeBgClass="bg-icy-blue/70 dark:bg-icy-blue/20 border-icy-blue/50 dark:border-icy-blue/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-tasks');
              e.dataTransfer.setData('templnote/document-id', 'section-tasks');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<CheckSquare size={16} className={isDocActive('section-tasks') ? "text-current" : "text-blue-500/90 dark:text-blue-400/90"} />} label="Tasks" isOpen={isSidebarOpen} highlight={isDocActive('section-tasks')} onClick={() => handleDocClick('section-tasks')} activeBgClass="bg-sky-blue/70 dark:bg-sky-blue/20 border-sky-blue/50 dark:border-sky-blue/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-tags');
              e.dataTransfer.setData('templnote/document-id', 'section-tags');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<Tag size={16} className={isDocActive('section-tags') ? "text-current" : "text-purple-500/90 dark:text-purple-400/90"} />} label="Tags" isOpen={isSidebarOpen} highlight={isDocActive('section-tags')} onClick={() => handleDocClick('section-tags')} activeBgClass="bg-pink-orchid/70 dark:bg-pink-orchid/20 border-pink-orchid/50 dark:border-pink-orchid/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-glance');
              e.dataTransfer.setData('templnote/document-id', 'section-glance');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<Eye size={16} className={isDocActive('section-glance') ? "text-current" : "text-amber-500/90 dark:text-amber-400/90"} />} label="Glance" isOpen={isSidebarOpen} highlight={isDocActive('section-glance')} onClick={() => handleDocClick('section-glance')} activeBgClass="bg-blush-pop/70 dark:bg-blush-pop/20 border-blush-pop/50 dark:border-blush-pop/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', 'section-wall');
              e.dataTransfer.setData('templnote/document-id', 'section-wall');
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
          >
            <SidebarItem icon={<SquaresFour size={16} className={isDocActive('section-wall') ? "text-current" : "text-rose-500/90 dark:text-rose-400/90"} />} label="Wall" isOpen={isSidebarOpen} highlight={isDocActive('section-wall')} onClick={() => handleDocClick('section-wall')} activeBgClass="bg-pink-orchid/70 dark:bg-pink-orchid/20 border-pink-orchid/50 dark:border-pink-orchid/30 border" activeTextClass="!text-black dark:!text-white font-semibold" />
          </div>
        </div>

        {/* Favorites Section */}
        <div className="space-y-[2px] group/favorites">
          {isSidebarOpen && (
            <div className={cn("flex items-center justify-between px-2 py-1 mb-1 rounded-sm transition-colors", isDocActive('section-favorites') ? "bg-muted/40" : "group-hover/favorites:bg-transparent")}>
              <div
                onClick={() => handleDocClick('section-favorites')}
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1", isDocActive('section-favorites') ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Favorites
              </div>
              <button
                onClick={() => toggleFolderCollapse('section-favorites')}
                className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
              >
                {!collapsedFolders.has('section-favorites') ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
            </div>
          )}
          <GSAPAccordion isOpen={!collapsedFolders.has('section-favorites')}>
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
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1", isDocActive('section-folders') ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Folders
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => createFolder('New Folder')}
                  className="opacity-0 group-hover/folders:opacity-100 text-muted-foreground hover:text-foreground transition-opacity flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm"
                  title="New Folder"
                >
                  <Plus size={12} weight="bold" />
                </button>
                <button
                  onClick={() => toggleFolderCollapse('section-folders')}
                  className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
                >
                  {!collapsedFolders.has('section-folders') ? <CaretDown size={14} /> : <CaretRight size={14} />}
                </button>
              </div>
            </div>
          )}

          <GSAPAccordion isOpen={!collapsedFolders.has('section-folders')}>
            <div className="max-h-[320px] overflow-y-auto no-scrollbar">
              {folderOrder.map((folderId, index) => {
                const folder = folders.find(f => f?.id === folderId);
                if (!folder) return null;

                return (
                  <div
                    key={folder.id}
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
                            {!collapsedFolders.has(folder.id) ? <CaretDown size={14} /> : <CaretRight size={14} />}
                          </div>
                        </div>
                      }
                    />
                    {/* Render documents inside folder with smooth transition */}
                    <GSAPAccordion isOpen={!collapsedFolders.has(folder.id)}>
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

        {/* Root Documents (Recents or not in a folder) */}
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
          {isSidebarOpen && (
            <div className={cn("flex items-center justify-between px-2 py-1 mb-1 rounded-sm transition-colors", isDocActive('section-uncategorized') ? "bg-muted/40" : "group-hover/uncategorized:bg-transparent")}>
              <div
                onClick={() => handleDocClick('section-uncategorized')}
                className={cn("text-xs font-semibold truncate uppercase tracking-wider cursor-pointer transition-colors flex-1", isDocActive('section-uncategorized') ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Uncategorized
              </div>
              <button
                onClick={() => toggleFolderCollapse('section-uncategorized')}
                className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded-sm transition-colors duration-200"
              >
                {!collapsedFolders.has('section-uncategorized') ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
            </div>
          )}
          <GSAPAccordion isOpen={!collapsedFolders.has('section-uncategorized')}>
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
                    onRenameCancel={( ) => setRenamingDocId(null)}
                    onClick={() => handleDocClick(docId)}
                  />
                </div>
              ))}
            </div>
          </GSAPAccordion>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 mt-auto space-y-[2px] min-w-0 flex-shrink-0">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'section-trash');
            e.dataTransfer.setData('templnote/document-id', 'section-trash');
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
        >
          <SidebarItem
            icon={<Trash size={16} className={isDocActive('section-trash') ? "text-current" : "text-red-500/70 dark:text-red-400/70"} />}
            label="Trash"
            isOpen={isSidebarOpen}
            highlight={isDocActive('section-trash')}
            onClick={() => handleDocClick('section-trash')}
            activeBgClass="bg-red-500/10 dark:bg-red-500/5 border-red-500/20 dark:border-red-500/10 border"
            activeTextClass="!text-red-600 dark:!text-red-400 font-semibold"
          />
        </div>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', 'section-help');
            e.dataTransfer.setData('templnote/document-id', 'section-help');
            e.dataTransfer.effectAllowed = 'copyMove';
          }}
        >
          <SidebarItem
            icon={<Question size={16} className={isDocActive('section-help') ? "text-current" : "text-teal-500/90 dark:text-teal-400/90"} />}
            label="Help"
            isOpen={isSidebarOpen}
            highlight={isDocActive('section-help')}
            onClick={() => handleDocClick('section-help')}
            activeBgClass="bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/50 dark:border-teal-500/30 border"
            activeTextClass="!text-teal-600 dark:!text-teal-400 font-semibold"
          />
        </div>
        <SidebarItem 
          icon={<Gear size={16} className={isDocActive('section-settings') ? "text-current" : "text-slate-500/70 dark:text-slate-400/70"} />} 
          label="Settings" 
          isOpen={isSidebarOpen} 
          highlight={isDocActive('section-settings')}
          onClick={() => openDocument('section-settings', activePaneId || undefined)} 
          activeBgClass="bg-slate-500/10 dark:bg-slate-500/5 border-slate-500/20 dark:border-slate-500/10 border"
          activeTextClass="!text-slate-600 dark:!text-slate-400 font-semibold"
        />
      </div>

      <DeleteFolderDialog
        isOpen={deleteFolderDialogOpen}
        onClose={() => setDeleteFolderDialogOpen(false)}
        folderId={deletingFolderId || ''}
        folderName={deletingFolderName}
        fileCount={deletingFolderFilesCount}
        onConfirm={handleConfirmDeleteFolder}
      />

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
