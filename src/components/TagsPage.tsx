import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDocumentStore } from '../store/documentStore';
import { useUiStore } from '../store/uiStore';
import { 
  Tag as TagIcon, 
  ArrowLeft, 
  Trash, 
  PencilSimple, 
  FileText,
  Clock,
  PlusCircle,
  Check,
  X
} from '@phosphor-icons/react';
import { cn, getItemColor } from '../lib/utils';
import { formatDisplayDate } from '../lib/time';

export const TagsPage = ({ paneId }: { paneId: string }) => {
  const documents = useDocumentStore(state => state.documents);
  const renameTag = useDocumentStore(state => state.renameTag);
  const deleteTag = useDocumentStore(state => state.deleteTag);
  const addDocument = useDocumentStore(state => state.addDocument);
  const createdTags = useDocumentStore(state => state.createdTags);
  const createTag = useDocumentStore(state => state.createTag);
  const { openDocument } = useUiStore();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tag: string } | null>(null);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [tempTagName, setTempTagName] = useState('');

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Automatically close context menu on window click
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

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
    Object.values(documents).forEach(doc => {
      doc.tags?.forEach(tag => {
        if (tag && tag.trim()) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [documents, createdTags]);

  // Compute documents belonging to the currently selected tag
  const filteredDocuments = useMemo(() => {
    if (!selectedTag) return [];
    return Object.values(documents).filter(doc => 
      doc.tags?.includes(selectedTag)
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents, selectedTag]);

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
    if (confirm(`Are you sure you want to delete the tag "${tag}" globally? This removes it from all documents.`)) {
      deleteTag(tag);
      if (selectedTag === tag) {
        setSelectedTag(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8 flex-1">
        <AnimatePresence mode="wait">
          {!selectedTag ? (
            // GRID OF ALL TAGS
            <motion.div
              key="tags-grid-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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
                      className="flex items-center gap-2 overflow-hidden bg-muted border border-border rounded-xl px-3 py-1.5 h-10 relative z-10"
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
                      className="w-10 h-10 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/80 dark:bg-purple-950/25 text-purple-600 dark:text-purple-450 flex items-center justify-center hover:bg-purple-100/80 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
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
                  <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/35 mb-4 shadow-sm">
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
                    const styleSet = getItemColor(name);
                    const isEditing = renamingTag === name;

                    return (
                      <motion.div
                        key={name}
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => !isEditing && setSelectedTag(name)}
                        onContextMenu={(e) => handleContextMenu(e, name)}
                        className={cn(
                          "w-[160px] p-5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all duration-200 min-h-[95px] relative select-none",
                          isEditing ? "bg-muted border-border cursor-default" : "hover:bg-muted/30"
                        )}
                        style={{
                          backgroundColor: isEditing ? undefined : styleSet.bg,
                          borderColor: isEditing ? undefined : styleSet.border
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
                              className="bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground font-medium outline-none focus:border-purple-500/50 transition-colors w-full"
                            />
                            <div className="text-[9px] font-mono text-muted-foreground/60 leading-none">
                              Press Enter to save, Esc to cancel
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-3 shrink-0">
                              <TagIcon size={14} weight="fill" className={cn("opacity-75 shrink-0", styleSet.text)} />
                              <span className="font-semibold text-sm text-foreground/80 truncate pr-2 leading-none">
                                {name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between shrink-0">
                              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60 font-semibold pr-1.5 leading-none">
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
            </motion.div>
          ) : (
            // FILTERED DOCUMENTS VIEW FOR SELECTED TAG
            <motion.div
              key="tag-details-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col gap-6 mb-8 relative">
                <button
                  onClick={() => setSelectedTag(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 self-start px-3 py-1.5 rounded-lg border border-border/80 bg-muted/40 transition-all cursor-pointer shadow-sm select-none"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>All Tags</span>
                </button>

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={handleCreateDocumentWithTag}
                    className="w-10 h-10 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/80 dark:bg-purple-950/25 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100/80 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer relative z-10"
                    title={`New Note with tag ${selectedTag}`}
                  >
                    <PlusCircle size={20} weight="fill" />
                  </button>
                  <div className="flex items-center gap-3">
                    <TagIcon size={28} weight="fill" className={cn(getItemColor(selectedTag || '').text)} />
                    <h1 className="text-3xl sm:text-4xl font-semibold text-foreground/90 tracking-tight font-sans">
                      {selectedTag}
                    </h1>
                  </div>
                </div>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/35 mb-4 shadow-sm">
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
                    const docColor = getItemColor(doc.title || 'Untitled');
                    return (
                      <motion.div
                        key={doc.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => openDocument(doc.id, paneId)}
                        className="p-6 rounded-xl border cursor-pointer group flex flex-col justify-between min-h-[140px] transition-all duration-150 overflow-hidden relative"
                        style={{
                          backgroundColor: docColor.bg,
                          borderColor: docColor.border,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        <div className="flex flex-col gap-3 relative z-10 w-full min-w-0">
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-lg border flex items-center justify-center transition-colors duration-300 shadow-inner",
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
                            {doc.title || 'Untitled'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono text-muted-foreground/60 font-semibold relative z-10">
                          <Clock size={12} className="opacity-70 shrink-0" />
                          <span className="truncate">{formatDisplayDate(doc.updatedAt, "MMM d, yyyy")}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tags Page Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background rounded-md py-1 min-w-[140px] shadow-2xl border border-border neu-panel"
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
    </div>
  );
};
