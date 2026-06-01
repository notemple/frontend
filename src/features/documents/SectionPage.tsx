
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { DailyNotesPage } from '@/features/daily-notes/DailyNotesPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TagsPage } from '@/features/tags/TagsPage';
import { TrashPage } from '@/features/trash/TrashPage';
import { cn, getItemColor, getFolderStyle, getFolderHexColor } from '@/shared/lib/utils';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, Check, X, Plus, Trash } from '@phosphor-icons/react';
import { useShallow } from 'zustand/react/shallow';
import { SectionGridItem } from './components/SectionGridItem';
import { ColorPicker } from '@/shared/ui/ColorPicker';

const EMPTY_ARRAY: any[] = [];

export const SectionPage = ({ paneId, sectionId }: { paneId: string, sectionId: string }) => {
  const openDocument = useUiStore(state => state.openDocument);
  const createFolder = useDocumentStore(state => state.createFolder);
  const addDocument = useDocumentStore(state => state.addDocument);
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const folderColors = useDocumentStore(state => state.folderColors) || {};
  const setFolderColor = useDocumentStore(state => state.setFolderColor);

  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');

  // Context menu for folder colour picking
  const [folderContextMenu, setFolderContextMenu] = React.useState<{
    x: number; y: number; folderId: string;
  } | null>(null);

  // Context menu for document colour picking
  const [documentContextMenu, setDocumentContextMenu] = React.useState<{
    x: number; y: number; docId: string;
  } | null>(null);

  // Dismiss context menu on click outside
  React.useEffect(() => {
    if (!folderContextMenu && !documentContextMenu) return;
    const handle = () => {
      setFolderContextMenu(null);
      setDocumentContextMenu(null);
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [folderContextMenu, documentContextMenu]);

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folderId });
  };

  const handleDocumentContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDocumentContextMenu({ x: e.clientX, y: e.clientY, docId });
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

  const documentOrder = useDocumentStore(useShallow((state: any) => state.documentOrder || EMPTY_ARRAY));
  const documents = useDocumentStore(useShallow((state: any) => state.documents));
  const folders = useDocumentStore(useShallow((state: any) => state.folders || EMPTY_ARRAY));

  const items = React.useMemo(() => {
    if (sectionId === 'section-favorites') {
      return documentOrder.filter(id => documents[id]?.isFavorite && !documents[id]?.isDeleted);
    }
    if (sectionId === 'section-folders') {
      return folders.filter(Boolean).filter((f: any) => !f.isDeleted).map(f => f.id);
    }
    if (sectionId.startsWith('section-folder-')) {
      const folderId = sectionId.replace('section-folder-', '');
      return documentOrder.filter(id => documents[id]?.folderId === folderId && !documents[id]?.isDeleted);
    }
    if (sectionId === 'section-uncategorized') {
      return documentOrder.filter(id => {
        const doc = documents[id];
        return doc && !doc.folderId && !doc.isDeleted && !id.startsWith('daily-note-') && !id.startsWith('task-');
      });
    }
    return EMPTY_ARRAY;
  }, [sectionId, documentOrder, documents, folders]);

  if (sectionId === 'section-daily-notes') {
    return <DailyNotesPage paneId={paneId} />;
  }
  if (sectionId === 'section-tasks') {
    return <TasksPage paneId={paneId} />;
  }
  if (sectionId === 'section-tags') {
    return <TagsPage paneId={paneId} />;
  }
  if (sectionId === 'section-trash') {
    return <TrashPage paneId={paneId} />;
  }
  if (sectionId === 'section-glance') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-8 bg-transparent select-none font-sans">
        <h1 className="text-4xl font-bold tracking-tight text-foreground/80 mb-2">Glance</h1>
        <p className="text-muted-foreground text-sm font-medium">Blank Page</p>
      </div>
    );
  }
  if (sectionId === 'section-wall') {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-8 bg-transparent select-none font-sans">
        <h1 className="text-4xl font-bold tracking-tight text-foreground/80 mb-2">Wall</h1>
        <p className="text-muted-foreground text-sm font-medium">Blank Page</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-transparent">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      <div
        className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8 flex-1"
      >
        <div className="flex flex-col gap-4">
          {sectionId.startsWith('section-folder-') && (
            <button
              onClick={() => openDocument('section-folders', paneId)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 self-start px-3 py-1.5 rounded-sm-sm border border-border/80 bg-muted/40 transition-all cursor-pointer shadow-sm-sm select-none relative z-10"
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
                    className="flex items-center gap-2 overflow-hidden bg-muted border border-border rounded-sm-sm px-3 py-1.5 h-10 relative z-10"
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
                    className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
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
                className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                title="New Note in Folder"
              >
                <PlusCircle size={20} weight="fill" />
              </button>
            )}

            {sectionId === 'section-uncategorized' && (
              <button
                onClick={handleCreateUncategorizedDocument}
                className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
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
              onDocumentContextMenu={sectionId !== 'section-folders' ? handleDocumentContextMenu : undefined}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-sm-sm bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
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
          className="fixed z-50 bg-background rounded-sm-sm py-1 min-w-[160px] shadow-sm-sm border border-border neu-panel"
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
                    }}
                    className="w-5 h-5 rounded-sm-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative flex items-center justify-center"
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
                className="w-5 h-5 rounded-sm-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-400 via-sky-400 to-amber-300 relative shadow-sm-sm"
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
                <Plus size={10} className="text-white drop-shadow-sm-sm font-bold" />
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
      {/* Document Colour Context Menu */}
      {documentContextMenu && (
        <div
          className="fixed z-50 bg-background rounded-sm-sm py-1 min-w-[160px] shadow-sm-sm border border-border neu-panel"
          style={{ top: documentContextMenu.y, left: documentContextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ColorPicker
            currentColor={documents[documentContextMenu.docId]?.cardColor || ''}
            onChange={(color) => {
              updateDocument(documentContextMenu.docId, { cardColor: color });
            }}
            label="Document Color"
          />
          {/* Reset option */}
          {documents[documentContextMenu.docId]?.cardColor && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
              onClick={() => {
                updateDocument(documentContextMenu.docId, { cardColor: undefined });
                setDocumentContextMenu(null);
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
