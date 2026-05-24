import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '../store/uiStore';
import { useDocumentStore } from '../store/documentStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import { SettingsDialog } from '../components/SettingsDialog';
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
  Folder as FolderIcon,
  CheckSquare
} from '@phosphor-icons/react';

// Optimized item for individual documents inside the sidebar list.
// By using a specific selector with useShallow, it ONLY re-renders if its own title or type changes.
// It will NEVER re-render when the user is typing content inside the editor!
const SidebarDocumentItem = ({
  docId,
  isOpen,
  isActive,
  onClick
}: {
  docId: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}) => {
  const docSelector = React.useCallback(
    (state: any) => {
      const d = state.documents[docId];
      return d ? { title: d.title, type: d.type } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  if (!doc) return null;

  return (
    <SidebarItem
      icon={doc.type ? getIconForType(doc.type) : undefined}
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
  handleDelete
}: {
  contextMenu: { x: number, y: number, id: string, type: 'document' | 'folder' };
  handleFavoriteToggle: () => void;
  handleDelete: () => void;
}) => {
  const isFavoriteSelector = React.useCallback(
    (state: any) => state.documents[contextMenu.id]?.isFavorite || false,
    [contextMenu.id]
  );
  const isFavorite = useDocumentStore(isFavoriteSelector);

  return (
    <div
      className="fixed z-50 bg-background neu-panel rounded-md py-1 min-w-[140px]"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.type === 'document' && (
        <button
          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
          onClick={handleFavoriteToggle}
        >
          <Star size={14} weight={isFavorite ? "fill" : "regular"} className={isFavorite ? "text-yellow-400" : ""} />
          {isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
      )}
      <button
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted flex items-center gap-2 transition-colors"
        onClick={handleDelete}
      >
        <Trash size={14} />
        Delete
      </button>
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
  moveDocument
}: {
  folderId: string;
  isOpen: boolean;
  isDocActive: (id: string) => boolean;
  handleDocClick: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string, type: 'document') => void;
  draggedItem: any;
  setDraggedItem: any;
  moveDocument: any;
}) => {
  const docIdsSelector = React.useCallback(
    (state: any) => state.documentOrder.filter((id: string) => state.documents[id]?.folderId === folderId),
    [folderId]
  );
  const docIds = useDocumentStore(useShallow(docIdsSelector));

  return (
    <>
      {docIds.map((docId, docIndex) => (
        <div
          id={`sidebar-doc-${docId}`}
          key={docId}
          className="pl-4"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedItem({ id: docId, type: 'document' });
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
          onContextMenu={(e) => { handleContextMenu(e, docId, 'document'); }}
        >
          <SidebarDocumentItem
            docId={docId}
            isOpen={isOpen}
            isActive={isDocActive(docId)}
            onClick={() => handleDocClick(docId)}
          />
        </div>
      ))}
    </>
  );
};

const foldersSelector = (state: any) => state.folders;
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
  cachedFavoriteDocIds = state.documentOrder.filter((id: string) => state.documents[id]?.isFavorite);
  return cachedFavoriteDocIds;
};

let lastDocumentOrderUncat: any = null;
let lastDocumentsUncat: any = null;
let cachedUncategorizedDocIds: string[] = [];

const uncategorizedDocIdsSelector = (state: any) => {
  if (state.documentOrder === lastDocumentOrderUncat && state.documents === lastDocumentsUncat) {
    return cachedUncategorizedDocIds;
  }
  lastDocumentOrderUncat = state.documentOrder;
  lastDocumentsUncat = state.documents;
  cachedUncategorizedDocIds = state.documentOrder.filter((id: string) => {
    const doc = state.documents[id];
    return doc && !doc.folderId && !id.startsWith('daily-note-') && !id.startsWith('task-');
  });
  return cachedUncategorizedDocIds;
};

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, openDocument, panes, activePaneId } = useUiStore();

  // Stable selector references
  const folders = useDocumentStore(useShallow(foldersSelector));
  const folderOrder = useDocumentStore(useShallow(folderOrderSelector));
  const documentOrder = useDocumentStore(useShallow(documentOrderSelector));
  const favoriteDocIds = useDocumentStore(useShallow(favoriteDocIdsSelector));
  const uncategorizedDocIds = useDocumentStore(useShallow(uncategorizedDocIdsSelector));

  // Store static references to actions so they never trigger extra re-renders.
  const createFolder = useDocumentStore(state => state.createFolder);
  const deleteFolder = useDocumentStore(state => state.deleteFolder);
  const moveDocument = useDocumentStore(state => state.moveDocument);
  const moveFolder = useDocumentStore(state => state.moveFolder);
  const deleteDocument = useDocumentStore(state => state.deleteDocument);
  const updateDocument = useDocumentStore(state => state.updateDocument);

  const activePane = panes.find(p => p?.id === activePaneId);
  const activeDocId = activePane?.activeTabId || null;

  const isDocActive = (docId: string) => activeDocId === docId;

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'document' | 'folder' } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'document' | 'folder' } | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set(['section-favorites', 'section-folders', 'section-uncategorized', ...folderOrder]));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const handleDocClick = (id: string) => {
    openDocument(id);
  };

  const handleNewNoteClick = () => {
    openDocument('new-note');
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'document' | 'folder') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id, type });
  };

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

  const handleFavoriteToggle = () => {
    if (!contextMenu || contextMenu.type !== 'document' || !contextMenu.id) return;
    const doc = useDocumentStore.getState().documents[contextMenu.id];
    if (doc) {
      updateDocument(contextMenu.id, { isFavorite: !doc.isFavorite });
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!contextMenu || !contextMenu.id) return;
    if (contextMenu.type === 'document') {
      deleteDocument(contextMenu.id);
    } else {
      deleteFolder(contextMenu.id);
    }
    setContextMenu(null);
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col border-r border-border bg-muted relative shrink-0 overflow-y-auto no-scrollbar group/sidebar z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-250 ease-out will-change-[width,padding]",
        isSidebarOpen ? "w-[260px] p-6" : "w-16 py-6 px-2"
      )}
    >
      <div className="flex items-center justify-between mb-8 shrink-0 relative z-10 px-1 h-8">
        <AnimatePresence mode="popLayout">
          {isSidebarOpen ? (
            <motion.button
              key="opened-header"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5 px-2 hover:bg-muted py-1.5 rounded-lg w-full text-left transition-all whitespace-nowrap overflow-hidden group/personal"
            >
              <div className="w-5 h-5 bg-muted flex items-center justify-center text-foreground font-bold text-[10px] shrink-0 rounded-md border border-border shadow-sm group-hover/personal:bg-muted/80 transition-all">
                N
              </div>
              <span className="font-semibold tracking-tight text-[13px] flex-1 truncate text-foreground">{"Personal Space"}</span>
              <CaretDown size={12} className="text-muted-foreground mr-2 group-hover/personal:text-foreground" />
            </motion.button>
          ) : (
            <motion.div
              key="closed-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center py-1.5"
            >
              <div className="w-6 h-6 bg-muted flex items-center justify-center text-foreground font-bold text-xs shrink-0 rounded-md border border-border shadow-sm">
                N
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        {/* Core Actions */}
        <div className="space-y-[2px]">
          <SidebarItem icon={<Plus size={16} className="text-rose-500/90 dark:text-rose-400/90" />} label="New Note" isOpen={isSidebarOpen} highlight={isDocActive('new-note')} onClick={handleNewNoteClick} customHighlightClass="text-rose-600 dark:text-rose-200 bg-rose-50/80 dark:bg-rose-950/25 border-rose-200/60 dark:border-rose-900/40" />
          <SidebarItem icon={<MagnifyingGlass size={16} className="text-sky-500/80 dark:text-sky-400/80" />} label="Search" isOpen={isSidebarOpen} />
          <SidebarItem icon={<Sparkle size={16} className="text-purple-500/90 dark:text-purple-400/90" />} label="Ask AI" isOpen={isSidebarOpen} />
          <SidebarItem icon={<CalendarBlank size={16} className="text-emerald-500/90 dark:text-emerald-400/90" />} label="Daily Notes" isOpen={isSidebarOpen} highlight={isDocActive('section-daily-notes')} onClick={() => handleDocClick('section-daily-notes')} customHighlightClass="text-emerald-700 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/60 dark:border-emerald-900/40" />
          <SidebarItem icon={<CheckSquare size={16} className="text-blue-500/90 dark:text-blue-400/90" />} label="Tasks" isOpen={isSidebarOpen} highlight={isDocActive('section-tasks')} onClick={() => handleDocClick('section-tasks')} customHighlightClass="text-blue-600 dark:text-blue-200 bg-blue-50/80 dark:bg-blue-950/25 border-blue-200/60 dark:border-blue-900/40" />
        </div>

        {/* Favorites Section */}
        <div className="space-y-[2px] group/favorites">
          {isSidebarOpen && (
            <div className="flex items-center justify-between px-2 py-1 mb-1 group-hover/favorites:bg-transparent">
              <div
                onClick={() => handleDocClick('section-favorites')}
                className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex-1"
              >
                Favorites
              </div>
              <button
                onClick={() => toggleFolderCollapse('section-favorites')}
                className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded transition-colors duration-200"
              >
                {!collapsedFolders.has('section-favorites') ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
            </div>
          )}
          <AnimatePresence>
            {!collapsedFolders.has('section-favorites') && (
              <motion.div
                key="favorites-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="max-h-[320px] overflow-y-auto no-scrollbar">
                  {favoriteDocIds.map(docId => (
                    <div id={`sidebar-fav-${docId}`} key={`fav-${docId}`} onContextMenu={(e) => handleContextMenu(e, docId, 'document')}>
                      <SidebarDocumentItem
                        docId={docId}
                        isOpen={isSidebarOpen}
                        isActive={isDocActive(docId)}
                        onClick={() => handleDocClick(docId)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Folders Section */}
        <div className="space-y-[2px] group/folders">
          {isSidebarOpen && (
            <div className="flex items-center justify-between px-2 py-1 mb-1 group-hover/folders:bg-transparent">
              <div
                onClick={() => handleDocClick('section-folders')}
                className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex-1"
              >
                Folders
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => createFolder('New Folder')}
                  className="opacity-0 group-hover/folders:opacity-100 text-muted-foreground hover:text-foreground transition-opacity flex items-center justify-center p-0.5 hover:bg-muted/80 rounded"
                  title="New Folder"
                >
                  <Plus size={12} weight="bold" />
                </button>
                <button
                  onClick={() => toggleFolderCollapse('section-folders')}
                  className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded transition-colors duration-200"
                >
                  {!collapsedFolders.has('section-folders') ? <CaretDown size={14} /> : <CaretRight size={14} />}
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {!collapsedFolders.has('section-folders') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
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
                        <SidebarItem
                          icon={<FolderIcon size={16} className="text-amber-500/80 dark:text-amber-400/80" />}
                          label={folder.name}
                          isOpen={isSidebarOpen}
                          onClick={() => toggleFolderCollapse(folder.id)}
                          rightElement={
                            <div className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded transition-colors duration-200">
                              {!collapsedFolders.has(folder.id) ? <CaretDown size={14} /> : <CaretRight size={14} />}
                            </div>
                          }
                        />
                        {/* Render documents inside folder */}
                        <AnimatePresence>
                          {!collapsedFolders.has(folder.id) && (
                            <motion.div
                              key={`folder-list-${folder.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <FolderDocumentsList
                                folderId={folder.id}
                                isOpen={isSidebarOpen}
                                isDocActive={isDocActive}
                                handleDocClick={handleDocClick}
                                handleContextMenu={handleContextMenu}
                                draggedItem={draggedItem}
                                setDraggedItem={setDraggedItem}
                                moveDocument={moveDocument}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <div className="flex items-center justify-between px-2 py-1 mb-1 group-hover/uncategorized:bg-transparent">
              <div
                onClick={() => handleDocClick('section-uncategorized')}
                className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex-1"
              >
                Uncategorized
              </div>
              <button
                onClick={() => toggleFolderCollapse('section-uncategorized')}
                className="text-muted-foreground flex items-center justify-center p-0.5 hover:bg-muted/80 rounded transition-colors duration-200"
              >
                {!collapsedFolders.has('section-uncategorized') ? <CaretDown size={14} /> : <CaretRight size={14} />}
              </button>
            </div>
          )}
          <AnimatePresence>
            {!collapsedFolders.has('section-uncategorized') && (
              <motion.div
                key="uncategorized-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
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
                      onContextMenu={(e) => handleContextMenu(e, docId, 'document')}
                    >
                      <SidebarDocumentItem
                        docId={docId}
                        isOpen={isSidebarOpen}
                        isActive={isDocActive(docId)}
                        onClick={() => handleDocClick(docId)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 mt-auto space-y-[2px] min-w-0 flex-shrink-0">
        <SidebarItem icon={<Trash size={16} className="text-red-500/70 dark:text-red-400/70" />} label="Trash" isOpen={isSidebarOpen} />
        <SidebarItem icon={<Gear size={16} className="text-slate-500/70 dark:text-slate-400/70" />} label="Settings" isOpen={isSidebarOpen} onClick={() => setIsSettingsOpen(true)} />
      </div>

      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Context Menu */}
      {contextMenu && (
        <SidebarContextMenu
          contextMenu={contextMenu}
          handleFavoriteToggle={handleFavoriteToggle}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
};

function getIconForType(type: string) {
  switch (type) {
    case 'page': return <FileText size={16} className="text-cyan-600/80 dark:text-cyan-400/80" />;
    case 'book': return <Book size={16} className="text-orange-600/80 dark:text-orange-400/80" />;
    case 'person': return <User size={16} className="text-purple-600/80 dark:text-purple-400/80" />;
    default: return <FileText size={16} className="text-sky-600/80 dark:text-sky-400/80" />;
  }
}

const SidebarItem = ({
  icon,
  label,
  isOpen,
  highlight,
  onClick,
  rightElement,
  customHighlightClass
}: {
  icon?: React.ReactNode,
  label: string,
  isOpen: boolean,
  highlight?: boolean,
  onClick?: () => void,
  rightElement?: React.ReactNode,
  customHighlightClass?: string
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 w-full px-2 py-1.5 text-[13px] outline-none group/item rounded-md transition-all duration-100 ease-out active:scale-[0.98]",
        !isOpen && "justify-center px-0 items-center",
        highlight
          ? (customHighlightClass || "text-foreground bg-muted border border-border shadow-sm font-semibold")
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {highlight && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-current rounded-r-full shadow-[0_0_4px_currentColor]" />
      )}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-5 h-5 relative z-10 transition-transform duration-100 group-hover/item:scale-[1.05]",
          highlight ? "text-current" : "text-muted-foreground group-hover/item:text-foreground"
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "flex-1 flex items-center justify-between min-w-0 transition-all duration-200 ease-out",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0 h-0 overflow-hidden"
        )}
      >
        <span className="truncate whitespace-nowrap overflow-hidden flex-1 text-left font-medium tracking-tight">
          {label}
        </span>
        {rightElement && (
          <div className="shrink-0 ml-2">
            {rightElement}
          </div>
        )}
      </div>
    </button>
  );
};
