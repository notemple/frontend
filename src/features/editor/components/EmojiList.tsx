import { EMOJIS, type EmojiItem } from '@/shared/lib/emojis';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

interface EmojiListProps {
  query: string;
  editor: any;
  range: any;
}

export const EmojiList = forwardRef((props: EmojiListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const query = props.query.trim().toLowerCase();
    
    // Filter matching emojis from the dataset
    return EMOJIS.filter((emojiItem) => {
      if (!query) return true; // Show all / top if query is empty
      return (
        emojiItem.name.toLowerCase().includes(query) ||
        emojiItem.keywords.some((kw) => kw.toLowerCase().includes(query))
      );
    }).slice(0, 10);
  }, [props.query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const selectedButton = container.querySelector('[data-emoji-item="true"]') as HTMLElement;

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
      props.editor
        .chain()
        .focus()
        .deleteRange(props.range)
        .insertContent(item.char)
        .run();
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
      <div className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-3 text-xs text-white/40 font-sans text-center min-w-[200px]">
        No emojis found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-2 flex flex-col gap-1 min-w-[240px] max-h-[300px] overflow-y-auto no-scrollbar font-sans"
    >
      <div className="px-3 py-1.5 text-[10px] text-white/30 font-medium tracking-wider uppercase">
        Emoji Suggestions
      </div>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.name}
            data-emoji-item={isSelected}
            onClick={() => selectItem(index)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-sm-sm transition-all duration-200 group relative overflow-hidden text-left shrink-0
              ${isSelected ? 'text-white shadow-sm-sm' : 'text-white/60 hover:text-white/90'}
            `}
          >
            {isSelected && (
              <div className="absolute inset-0 bg-muted/40 shadow-sm-inner rounded-sm-sm" />
            )}
            <span className="text-[18px] flex items-center justify-center shrink-0 relative z-10 font-sans">
              {item.char}
            </span>
            <div className="flex flex-col min-w-0 relative z-10">
              <span className="font-semibold tracking-tight truncate leading-none mb-0.5">
                :{item.name}:
              </span>
              <span className="text-[9px] text-white/40 truncate leading-none">
                {item.category}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

EmojiList.displayName = 'EmojiList';
