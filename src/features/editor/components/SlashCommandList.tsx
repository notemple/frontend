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
  
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ r: 2, c: 2 });

  useEffect(() => {
    setCurrentMenu(props.items);
    setSelectedIndex(0);
    setMenuStack([]);
    setShowTablePicker(false);
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

  const insertGridTable = (r: number, c: number) => {
    const tableItem: CommandItem = {
      title: 'Table',
      command: ({ editor, range }) => {
        editor.chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: r + 1, cols: c + 1, withHeaderRow: true })
          .run();
      }
    };
    props.command(tableItem);
  };

  const selectItem = (index: number) => {
    const item = currentMenu[index];
    if (item) {
      if (item.title === 'Table') {
        setShowTablePicker(true);
        setHoveredGrid({ r: 2, c: 2 });
      } else if (item.submenu) {
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
      if (showTablePicker) {
        if (event.key === 'ArrowUp') {
          setHoveredGrid(prev => ({ ...prev, r: Math.max(0, prev.r - 1) }));
          return true;
        }
        if (event.key === 'ArrowDown') {
          setHoveredGrid(prev => ({ ...prev, r: Math.min(5, prev.r + 1) }));
          return true;
        }
        if (event.key === 'ArrowLeft') {
          setHoveredGrid(prev => ({ ...prev, c: Math.max(0, prev.c - 1) }));
          return true;
        }
        if (event.key === 'ArrowRight') {
          setHoveredGrid(prev => ({ ...prev, c: Math.min(5, prev.c + 1) }));
          return true;
        }
        if (event.key === 'Enter') {
          insertGridTable(hoveredGrid.r, hoveredGrid.c);
          return true;
        }
        if (event.key === 'Escape' || event.key === 'Backspace') {
          setShowTablePicker(false);
          return true;
        }
        return true; // Consume other keys in picker mode
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + currentMenu.length - 1) % currentMenu.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % currentMenu.length);
        return true;
      }

      if ((event.key === 'ArrowLeft' || event.key === 'Backspace') && menuStack.length > 0) {
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

  if (showTablePicker) {
    return (
      <div 
        ref={containerRef}
        className="bg-card border border-white/5 rounded-sm-sm shadow-sm-sm p-3.5 flex flex-col gap-3 min-w-[250px] overflow-hidden font-sans"
      >
        <button
          onClick={() => setShowTablePicker(false)}
          className="w-full flex items-center gap-3 px-1 py-1 text-sm rounded-sm-sm transition-all text-white/50 hover:text-white shrink-0"
        >
          <CaretLeft size={16} />
          <span className="font-medium tracking-wide text-[13px]">Back</span>
        </button>

        <div className="flex flex-col items-center gap-2.5 py-1">
          <div className="text-[12px] font-semibold text-white/70 tracking-wider">
            {hoveredGrid.r + 1} &times; {hoveredGrid.c + 1} Table
          </div>

          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, rIndex) => (
              <div key={rIndex} className="flex gap-1">
                {Array.from({ length: 6 }).map((_, cIndex) => {
                  const isHighlighted = rIndex <= hoveredGrid.r && cIndex <= hoveredGrid.c;
                  return (
                    <div
                      key={cIndex}
                      onMouseEnter={() => setHoveredGrid({ r: rIndex, c: cIndex })}
                      onClick={() => insertGridTable(rIndex, cIndex)}
                      className={`
                        w-6 h-6 border transition-all duration-150 cursor-pointer rounded-[3px]
                        ${isHighlighted 
                          ? 'bg-purple-500/80 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)] scale-[1.05]' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                        }
                      `}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-[10px] text-white/40 text-center mt-1">
            Use arrows to select, Enter to insert
          </div>
        </div>
      </div>
    );
  }

  if (currentMenu.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      id="onboarding-slash-command-list"
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
