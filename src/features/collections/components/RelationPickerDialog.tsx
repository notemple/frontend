import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { useCollectionStore } from '../store/collectionStore';
import { MagnifyingGlass, FileText, CheckSquare, Tag, Database, Check } from '@phosphor-icons/react';
import { PopupMenu } from '@/shared/ui/PopupMenu';
import { cn } from '@/shared/lib/utils';

interface RelationPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'document-relation' | 'task-relation' | 'tag-relation' | 'collection-relation';
  relationCollectionId?: string;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  title?: string;
  isMultiSelect?: boolean;
}

export const RelationPickerDialog: React.FC<RelationPickerDialogProps> = ({
  isOpen,
  onClose,
  type,
  relationCollectionId,
  selectedIds,
  onSelect,
  title,
  isMultiSelect = true
}) => {
  const [search, setSearch] = useState('');
  const documents = useDocumentStore(state => state.documents);
  const documentOrder = useDocumentStore(state => state.documentOrder);
  const tasks = useTaskStore(state => state.tasks);
  const createdTags = useDocumentStore(state => state.createdTags);
  
  const collections = useCollectionStore(state => state.collections);
  const collectionItems = useCollectionStore(state => state.items);

  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedIds);
      setSearch('');
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  // 1. Gather all list options
  let items: { id: string; name: string; subtitle?: string; icon: React.ReactNode }[] = [];

  if (type === 'document-relation') {
    items = documentOrder
      .map(id => documents[id])
      .filter(doc => doc && !doc.isDeleted && !doc.id.startsWith('daily-note-'))
      .map(doc => ({
        id: doc.id,
        name: doc.title || 'Untitled Document',
        subtitle: doc.folderId ? 'In Folder' : 'Root',
        icon: <FileText className="text-blue-500" size={16} />
      }));
  } else if (type === 'task-relation') {
    items = tasks
      .filter(task => !task.isDeleted)
      .map(task => ({
        id: task.id,
        name: task.title || 'Untitled Task',
        subtitle: task.status || 'open',
        icon: <CheckSquare className="text-rose-500" size={16} />
      }));
  } else if (type === 'tag-relation') {
    items = createdTags.map(tag => ({
      id: tag,
      name: tag,
      icon: <Tag className="text-emerald-500" size={16} />
    }));
  } else if (type === 'collection-relation' && relationCollectionId) {
    const targetCollection = collections[relationCollectionId];
    const targetItems = collectionItems[relationCollectionId] || [];
    
    // Find the first field (usually Title/Name) in the target collection to use as display
    const nameField = targetCollection?.fields[0];
    
    items = targetItems.map(item => {
      const displayVal = nameField ? String(item.values[nameField.id] || '') : '';
      return {
        id: item.id,
        name: displayVal || 'Unnamed Item',
        subtitle: targetCollection?.name || 'Collection Item',
        icon: <Database className="text-purple-500" size={16} />
      };
    });
  }

  // 2. Filter list options by search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setActiveIndex(filteredItems.length > 0 ? 0 : -1);
  }, [search, filteredItems.length]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredItems.length) {
        handleToggleSelect(filteredItems[activeIndex].id);
      }
    }
  };

  const handleToggleSelect = (id: string) => {
    if (isMultiSelect) {
      if (tempSelected.includes(id)) {
        setTempSelected(tempSelected.filter(x => x !== id));
      } else {
        setTempSelected([...tempSelected, id]);
      }
    } else {
      setTempSelected([id]);
    }
  };

  const handleSave = () => {
    onSelect(tempSelected);
    onClose();
  };

  const defaultTitle = {
    'document-relation': 'Link Documents',
    'task-relation': 'Link Tasks',
    'tag-relation': 'Link Tags',
    'collection-relation': `Link ${collections[relationCollectionId || '']?.name || 'Collection Items'}`
  }[type];

  return (
    <PopupMenu
      isOpen={isOpen}
      onClose={onClose}
      title={title || defaultTitle}
      variant="center"
      className="max-w-md max-h-[80vh] collection-pastel-popup"
      bodyClassName="p-0"
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
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm-sm"
          >
            Select
          </button>
        </>
      }
    >
      {/* Search Bar */}
      <div className="border-b border-border bg-muted/20 flex items-center gap-2 px-3 py-3">
        <MagnifyingGlass size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder-muted-foreground/60"
          autoFocus
        />
      </div>

      {/* List */}
      <div ref={listRef} className="overflow-y-auto p-2 min-h-[200px] max-h-[400px] no-scrollbar">
        {filteredItems.map((item, index) => {
          const isSelected = tempSelected.includes(item.id);
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              onClick={() => handleToggleSelect(item.id)}
              data-active={isActive ? "true" : undefined}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-sm-sm cursor-pointer select-none transition-all duration-150 mb-0.5",
                isSelected
                  ? "bg-purple-500/10 border border-purple-500/20 text-foreground"
                  : "hover:bg-muted/50 border border-transparent text-muted-foreground hover:text-foreground",
                isActive && "bg-muted border border-border"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <div className="flex flex-col min-w-0">
                  <span className={cn("text-xs font-medium truncate", isSelected ? "text-foreground font-semibold" : "text-foreground/90")}>
                    {item.name}
                  </span>
                  {item.subtitle && (
                    <span className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>
              {isSelected && (
                <Check size={14} className="text-purple-500 shrink-0 font-bold" />
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground/75">
            No matching items found.
          </div>
        )}
      </div>
    </PopupMenu>
  );
};
