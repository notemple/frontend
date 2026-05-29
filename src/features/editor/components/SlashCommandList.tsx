import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { CommandItem } from './SlashCommand';
import { CaretRight, CaretLeft } from '@phosphor-icons/react';

interface SlashCommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentMenu, setCurrentMenu] = useState<CommandItem[]>(props.items);
  const [menuStack, setMenuStack] = useState<CommandItem[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentMenu(props.items);
    setSelectedIndex(0);
    setMenuStack([]);
  }, [props.items]);

  // Handle automatic scrolling when selection index changes
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const selectedButton = container.querySelector('[data-slash-item="true"]') as HTMLElement;

    if (selectedButton) {
      const containerHeight = container.clientHeight;
      const containerScrollTop = container.scrollTop;
      const buttonTop = selectedButton.offsetTop;
      const buttonHeight = selectedButton.offsetHeight;

      if (buttonTop < containerScrollTop) {
        container.scrollTop = buttonTop - 8; // add a little padding
      } else if (buttonTop + buttonHeight > containerScrollTop + containerHeight) {
        container.scrollTop = buttonTop + buttonHeight - containerHeight + 8;
      }
    }
  }, [selectedIndex, currentMenu]);

  const selectItem = (index: number) => {
    const item = currentMenu[index];
    if (item) {
      if (item.submenu) {
        setMenuStack([...menuStack, currentMenu]);
        setCurrentMenu(item.submenu);
        setSelectedIndex(0);
      } else if (item.command) {
        props.command(item);
      }
    }
  };

  const goBack = () => {
    if (menuStack.length > 0) {
      const prevMenu = menuStack[menuStack.length - 1];
      setMenuStack(menuStack.slice(0, -1));
      setCurrentMenu(prevMenu);
      setSelectedIndex(0);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + currentMenu.length - 1) % currentMenu.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % currentMenu.length);
        return true;
      }

      if (event.key === 'ArrowLeft' && menuStack.length > 0) {
        goBack();
        return true;
      }

      if (event.key === 'ArrowRight') {
        const item = currentMenu[selectedIndex];
        if (item && item.submenu) {
          selectItem(selectedIndex);
          return true;
        }
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      if (event.key === 'Escape' && menuStack.length > 0) {
        goBack();
        return true; // prevent closing popup if we are in submenu
      }

      return false;
    },
  }));

  if (currentMenu.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-2 flex flex-col gap-1 min-w-[280px] max-h-[380px] overflow-y-auto no-scrollbar font-sans"
    >
      {menuStack.length > 0 && (
        <button
          onClick={goBack}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-sm-sm transition-all text-white/50 hover:bg-muted/40 hover:text-white mb-1.5 border-b border-white/5 pb-2.5 shrink-0"
        >
          <div className="flex items-center gap-3">
            <CaretLeft size={16} />
            <span className="font-medium tracking-wide text-[13px]">Back</span>
          </div>
        </button>
      )}
      {currentMenu.map((item, index) => {
        const isNewGroup = index === 0 || item.group !== currentMenu[index - 1].group;
        const isSelected = index === selectedIndex;
        return (
          <React.Fragment key={index}>
            {isNewGroup && item.group && (
              <div className="px-3 py-2 text-[11px] text-white/30 font-medium tracking-wider uppercase mt-1">
                {item.group}
              </div>
            )}
            <button
              data-slash-item={isSelected}
              onClick={() => selectItem(index)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-[13px] rounded-sm-sm transition-all duration-200 group relative overflow-hidden shrink-0
                ${isSelected ? 'text-white shadow-sm-sm' : 'text-white/60 hover:text-white/90'}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-muted/40 shadow-sm-inner rounded-sm-sm" />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <span className={isSelected ? "text-white flex items-center justify-center w-5 h-5 shadow-sm-sm transform scale-110 transition-transform" : "opacity-70 group-hover:opacity-100 flex items-center justify-center w-5 h-5 transition-transform group-hover:scale-105"}>{item.icon}</span>
                <span className="font-medium tracking-tight shadow-sm-sm">{item.title}</span>
              </div>
              {item.submenu && (
                <CaretRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity relative z-10" />
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = 'SlashCommandList';
