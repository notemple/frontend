import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useDocumentStore } from '@/features/documents/store';
import { Tag as TagIcon, PlusCircle } from '@phosphor-icons/react';

interface TagListProps {
  query: string;
  editor: any;
  range: any;
}

interface TagItem {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  isCreateAction?: boolean;
}

export const TagList = forwardRef((props: TagListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live lookup of created tags and documents tags from the store
  const documents = useDocumentStore(state => state.documents);
  const createdTags = useDocumentStore(state => state.createdTags) || [];
  const createTag = useDocumentStore(state => state.createTag);

  const items = useMemo(() => {
    const list: TagItem[] = [];
    const query = props.query.trim();

    // 1. Gather all unique existing tags
    const uniqueTags = Array.from(new Set([
      ...createdTags,
      ...Object.values(documents).flatMap((d: any) => d?.tags || [])
    ])).filter(Boolean);

    // 2. Filter existing tags based on query
    const filtered = uniqueTags
      .filter(tag => !query || tag.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 7)
      .map(tag => ({
        title: tag,
        subtitle: 'Existing Tag',
        icon: <TagIcon size={16} className="text-rose-500" />,
        action: () => {
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { label: tag, type: 'tag' }
            })
            .insertContent(' ')
            .run();
        }
      }));
    
    list.push(...filtered);

    // 3. Add a "Create Tag" option if query is not empty and tag doesn't already exist
    const tagExists = uniqueTags.some(t => t.toLowerCase() === query.toLowerCase());
    if (query && !tagExists) {
      list.push({
        title: `Create tag: "#${query}"`,
        subtitle: 'Add to tag directory',
        icon: <PlusCircle size={16} className="text-rose-400" />,
        action: () => {
          // Add created tag in document store directory if supported
          if (typeof createTag === 'function') {
            try {
              createTag(query);
            } catch (e) {
              console.error('Failed to register created tag:', e);
            }
          }
          
          props.editor
            .chain()
            .focus()
            .deleteRange(props.range)
            .insertContent({
              type: 'reference',
              attrs: { label: query, type: 'tag' }
            })
            .insertContent(' ')
            .run();
        },
        isCreateAction: true
      });
    }

    return list;
  }, [props.query, documents, createdTags, props.editor, props.range, createTag]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const selectedButton = container.querySelector('[data-tag-item="true"]') as HTMLElement;

    if (selectedButton) {
      const containerHeight = container.clientHeight;
      const containerScrollTop = container.scrollTop;
      const buttonTop = selectedButton.offsetTop;
      const buttonHeight = selectedButton.offsetHeight;

      if (buttonTop < containerScrollTop) {
        container.scrollTop = buttonTop - 8;
      } else if (buttonTop + buttonHeight > containerScrollTop + containerHeight) {
        container.scrollTop = buttonTop + buttonHeight - containerHeight + 8;
      }
    }
  }, [selectedIndex, items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      item.action();
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-3 text-xs text-white/40 font-sans text-center min-w-[240px]">
        Type to create tag...
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-2 flex flex-col gap-1 min-w-[260px] max-h-[300px] overflow-y-auto no-scrollbar font-sans"
    >
      <div className="px-3 py-1.5 text-[10px] text-white/30 font-medium tracking-wider uppercase">
        Mentions / Tags
      </div>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={index}
            data-tag-item={isSelected}
            onClick={() => selectItem(index)}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-sm-sm transition-all duration-200 group relative overflow-hidden text-left shrink-0
              ${isSelected ? 'text-white shadow-sm-sm' : 'text-white/60 hover:text-white/90'}
            `}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-muted/40 shadow-sm-inner rounded-sm-sm" />
            )}
            <div className="flex items-center gap-3 relative z-10 w-full min-w-0">
              <span className={isSelected ? "text-white flex items-center justify-center w-4 h-4 transform scale-110 transition-transform shrink-0" : "opacity-70 group-hover:opacity-100 flex items-center justify-center w-4 h-4 transition-transform group-hover:scale-105 shrink-0"}>
                {item.icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold tracking-tight truncate leading-none mb-0.5">{item.title}</span>
                {item.subtitle && (
                  <span className="text-[9px] text-white/40 truncate leading-none">{item.subtitle}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

TagList.displayName = 'TagList';
