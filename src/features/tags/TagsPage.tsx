import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow'; // Refreshed HMR import
import { 
  Tag as TagIcon, 
  ArrowLeft, 
  Trash, 
  PencilSimple, 
  FileText,
  Clock,
  PlusCircle,
  Plus,
  Check,
  X
} from '@phosphor-icons/react';
import { cn, getItemColor, getTagStyle, getTagHexColor, } from '@/shared/lib/utils';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';
import { formatDisplayDate } from '@/shared/lib/time';
import { DeleteTagDialog } from './components/DeleteTagDialog';

export const TagsPage = ({ paneId }: { paneId: string }) => {
  const renameTag = useDocumentStore(state => state.renameTag);
  const deleteTag = useDocumentStore(state => state.deleteTag);
  const addDocument = useDocumentStore(state => state.addDocument);
  const createdTags = useDocumentStore(state => state.createdTags);
  const createTag = useDocumentStore(state => state.createTag);
  const tagColors = useDocumentStore(state => state.tagColors || {});
  const setTagColor = useDocumentStore(state => state.setTagColor);
  const documents = useDocumentStore(state => state.documents);
  const openDocument = useUiStore((state) => state.openDocument);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tag: string } | null>(null);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [tempTagName, setTempTagName] = useState('');

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  // Automatically close context menu on window click
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  // Compute stable document tags list
  const docTagsList = useMemo(() => {
    return Object.values(documents)
      .filter((doc: any) => doc && !doc.isDeleted)
      .map((doc: any) => doc.tags || []);
  }, [documents]);

  // Compute filtered documents
  const filteredDocuments = useMemo(() => {
    if (!selectedTag) return [];
    return Object.values(documents)
      .filter((doc: any) => doc && !doc.isDeleted && doc.tags?.includes(selectedTag))
      .map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        updatedAt: doc.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents, selectedTag]);

  // Compute all unique tags across all documents and their counts
  const tagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Add explicitly created tags
    createdTags?.forEach(tag => {
      if (tag && tag.trim()) {
        counts[tag] = 0;
      }
    });
    // Add document tags and calculate counts
    docTagsList.forEach(tags => {
      tags.forEach(tag => {
        if (tag && tag.trim()) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [docTagsList, createdTags]);

  const handleCreateTagSubmit = () => {
    const trimmed = newTagName.trim();
    if (trimmed) {
      createTag(trimmed);
      setIsCreatingTag(false);
      setNewTagName('');
    }
  };

  const handleCreateDocumentWithTag = () => {
    if (selectedTag) {
      const newId = `doc-${crypto.randomUUID()}`;
      addDocument({
        id: newId,
        title: '',
        content: '',
        type: 'page',
        tags: [selectedTag],
        updatedAt: new Date().toISOString()
      });
      openDocument(newId, paneId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tag
    });
  };

  const startRename = (tag: string) => {
    setRenamingTag(tag);
    setTempTagName(tag);
  };

  const submitRename = (oldTag: string) => {
    const finalName = tempTagName.trim();
    if (finalName && finalName !== oldTag) {
      renameTag(oldTag, finalName);
      if (selectedTag === oldTag) {
        setSelectedTag(finalName);
      }
    }
    setRenamingTag(null);
  };

  const handleDeleteTag = (tag: string) => {
    setDeletingTag(tag);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-transparent">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8 flex-1">
          {!selectedTag ? (
            // GRID OF ALL TAGS
            <div
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-4 mb-10 relative">
                <AnimatePresence mode="wait">
                  {isCreatingTag ? (
                    <motion.div
                      key="create-tag-input"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="flex items-center gap-2 overflow-hidden bg-muted border border-border rounded-sm-sm px-3 py-1.5 h-10 relative z-10"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="New tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTagSubmit();
                          else if (e.key === 'Escape') {
                            setIsCreatingTag(false);
                            setNewTagName('');
                          }
                        }}
                        className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder-muted-foreground/60"
                      />
                      <button
                        onClick={handleCreateTagSubmit}
                        className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 cursor-pointer"
                      >
                        <Check size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingTag(false);
                          setNewTagName('');
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingTag(true)}
                      className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                      title="New Tag"
                    >
                      <PlusCircle size={20} weight="fill" />
                    </button>
                  )}
                </AnimatePresence>
                <h1 className="text-4xl font-semibold text-foreground/90 tracking-tight font-sans">Tags</h1>
              </div>


              {tagsWithCounts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center relative">
                  <div className="w-16 h-16 rounded-sm-sm bg-muted border border-border flex items-center justify-center text-muted-foreground/35 mb-4 shadow-sm-sm">
                    <TagIcon size={24} />
                  </div>
                  <h3 className="text-foreground/75 font-medium text-sm">No Tags Found</h3>
                  <p className="text-muted-foreground/50 text-xs mt-1 max-w-xs leading-relaxed">
                    Add tags to your notes in the document editor to see them organized here in a beautiful grid.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 relative">
                  {tagsWithCounts.map(({ name, count }) => {
                    const tagStyle = getTagStyle(name, tagColors);
                    const isEditing = renamingTag === name;

                    return (
                      <motion.div
                        key={name}
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => !isEditing && setSelectedTag(name)}
                        onContextMenu={(e) => handleContextMenu(e, name)}
                        className={cn(
                          "tag-element w-[160px] p-5 rounded-sm-sm border cursor-pointer flex flex-col justify-between transition-all duration-200 min-h-[95px] relative select-none",
                          isEditing ? "bg-muted border-border cursor-default" : "hover:bg-muted/30"
                        )}
                        style={{
                          backgroundColor: isEditing ? undefined : 'var(--tag-bg)',
                          borderColor: isEditing ? undefined : 'var(--tag-border)',
                          color: isEditing ? undefined : 'var(--tag-text)',
                          ...tagStyle
                        }}
                      >
                        {isEditing ? (
                          <div 
                            className="flex flex-col gap-2 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              autoFocus
                              type="text"
                              value={tempTagName}
                              onChange={(e) => setTempTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitRename(name);
                                else if (e.key === 'Escape') setRenamingTag(null);
                              }}
                              onBlur={() => submitRename(name)}
                              className="bg-background border border-border rounded-sm px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-purple-500/50 transition-colors w-full"
                            />
                            <div className="text-[9px] font-mono text-muted-foreground/60 leading-none">
                              Press Enter to save, Esc to cancel
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-3 shrink-0">
                              <TagIcon size={14} weight="fill" className="opacity-75 shrink-0 text-[color:var(--tag-text)]" />
                              <span className="font-semibold text-sm text-[color:var(--tag-text)] truncate pr-2 leading-none">
                                {name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between shrink-0">
                              <span className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--tag-text)] opacity-70 font-semibold pr-1.5 leading-none">
                                {count} {count === 1 ? 'note' : 'notes'}
                              </span>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // FILTERED DOCUMENTS VIEW FOR SELECTED TAG
            <div
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col gap-6 mb-8 relative">
                <button
                  onClick={() => setSelectedTag(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 self-start px-3 py-1.5 rounded-sm-sm border border-border/80 bg-muted/40 transition-all cursor-pointer shadow-sm-sm select-none"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>All Tags</span>
                </button>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleCreateDocumentWithTag}
                    className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                    title={`New Note with tag ${selectedTag}`}
                  >
                    <PlusCircle size={20} weight="fill" />
                  </button>
                  {selectedTag && (() => {
                    const tagStyle = getTagStyle(selectedTag, tagColors);
                    return (
                      <div className="flex items-center gap-3 tag-element" style={tagStyle}>
                        <TagIcon size={28} weight="fill" className="text-[color:var(--tag-text)]" />
                        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground/90 tracking-tight font-sans leading-none">
                          {selectedTag}
                        </h1>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center relative">
                  <div className="w-16 h-16 rounded-sm-sm bg-muted border border-border flex items-center justify-center text-muted-foreground/35 mb-4 shadow-sm-sm">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-foreground/75 font-medium text-sm">No Documents Found</h3>
                  <p className="text-muted-foreground/50 text-xs mt-1 max-w-xs leading-relaxed">
                    No notes currently contain the tag "{selectedTag}".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
                  {filteredDocuments.map(doc => {
                    const docColor = getItemColor((doc as any).title || 'Untitled');
                    return (
                      <motion.div
                        key={(doc as any).id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => openDocument((doc as any).id, paneId)}
                        className="p-6 rounded-sm-sm border cursor-pointer group flex flex-col justify-between min-h-[140px] transition-all duration-150 overflow-hidden relative"
                        style={{
                          backgroundColor: docColor.bg,
                          borderColor: docColor.border,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="flex flex-col gap-3 relative z-10 w-full min-w-0">
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-sm-sm border flex items-center justify-center transition-colors duration-300 shadow-sm-inner",
                              docColor.iconText
                            )}
                            style={{
                              backgroundColor: docColor.iconBg,
                              borderColor: docColor.iconBorder,
                            }}
                          >
                            <FileText size={20} weight="duotone" />
                          </div>
                          <span className={cn(
                            "font-medium text-sm truncate transition-colors leading-none pr-1 text-foreground/80",
                            cn("group-hover:", docColor.iconText)
                          )}>
                            {(doc as any).title || 'Untitled'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono text-muted-foreground/60 font-semibold relative z-10">
                          <Clock size={12} className="opacity-70 shrink-0" />
                          <span className="truncate">{formatDisplayDate((doc as any).updatedAt, "MMM d, yyyy")}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
      </div>

      {/* Tags Page Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background rounded-sm-sm py-1 min-w-[160px] shadow-sm-sm border border-border neu-panel"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
            onClick={() => {
              startRename(contextMenu.tag);
              setContextMenu(null);
            }}
          >
            <PencilSimple size={14} className="text-muted-foreground" />
            Rename Tag
          </button>

          {/* Custom Tag Color Selection Section */}
          <div className="border-t border-border px-4 py-2.5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none leading-none">Tag Color</span>
            <div className="grid grid-cols-5 gap-1.5 w-[140px]">
              {TAG_COLOR_PRESETS.map((preset) => {
                const isSelected = getTagHexColor(contextMenu.tag, tagColors).toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    onClick={() => {
                      setTagColor(contextMenu.tag, preset.hex);
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
                  value={getTagHexColor(contextMenu.tag, tagColors)}
                  onChange={(e) => {
                    setTagColor(contextMenu.tag, e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <Plus size={10} className="text-white drop-shadow-sm-sm font-bold" />
              </label>
            </div>
          </div>

          <button
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer border-t border-border"
            onClick={() => {
              handleDeleteTag(contextMenu.tag);
              setContextMenu(null);
            }}
          >
            <Trash size={14} />
            Delete Tag
          </button>
        </div>
      )}
      <DeleteTagDialog
        isOpen={!!deletingTag}
        tag={deletingTag || ''}
        onClose={() => setDeletingTag(null)}
        onConfirm={() => {
          if (deletingTag) {
            deleteTag(deletingTag);
            if (selectedTag === deletingTag) {
              setSelectedTag(null);
            }
            setDeletingTag(null);
          }
        }}
      />
    </div>
  );
};
