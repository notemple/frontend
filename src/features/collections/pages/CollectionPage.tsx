import React, { useState, useEffect, useMemo } from 'react';
import { useCollectionStore } from '../store/collectionStore';
import { TableView } from '../components/TableView';
import type { ViewType } from '../types';
import { 
  Database, Trash, Copy, PushPin, 
  Table, List, Image, Calendar, Kanban,
  Warning 
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { PopupMenu } from '@/shared/ui/PopupMenu';
import { useUiStore } from '@/shared/store/uiStore';

interface CollectionPageProps {
  paneId: string;
  collectionId: string;
}

const EMOJI_PRESETS = ['📚', '🍳', '💼', '📈', '📝', '✈️', '🎵', '🍿', '💡', '🏷️', '🗺️', '🎯', '❤️', '🏡', '🚗', '🛍️'];

export const CollectionPage: React.FC<CollectionPageProps> = ({ paneId, collectionId }) => {
  const collections = useCollectionStore(state => state.collections);
  const viewStates = useCollectionStore(state => state.viewStates);
  const updateCollection = useCollectionStore(state => state.updateCollection);
  const deleteCollection = useCollectionStore(state => state.deleteCollection);
  const duplicateCollection = useCollectionStore(state => state.duplicateCollection);
  const togglePinCollection = useCollectionStore(state => state.togglePinCollection);
  const setActiveView = useCollectionStore(state => state.setActiveView);

  const openDocument = useUiStore(state => state.openDocument);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameDesc, setRenameDesc] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const collection = collections[collectionId];
  const viewState = viewStates[collectionId];

  useEffect(() => {
    if (collection) {
      setRenameName(collection.name);
      setRenameDesc(collection.description || '');
    }
  }, [collectionId, collection]);

  const viewTabs: { type: ViewType; label: string; icon: React.ReactNode }[] = [
    { type: 'table', label: 'Table', icon: <Table size={13} /> },
    { type: 'list', label: 'List', icon: <List size={13} /> },
    { type: 'gallery', label: 'Gallery', icon: <Image size={13} /> },
    { type: 'calendar', label: 'Calendar', icon: <Calendar size={13} /> },
    { type: 'board', label: 'Board', icon: <Kanban size={13} /> }
  ];

  const TAB_COLOR_SCHEMES = [
    { active: "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 font-bold", indicator: "bg-blush-pop dark:bg-blush-pop" },
    { active: "bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue/50 dark:border-sky-blue/30 font-bold", indicator: "bg-sky-blue dark:bg-sky-blue" },
    { active: "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 font-bold", indicator: "bg-pink-orchid dark:bg-pink-orchid" },
    { active: "bg-rose-100/80 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 font-bold", indicator: "bg-rose-400 dark:bg-rose-400" },
    { active: "bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 font-bold", indicator: "bg-emerald-400 dark:bg-emerald-400" },
  ];

  const tabSchemes = useMemo(
    () => viewTabs.map((_, i) => TAB_COLOR_SCHEMES[i]),
    []
  );

  const handleOpenRename = () => {
    setRenameName(collection.name);
    setRenameDesc(collection.description || '');
    setIsRenameOpen(true);
  };

  const handleSaveRename = () => {
    if (renameName.trim()) {
      updateCollection(collectionId, {
        name: renameName.trim(),
        description: renameDesc.trim() || undefined
      });
      setIsRenameOpen(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    updateCollection(collectionId, { icon: emoji });
    setShowEmojiPicker(false);
  };

  const handleDuplicate = async () => {
    await duplicateCollection(collectionId);
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteOpen(false);
    await deleteCollection(collectionId);
    openDocument('section-collections', paneId);
  };

  if (!collection || !viewState) return null;

  const activeView = viewState.activeView || 'table';

  // Resolve styling tokens from the right sidebar state
  const wrapperStyle: React.CSSProperties = {};
  if (collection.backdropType && collection.backdropType !== 'none' && collection.backdropColor) {
    wrapperStyle.background = collection.backdropColor;
  }

  const bannerStyle: React.CSSProperties = {};
  if (collection.topSectionColor) {
    bannerStyle.background = collection.topSectionColor;
  } else {
    bannerStyle.background = `linear-gradient(to bottom, ${collection.color || '#3B82F6'}25, transparent)`;
  }

  const titleStyle: React.CSSProperties = {};
  if (collection.topSectionTextColor) {
    titleStyle.color = collection.topSectionTextColor;
  } else {
    titleStyle.color = 'var(--foreground)';
  }

  const resolvedFontFamily = collection.fontFamily === 'sans' ? 'var(--font-sans)' :
                             collection.fontFamily === 'serif' ? 'var(--font-serif)' :
                             collection.fontFamily === 'sans-serif' ? 'var(--font-sans)' :
                             collection.fontFamily === 'monospace' ? 'var(--font-mono)' :
                             undefined;

  if (resolvedFontFamily) {
    titleStyle.fontFamily = resolvedFontFamily;
  }

  const pageTextStyle: React.CSSProperties = {};
  let resolvedTextColor = collection.linkBackdropToCover ? collection.topSectionTextColor : collection.textColor;
  if (resolvedTextColor) {
    pageTextStyle.color = resolvedTextColor;
    (pageTextStyle as any)['--body-text'] = resolvedTextColor;
    (pageTextStyle as any)['--foreground'] = resolvedTextColor;
  }
  if (resolvedFontFamily) {
    pageTextStyle.fontFamily = resolvedFontFamily;
  }

  // Formatting styles mapping for collections
  const resolvedBaseFontSize = collection.fontSize === 'small' ? '14px' :
                               collection.fontSize === 'large' ? '18px' :
                               '16px';
  (pageTextStyle as any)['--editor-base-size'] = resolvedBaseFontSize;

  const resolvedLineHeightParagraph = collection.lineHeight === 'compact' ? '1.5' :
                                      collection.lineHeight === 'loose' ? '2.25' :
                                      '1.95';
  (pageTextStyle as any)['--editor-line-height-paragraph'] = resolvedLineHeightParagraph;

  // Narrow vs Wide Page Width constraint (narrow maps to 720px max width, wide maps to 90%)
  const maxWidthClass = collection.pageWidth === 'narrow' ? 'max-w-[720px]' : 'max-w-[90%]';

  return (
    <div 
      className="flex-1 flex flex-col overflow-y-auto no-scrollbar transition-all duration-300 relative w-full"
      style={wrapperStyle}
    >
      {/* Cover Banner */}
      <div 
        className="w-full min-h-[7rem] py-6 shrink-0 relative flex items-center justify-center transition-all duration-300 select-none"
        style={bannerStyle}
      >
        {/* Actions panel */}
        <div className="absolute top-4 right-6 flex items-center gap-2 select-none z-10">
          <button
            onClick={() => togglePinCollection(collectionId)}
            className={cn(
              "p-1.5 rounded-sm border transition-all cursor-pointer flex items-center justify-center shadow-sm-sm",
              collection.pinned
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 hover:bg-blush-pop/80 dark:hover:bg-blush-pop/35"
            )}
            title={collection.pinned ? "Unpin database" : "Pin database to sidebar"}
          >
            <PushPin size={13} weight={collection.pinned ? "fill" : "regular"} />
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue/50 dark:border-sky-blue/30 hover:bg-sky-blue/80 dark:hover:bg-sky-blue/35 rounded-sm border transition-all cursor-pointer flex items-center justify-center shadow-sm-sm"
            title="Duplicate database"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-rose-100/80 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 hover:bg-rose-200/80 dark:hover:bg-rose-500/30 rounded-sm border transition-all cursor-pointer flex items-center justify-center shadow-sm-sm"
            title="Delete database"
          >
            <Trash size={13} />
          </button>
        </div>
      </div>

      {/* Main Page Layout Container */}
      <div className="flex-1 w-full flex flex-col items-center select-text">
        <div 
          className={cn("w-full flex flex-col gap-6 px-6 md:px-8 pb-12 pt-4 flex-1", maxWidthClass)}
          style={pageTextStyle}
        >
          {/* Header Area with Emoji, Title and Description */}
          <div className="flex flex-col items-start gap-3 w-full z-10 mt-[-40px]">
            
            {/* Emoji Button */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-16 h-16 rounded-xl border border-border bg-background shadow-md hover:scale-105 active:scale-95 flex items-center justify-center text-4xl cursor-pointer transition-transform duration-150 select-none"
                title="Change icon"
              >
                {collection.icon || '📚'}
              </button>

              {showEmojiPicker && (
                <div className="absolute top-18 left-0 z-50 bg-background border border-border rounded shadow-lg p-3 grid grid-cols-4 gap-2 w-48 animate-fadeIn select-none">
                  {EMOJI_PRESETS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => handleEmojiSelect(e)}
                      className="text-xl hover:bg-muted rounded p-1 transition-colors cursor-pointer text-center"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="w-full flex flex-col gap-2 min-w-0">
              <div className="w-full flex flex-col">
                <h1 
                  onClick={handleOpenRename}
                  className="w-full bg-transparent border-none outline-none text-4xl font-bold font-sans tracking-tight drop-shadow-md cursor-pointer hover:bg-muted/10 rounded px-1 -ml-1 transition-colors truncate"
                  style={titleStyle}
                >
                  {collection.name || "Untitled Database"}
                </h1>
              </div>

              {/* Description */}
              <div className="w-full">
                <p 
                  onClick={handleOpenRename}
                  className={cn(
                    "text-sm cursor-pointer hover:bg-muted/10 rounded px-1 -ml-1 transition-colors max-w-lg leading-relaxed opacity-85",
                    collection.description ? "" : "text-muted-foreground/40 italic"
                  )}
                >
                  {collection.description || "Add description..."}
                </p>
              </div>
            </div>

          </div>

          {/* Views Tabs Segment */}
          <div className="flex items-center gap-1.5 shrink-0 select-none pt-2 pb-2">
            {viewTabs.map((tab, i) => {
              const isTabActive = activeView === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveView(collectionId, tab.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-sm-sm border text-xs font-semibold transition-all duration-250 ease-out outline-none relative hover:border-muted-foreground/30 cursor-pointer",
                    isTabActive
                      ? tabSchemes[i].active
                      : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isTabActive && (
                    <div className={cn("absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm-full shadow-sm-sm", tabSchemes[i].indicator)} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active View Content Container */}
          <div className="flex-1 w-full">
            {activeView === 'table' ? (
              <TableView collectionId={collectionId} />
            ) : (
              <div className="w-full flex flex-col items-center justify-center p-12 select-none border border-dashed border-border rounded-xl">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-3 animate-bounce">
                  {viewTabs.find(t => t.type === activeView)?.icon}
                </div>
                <span className="text-xs font-semibold text-foreground/80">
                  {viewTabs.find(t => t.type === activeView)?.label} View Architecture Prepared
                </span>
                <span className="text-[10px] text-muted-foreground/60 mt-1 max-w-xs text-center leading-relaxed font-mono">
                  This layout configuration is registered in the database view state. The engine is ready to implement it.
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rename popup dialog */}
      <PopupMenu
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Rename Collection"
        variant="center"
        footer={
          <>
            <button
              onClick={() => setIsRenameOpen(false)}
              className="px-3.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground transition-all cursor-pointer border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRename}
              disabled={!renameName.trim()}
              className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 font-sans text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="bg-muted/35 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              value={renameDesc}
              onChange={(e) => setRenameDesc(e.target.value)}
              placeholder="Add description..."
              className="bg-muted/35 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors resize-none h-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveRename();
                }
              }}
            />
          </div>
        </div>
      </PopupMenu>

      {/* Delete confirmation popup dialog */}
      <PopupMenu
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Database"
        variant="center"
        footer={
          <>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-3.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground transition-all cursor-pointer border border-border"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
            >
              Delete Database
            </button>
          </>
        }
      >
        <div className="flex gap-4 font-sans text-left items-start p-1">
          <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 shrink-0">
            <Warning size={24} weight="fill" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete the database <span className="font-semibold text-foreground">"{collection.name}"</span> and all of its fields and row data. This action cannot be undone.
            </p>
          </div>
        </div>
      </PopupMenu>
    </div>
  );
};
