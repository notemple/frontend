import React, { useState } from 'react';
import { PopupMenu } from '@/shared/ui/PopupMenu';
import { cn } from '@/shared/lib/utils';
import { useCollectionStore } from '../store/collectionStore';
import { useUiStore } from '@/shared/store/uiStore';
import EmojiPicker from 'emoji-picker-react';

interface CreateCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

export const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  isOpen,
  onClose
}) => {
  const createCollection = useCollectionStore(state => state.createCollection);
  const openDocument = useUiStore(state => state.openDocument);
  const activePaneId = useUiStore(state => state.activePaneId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#3B82F6');
  const [description, setDescription] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const newCol = await createCollection(name.trim(), icon, color, description.trim() || undefined);
    openDocument(`section-collection-${newCol.id}`, activePaneId || undefined);
    onClose();
  };

  return (
    <PopupMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Collection"
      variant="center"
      className="!overflow-visible collection-pastel-popup"
      bodyClassName="!overflow-visible"
      backdropClassName="backdrop-blur-[2px]"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground transition-all cursor-pointer border border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
          >
            Create Collection
          </button>
        </>
      }
    >
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
        <input
          type="text"
          placeholder="e.g. Books, Recipes, Projects..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors"
          autoFocus
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
        <input
          type="text"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-muted/30 border border-border rounded px-3 py-2 text-sm w-full outline-none text-foreground focus:border-purple-500/50 transition-colors"
        />
      </div>

      {/* Icon */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon</label>
        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg border border-border bg-muted/20 hover:bg-muted/40 shadow-sm-sm cursor-pointer transition-colors"
          >
            {icon}
          </button>
          <span className="text-xs text-muted-foreground font-sans">Click the icon to choose any emoji</span>

          {showEmojiPicker && (
            <div className="absolute top-14 left-0 z-50 animate-fadeIn select-none shadow-lg border border-border rounded overflow-hidden bg-background">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setIcon(emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={
                  document.documentElement.classList.contains("dark")
                    ? "dark" as any
                    : "light" as any
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Color Theme */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color Theme</label>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full border-2 border-border shadow-sm-sm shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex gap-2 flex-wrap">
            {THEME_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all cursor-pointer",
                  color === c.hex
                    ? "border-purple-500 scale-125 shadow-sm-sm"
                    : "border-border/60 hover:scale-110"
                )}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </PopupMenu>
  );
};
