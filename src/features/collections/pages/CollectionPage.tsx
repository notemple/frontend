import React, { useState, useEffect } from 'react';
import { useCollectionStore } from '../store/collectionStore';
import { TableView } from '../components/TableView';
import type { ViewType } from '../types';
import { 
  Database, Trash, Copy, PushPin, 
  Table, List, Image, Calendar, Kanban 
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface CollectionPageProps {
  paneId: string;
  collectionId: string;
}

const EMOJI_PRESETS = ['📚', '🍳', '💼', '📈', '📝', '✈️', '🎵', '🍿', '💡', '🏷️', '🗺️', '🎯', '❤️', '🏡', '🚗', '🛍️'];

const THEME_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Indigo', hex: '#6366F1' }
];

export const CollectionPage: React.FC<CollectionPageProps> = ({ paneId, collectionId }) => {
  const collections = useCollectionStore(state => state.collections);
  const viewStates = useCollectionStore(state => state.viewStates);
  const updateCollection = useCollectionStore(state => state.updateCollection);
  const deleteCollection = useCollectionStore(state => state.deleteCollection);
  const duplicateCollection = useCollectionStore(state => state.duplicateCollection);
  const togglePinCollection = useCollectionStore(state => state.togglePinCollection);
  const setActiveView = useCollectionStore(state => state.setActiveView);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const collection = collections[collectionId];
  const viewState = viewStates[collectionId];

  useEffect(() => {
    if (collection) {
      setNameInput(collection.name);
      setDescInput(collection.description || '');
    }
  }, [collectionId, collection]);

  if (!collection || !viewState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-workspace">
        <Database size={32} className="text-muted-foreground/30 animate-spin" />
        <span className="text-xs text-muted-foreground mt-2">Loading database...</span>
      </div>
    );
  }

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput.trim() !== collection.name) {
      updateCollection(collectionId, { name: nameInput.trim() });
    }
  };

  const handleDescBlur = () => {
    setIsEditingDesc(false);
    if (descInput !== (collection.description || '')) {
      updateCollection(collectionId, { description: descInput.trim() || undefined });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    updateCollection(collectionId, { icon: emoji });
    setShowEmojiPicker(false);
  };

  const handleColorSelect = (hex: string) => {
    updateCollection(collectionId, { color: hex });
    setShowColorPicker(false);
  };

  const handleDuplicate = async () => {
    await duplicateCollection(collectionId);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete database "${collection.name}"? This deletes the entire schema and all row data.`)) {
      await deleteCollection(collectionId);
    }
  };

  const activeView = viewState.activeView || 'table';

  const viewTabs: { type: ViewType; label: string; icon: React.ReactNode }[] = [
    { type: 'table', label: 'Table', icon: <Table size={13} /> },
    { type: 'list', label: 'List', icon: <List size={13} /> },
    { type: 'gallery', label: 'Gallery', icon: <Image size={13} /> },
    { type: 'calendar', label: 'Calendar', icon: <Calendar size={13} /> },
    { type: 'board', label: 'Board', icon: <Kanban size={13} /> }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-workspace font-sans">
      
      {/* Dynamic Cover Banner based on Collection color */}
      <div 
        className="h-[80px] w-full shrink-0 relative transition-colors duration-300"
        style={{
          background: `linear-gradient(to bottom, ${collection.color}25, transparent)`
        }}
      >
        {/* Actions panel */}
        <div className="absolute top-4 right-6 flex items-center gap-2 select-none">
          <button
            onClick={() => togglePinCollection(collectionId)}
            className={cn(
              "p-1.5 rounded-sm border transition-all cursor-pointer flex items-center justify-center shadow-sm-sm",
              collection.pinned
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border hover:text-foreground"
            )}
            title={collection.pinned ? "Unpin database" : "Pin database to sidebar"}
          >
            <PushPin size={13} weight={collection.pinned ? "fill" : "regular"} />
          </button>
          <button
            onClick={handleDuplicate}
            className="p-1.5 bg-muted/40 hover:bg-muted border border-border rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center shadow-sm-sm"
            title="Duplicate database"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-muted/40 hover:bg-red-500/10 border border-border hover:border-red-500/20 rounded-sm text-muted-foreground hover:text-red-500 transition-all cursor-pointer flex items-center justify-center shadow-sm-sm"
            title="Delete database"
          >
            <Trash size={13} />
          </button>
        </div>
      </div>

      {/* Title & Description Panel */}
      <div className="px-8 pb-3 flex flex-col gap-2 shrink-0 select-none">
        <div className="flex items-start gap-4">
          
          {/* Emoji button */}
          <div className="relative mt-[-30px]">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-16 h-16 rounded-xl border border-border bg-background shadow-sm-lg hover:scale-105 active:scale-95 flex items-center justify-center text-3xl cursor-pointer transition-transform duration-150"
              title="Change icon"
            >
              {collection.icon || '📚'}
            </button>

            {showEmojiPicker && (
              <div className="absolute top-18 left-0 z-[100] bg-background border border-border rounded shadow-sm-lg p-3 grid grid-cols-4 gap-2 w-48 animate-fadeIn">
                {EMOJI_PRESETS.map(e => (
                  <button
                    key={e}
                    onClick={() => handleEmojiSelect(e)}
                    className="text-xl hover:bg-muted rounded p-1 transition-colors cursor-pointer text-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color picker bubble */}
          <div className="relative mt-[-20px]">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-5 h-5 rounded-full border border-border/80 hover:scale-110 active:scale-95 cursor-pointer shadow-sm-sm transition-transform"
              style={{ backgroundColor: collection.color }}
              title="Change color theme"
            />

            {showColorPicker && (
              <div className="absolute top-7 left-0 z-[100] bg-background border border-border rounded shadow-sm-lg p-2 grid grid-cols-4 gap-1.5 w-36 animate-fadeIn">
                {THEME_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => handleColorSelect(c.hex)}
                    className="w-5 h-5 rounded-full border border-border/60 hover:scale-115 cursor-pointer transition-transform"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Database Name */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameBlur(); }}
                className="text-2xl font-bold bg-transparent border-b border-purple-500/50 outline-none text-foreground/90 w-full"
                autoFocus
              />
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                className="text-2xl font-bold text-foreground/90 tracking-tight cursor-pointer hover:bg-muted/10 rounded px-1 -ml-1 transition-colors truncate max-w-md"
              >
                {collection.name}
              </h1>
            )}
          </div>
        </div>

        {/* Database Description */}
        <div className="ml-20">
          {isEditingDesc ? (
            <input
              type="text"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDescBlur(); }}
              placeholder="Add description..."
              className="text-xs text-muted-foreground bg-transparent border-b border-border/50 outline-none w-full max-w-lg"
              autoFocus
            />
          ) : (
            <p 
              onClick={() => setIsEditingDesc(true)}
              className={cn(
                "text-xs cursor-pointer hover:bg-muted/10 rounded px-1 -ml-1 transition-colors max-w-lg leading-relaxed",
                collection.description ? "text-muted-foreground" : "text-muted-foreground/40 italic"
              )}
            >
              {collection.description || "Add description..."}
            </p>
          )}
        </div>
      </div>

      {/* Views Tabs segment */}
      <div className="px-8 border-b border-border/80 bg-muted/10 flex items-center gap-1.5 shrink-0 select-none pt-2">
        {viewTabs.map(tab => {
          const isTabActive = activeView === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveView(collectionId, tab.type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition-all cursor-pointer relative",
                isTabActive
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                  : "border-transparent text-muted-foreground/85 hover:text-foreground hover:border-border"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE VIEW RENDERER */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'table' ? (
          <TableView collectionId={collectionId} />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-12 bg-workspace select-none">
            <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-3 animate-bounce">
              {viewTabs.find(t => t.type === activeView)?.icon}
            </div>
            <span className="text-xs font-semibold text-foreground/80">
              {viewTabs.find(t => t.type === activeView)?.label} View Architecture Prepared
            </span>
            <span className="text-[10px] text-muted-foreground/60 mt-1 max-w-xs text-center leading-relaxed">
              This layout configuration is registered in the database view state. The engine is ready to implement it.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
