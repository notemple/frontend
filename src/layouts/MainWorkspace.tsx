import React, { useCallback } from 'react';
import { useUiStore } from '@/src/store/uiStore';
import { useDocumentStore } from '@/src/store/documentStore';
import { useShallow } from 'zustand/react/shallow';
import { TabBar } from './TabBar';
import { NotempleEditor } from '@/src/components/editor/NotempleEditor';
import { DailyNotesPage } from '@/src/components/DailyNotesPage';
import { TasksPage } from '@/src/components/TasksPage';
import { TagsPage } from '@/src/components/TagsPage';
import { cn, getItemColor, getFolderStyle, getFolderHexColor, TAG_COLOR_PRESETS } from '@/src/lib/utils';
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder as FolderIcon, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, Check, X, Plus, Trash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export const MainWorkspace = () => {
  const { panes, activePaneId, toggleRightSidebar, appearance, setAppearance, isRightSidebarOpen } = useUiStore();
  const { toggleSidebar } = useUiStore();

  const [dateTime, setDateTime] = React.useState(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} , ${hh}:${min}`;
  });

  React.useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      setDateTime(`${dd}/${mm}/${yy} , ${hh}:${min}`);
    };

    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeTabId = activePane?.activeTabId;

  // Use a highly optimized Zustand selector with shallow comparison to prevent ANY keystroke re-renders!
  const headerTextSelector = useCallback(
    state => {
      if (!activeTabId) return 'Home';
      if (activeTabId.startsWith('section-folder-')) {
        const folderId = activeTabId.replace('section-folder-', '');
        const folder = state.folders.find(f => f?.id === folderId);
        return folder?.name || 'Folder';
      }
      if (activeTabId === 'section-daily-notes') return 'Daily notes';
      if (activeTabId === 'section-tasks') return 'Tasks';
      if (activeTabId === 'section-tags') return 'Tags';
      if (activeTabId.startsWith('section-')) {
        const cleanId = activeTabId.replace('section-', '');
        return cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
      }
      if (activeTabId === 'new-note') return 'Untitled';
      return state.documents[activeTabId]?.title || 'Home';
    },
    [activeTabId]
  );
  const headerText = useDocumentStore(useShallow(headerTextSelector));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-workspace relative pt-0 z-10 w-full border-l border-border">
      <div className="h-14 w-full flex items-center justify-between px-6 shrink-0 bg-[image:var(--background-topbar)] dark:bg-background border-b border-border z-20">
        <div className="flex-1 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-muted-foreground/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all flex items-center justify-center rounded-md cursor-pointer"
          >
            <SidebarIcon size={18} />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/40 hover:bg-muted/70 border border-border/80 text-[11px] font-medium text-muted-foreground/90 shadow-sm transition-all duration-200 select-none group hover:border-border">
            <Clock size={13} className="text-muted-foreground/60 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-200" />
            <span className="font-mono tracking-wide leading-none">{dateTime}</span>
          </div>
        </div>
        <div className="text-[13px] font-medium text-muted-foreground flex-1 text-center font-sans tracking-wide">
          {headerText}
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Inline Theme Segmented Control */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setAppearance('light')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'light'
                  ? "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 shadow-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-blush-pop/10 dark:hover:text-blush-pop dark:hover:bg-blush-pop/5 dark:hover:border-blush-pop/10"
              )}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button
              onClick={() => setAppearance('dark')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'dark'
                  ? "bg-icy-blue/70 dark:bg-icy-blue/20 text-foreground dark:text-icy-blue border-icy-blue/50 dark:border-icy-blue/30 shadow-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-icy-blue/10 dark:hover:text-icy-blue dark:hover:bg-icy-blue/5 dark:hover:border-icy-blue/10"
              )}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setAppearance('system')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'system'
                  ? "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 shadow-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-pink-orchid/10 dark:hover:text-pink-orchid dark:hover:bg-pink-orchid/5 dark:hover:border-pink-orchid/10"
              )}
              title="System Theme"
            >
              <Monitor size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground rounded shadow-sm border border-border">
              N
            </div>
            <button className="flex items-center gap-1.5 h-6 px-3 rounded shadow-sm transition-all text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border bg-muted/40">
              <ShareFat size={12} weight="fill" />
              Share
            </button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"><Bell size={18} /></button>
            <button className="hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"><ClockCounterClockwise size={18} /></button>
            <button className={cn("transition-all duration-200 flex items-center gap-1.5 p-1.5 px-2.5 rounded-md border", isRightSidebarOpen ? "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20 shadow-inner font-semibold" : "text-muted-foreground/80 border-transparent hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/5 hover:border-sky-500/10")} onClick={toggleRightSidebar}>
              <Layout size={18} />
              <CaretDown size={12} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-workspace">
        {panes.map((pane, index) => {
          return (
            <React.Fragment key={pane.id}>
              {index > 0 && (
                <div className="w-px bg-border hover:bg-accent hover:w-[2px] transition-all cursor-col-resize shrink-0 z-10 neu-flat" />
              )}
              <div className="flex-1 flex flex-col min-w-[300px] overflow-hidden relative">
                <TabBar paneId={pane.id} />
                <div className="flex-1 overflow-hidden bg-workspace">
                  {pane.activeTabId?.startsWith('section-') ? (
                    <SectionPage paneId={pane.id} sectionId={pane.activeTabId} />
                  ) : pane.activeTabId ? (
                    <NotempleEditor key={`${pane.id}-${pane.activeTabId}`} paneId={pane.id} documentId={pane.activeTabId} />
                  ) : (
                    <EmptyPaneState />
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const SectionGridItem = React.memo(({
  itemId,
  itemType,
  paneId,
  folderColors,
  onFolderContextMenu,
}: {
  itemId: string;
  itemType: 'page' | 'folder';
  paneId: string;
  folderColors?: Record<string, string>;
  onFolderContextMenu?: (e: React.MouseEvent, folderId: string) => void;
}) => {
  const { openDocument } = useUiStore();

  const detailsSelector = useCallback(
    (state: any) => {
      if (itemType === 'folder') {
        const folder = state.folders.find((f: any) => f?.id === itemId);
        return folder ? { title: folder.name } : null;
      } else {
        const doc = state.documents[itemId];
        return doc ? { title: doc.title, type: doc.type || 'page' } : null;
      }
    },
    [itemId, itemType]
  );
  const item = useDocumentStore(useShallow(detailsSelector));

  if (!item) return null;

  // Resolve colour: prefer custom folder colour, fall back to hash-based default.
  const customStyle = itemType === 'folder' ? getFolderStyle(itemId, folderColors) : null;
  const defaultCardColor = getItemColor(item.title || 'Untitled');

  const cardBg     = customStyle ? customStyle.bg     : defaultCardColor.bg;
  const cardBorder = customStyle ? customStyle.border : defaultCardColor.border;
  const iconBg     = customStyle ? customStyle.iconBg     : defaultCardColor.iconBg;
  const iconBorder = customStyle ? customStyle.iconBorder : defaultCardColor.iconBorder;
  // Icon / text class: only used when no custom colour
  const iconTextClass = customStyle ? '' : defaultCardColor.iconText;

  // CSS vars for light/dark text when custom colour is active
  const customVars = customStyle ? {
    '--folder-text-light': (customStyle as any)['--folder-text-light'],
    '--folder-text-dark':  (customStyle as any)['--folder-text-dark'],
  } as React.CSSProperties : {};

  return (
    <div
      onClick={() => {
        if (itemType === 'folder') {
          openDocument(`section-folder-${itemId}`, paneId);
        } else {
          openDocument(itemId, paneId);
        }
      }}
      onContextMenu={itemType === 'folder' && onFolderContextMenu ? (e) => onFolderContextMenu(e, itemId) : undefined}
      className="p-6 rounded-xl border cursor-pointer group flex flex-col gap-3 transition-all duration-150 overflow-hidden relative"
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="flex flex-col gap-4 relative z-10 w-full min-w-0">
        <div
          className={cn(
            "w-10 h-10 rounded-lg border flex items-center justify-center transition-colors duration-300 shadow-inner",
            customStyle ? 'folder-element' : iconTextClass
          )}
          style={{
            backgroundColor: iconBg,
            borderColor: iconBorder,
            ...customVars,
          }}
        >
          {itemType === 'folder'
            ? <FolderIcon size={20} weight="duotone" className={customStyle ? 'text-[color:var(--folder-text)]' : ''} />
            : <FileText size={20} weight="duotone" />}
        </div>
        <span className={cn(
          "font-medium text-sm truncate transition-colors leading-none pr-1 text-foreground/80",
          customStyle ? '' : cn("group-hover:", iconTextClass)
        )}>
          {item.title || 'Untitled'}
        </span>
      </div>
    </div>
  );
});

SectionGridItem.displayName = 'SectionGridItem';


const SectionPage = ({ paneId, sectionId }: { paneId: string, sectionId: string }) => {
  const { openDocument } = useUiStore();
  const createFolder = useDocumentStore(state => state.createFolder);
  const addDocument = useDocumentStore(state => state.addDocument);
  const folderColors = useDocumentStore(state => state.folderColors) || {};
  const setFolderColor = useDocumentStore(state => state.setFolderColor);

  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');

  // Context menu for folder colour picking
  const [folderContextMenu, setFolderContextMenu] = React.useState<{
    x: number; y: number; folderId: string;
  } | null>(null);

  // Dismiss context menu on click outside
  React.useEffect(() => {
    if (!folderContextMenu) return;
    const handle = () => setFolderContextMenu(null);
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [folderContextMenu]);

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folderId });
  };

  const handleCreateFolderSubmit = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      createFolder(trimmed);
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const handleCreateDocumentInFolder = () => {
    const newId = `doc-${crypto.randomUUID()}`;
    const folderId = sectionId.replace('section-folder-', '');
    addDocument({
      id: newId,
      title: '',
      content: '',
      type: 'page',
      tags: [],
      folderId: folderId,
      updatedAt: new Date().toISOString()
    });
    openDocument(newId, paneId);
  };

  const handleCreateUncategorizedDocument = () => {
    const newId = `doc-${crypto.randomUUID()}`;
    addDocument({
      id: newId,
      title: '',
      content: '',
      type: 'page',
      tags: [],
      folderId: null,
      updatedAt: new Date().toISOString()
    });
    openDocument(newId, paneId);
  };

  const titleSelector = useCallback(
    state => {
      if (sectionId === 'section-favorites') return 'Favorites';
      if (sectionId === 'section-folders') return 'Folders';
      if (sectionId.startsWith('section-folder-')) {
        const folderId = sectionId.replace('section-folder-', '');
        const folder = state.folders.find(f => f?.id === folderId);
        return folder?.name || 'Folder';
      }
      if (sectionId === 'section-uncategorized') return 'Uncategorized';
      return '';
    },
    [sectionId]
  );
  const title = useDocumentStore(titleSelector);

  const itemsSelector = useCallback(
    state => {
      if (sectionId === 'section-favorites') {
        return state.documentOrder.filter(id => state.documents[id]?.isFavorite);
      }
      if (sectionId === 'section-folders') {
        return state.folders.filter(Boolean).map(f => f.id);
      }
      if (sectionId.startsWith('section-folder-')) {
        const folderId = sectionId.replace('section-folder-', '');
        return state.documentOrder.filter(id => state.documents[id]?.folderId === folderId);
      }
      if (sectionId === 'section-uncategorized') {
        return state.documentOrder.filter(id => {
          const doc = state.documents[id];
          return doc && !doc.folderId && !id.startsWith('daily-note-') && !id.startsWith('task-');
        });
      }
      return [];
    },
    [sectionId]
  );
  const items = useDocumentStore(useShallow(itemsSelector));

  if (sectionId === 'section-daily-notes') {
    return <DailyNotesPage paneId={paneId} />;
  }
  if (sectionId === 'section-tasks') {
    return <TasksPage paneId={paneId} />;
  }
  if (sectionId === 'section-tags') {
    return <TagsPage paneId={paneId} />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-workspace">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8 flex-1">
        <div className="flex flex-col gap-4">
          {sectionId.startsWith('section-folder-') && (
            <button
              onClick={() => openDocument('section-folders', paneId)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 self-start px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 transition-all cursor-pointer shadow-sm select-none relative z-10"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>All Folders</span>
            </button>
          )}
          <div className="flex items-center gap-4">
            {/* Show plus button only for folders, folder-id, and uncategorized */}
            {sectionId === 'section-folders' && (
              <AnimatePresence mode="wait">
                {isCreatingFolder ? (
                  <motion.div
                    key="create-folder-input"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex items-center gap-2 overflow-hidden bg-muted border border-border rounded-xl px-3 py-1.5 h-10 relative z-10"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="New folder..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFolderSubmit();
                        else if (e.key === 'Escape') {
                          setIsCreatingFolder(false);
                          setNewFolderName('');
                        }
                      }}
                      className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder-muted-foreground/60"
                    />
                    <button
                      onClick={handleCreateFolderSubmit}
                      className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 cursor-pointer"
                    >
                      <Check size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="w-10 h-10 rounded-xl border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                    title="New Folder"
                  >
                    <PlusCircle size={20} weight="fill" />
                  </button>
                )}
              </AnimatePresence>
            )}

            {sectionId.startsWith('section-folder-') && (
              <button
                onClick={handleCreateDocumentInFolder}
                className="w-10 h-10 rounded-xl border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                title="New Note in Folder"
              >
                <PlusCircle size={20} weight="fill" />
              </button>
            )}

            {sectionId === 'section-uncategorized' && (
              <button
                onClick={handleCreateUncategorizedDocument}
                className="w-10 h-10 rounded-xl border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                title="New Uncategorized Note"
              >
                <PlusCircle size={20} weight="fill" />
              </button>
            )}

            <h1 className="text-4xl font-semibold text-foreground/90 tracking-tight font-sans relative">{title}</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
          {items.map(itemId => (
            <SectionGridItem
              key={itemId}
              itemId={itemId}
              itemType={sectionId === 'section-folders' ? 'folder' : 'page'}
              paneId={paneId}
              folderColors={folderColors}
              onFolderContextMenu={sectionId === 'section-folders' ? handleFolderContextMenu : undefined}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
                <FileText size={24} weight="light" />
              </div>
              <span className="text-muted-foreground/40 text-sm">This section is empty.</span>
            </div>
          )}
        </div>
      </div>

      {/* Folder Colour Context Menu */}
      {folderContextMenu && (
        <div
          className="fixed z-50 bg-background rounded-md py-1 min-w-[160px] shadow-2xl border border-border neu-panel"
          style={{ top: folderContextMenu.y, left: folderContextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Colour Section */}
          <div className="border-b border-border px-4 py-2.5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none leading-none">Folder Color</span>
            <div className="grid grid-cols-5 gap-1.5 w-[140px]">
              {TAG_COLOR_PRESETS.map((preset) => {
                const currentHex = getFolderHexColor(folderContextMenu.folderId, folderColors);
                const isSelected = currentHex?.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    onClick={() => {
                      setFolderColor(folderContextMenu.folderId, preset.hex);
                      setFolderContextMenu(null);
                    }}
                    className="w-5 h-5 rounded-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative flex items-center justify-center"
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {isSelected && (
                      <Check size={10} weight="bold" className="text-zinc-950 font-bold" />
                    )}
                  </button>
                );
              })}

              {/* Dynamic Color Picker */}
              <label
                className="w-5 h-5 rounded-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-400 via-sky-400 to-amber-300 relative shadow-sm"
                title="Custom Color"
              >
                <input
                  type="color"
                  value={getFolderHexColor(folderContextMenu.folderId, folderColors) || '#a855f7'}
                  onChange={(e) => {
                    setFolderColor(folderContextMenu.folderId, e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <Plus size={10} className="text-white drop-shadow-md font-bold" />
              </label>
            </div>
          </div>

          {/* Reset option */}
          {getFolderHexColor(folderContextMenu.folderId, folderColors) && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
              onClick={() => {
                const newColors = { ...folderColors };
                delete newColors[folderContextMenu.folderId];
                // Use setFolderColor with an empty string as sentinel — store ignores it if we need a delete action
                // Instead directly patch store
                useDocumentStore.setState(state => {
                  const nc = { ...state.folderColors };
                  delete nc[folderContextMenu.folderId];
                  return { folderColors: nc };
                });
                setFolderContextMenu(null);
              }}
            >
              <Trash size={14} className="text-muted-foreground" />
              Reset to Default
            </button>
          )}
        </div>
      )}
    </div>
  );
};


const EmptyPaneState = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <div className="w-16 h-16 border border-border flex items-center justify-center mb-4 text-border">
        <Columns size={24} />
      </div>
      <p className="text-sm">Select a document to open in this pane.</p>
    </div>
  );
};
