import React from 'react';
import { motion } from 'motion/react';
import { cn, hexToRgb, rgbToHsl } from '@/shared/lib/utils';
import { useSettingsStore } from '@/features/settings/store';

export const SidebarItem = ({
  icon,
  label,
  isOpen,
  highlight,
  onClick,
  rightElement,
  activeBgClass = "bg-muted border border-border shadow-sm-sm",
  activeTextClass = "!text-black dark:!text-foreground font-semibold",
  highlightColor,
  id
}: {
  icon?: React.ReactNode,
  label: string,
  isOpen: boolean,
  highlight?: boolean,
  onClick?: () => void,
  rightElement?: React.ReactNode,
  activeBgClass?: string,
  activeTextClass?: string,
  highlightColor?: string | null,
  id?: string
}) => {
  const activeHighlightColor = useSettingsStore(state => state.activeHighlightColor);

  const dynamicStyles = React.useMemo(() => {
    const colorHex = highlightColor || activeHighlightColor;
    if (!colorHex || colorHex === 'transparent' || colorHex === 'none') {
      return undefined;
    }
    try {
      const rgb = hexToRgb(colorHex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return {
        '--sidebar-highlight-bg-light': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.25)`,
        '--sidebar-highlight-border-light': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.45)`,
        '--sidebar-highlight-text-light': `hsla(${hsl.h}, ${hsl.s}%, 22%, 1)`,

        '--sidebar-highlight-bg-dark': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.25)`,
        '--sidebar-highlight-border-dark': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.45)`,
        '--sidebar-highlight-text-dark': `hsla(${hsl.h}, ${hsl.s}%, 85%, 1)`,
      } as React.CSSProperties;
    } catch {
      return undefined;
    }
  }, [highlightColor, activeHighlightColor]);

  const isDefaultBg = activeBgClass === "bg-muted border border-border shadow-sm-sm";
  
  const bgClass = isDefaultBg && dynamicStyles
    ? "bg-[var(--sidebar-highlight-bg-light)] dark:bg-[var(--sidebar-highlight-bg-dark)] border-[var(--sidebar-highlight-border-light)] dark:border-[var(--sidebar-highlight-border-dark)] border shadow-sm-sm"
    : activeBgClass;

  const textClass = isDefaultBg && dynamicStyles
    ? "text-[var(--sidebar-highlight-text-light)] dark:text-[var(--sidebar-highlight-text-dark)] font-semibold"
    : activeTextClass;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      id={id}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={dynamicStyles}
      className={cn(
        "relative flex items-center w-full py-1.5 text-[13px] outline-none group/item rounded-sm-sm transition-all duration-100 ease-out active:scale-[0.98] border border-transparent cursor-pointer select-none",
        isOpen ? "px-2 gap-3" : "px-0 justify-center items-center gap-0",
        highlight
          ? textClass
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {highlight && (
        <motion.div
          layoutId="activeSidebarHighlight"
          className={cn("absolute inset-0 rounded-sm-sm -z-0 border", bgClass)}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {highlight && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-current rounded-sm-r-full z-10" />
      )}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-5 h-5 relative z-10 transition-transform duration-100 group-hover/item:scale-[1.05]",
          highlight ? textClass : "text-muted-foreground group-hover/item:text-foreground"
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "flex items-center justify-between min-w-0 transition-all duration-200 ease-out relative z-10",
          isOpen ? "flex-1 opacity-100 translate-x-0" : "absolute opacity-0 -translate-x-2 pointer-events-none w-0 h-0 overflow-hidden"
        )}
      >
        <span
          className={cn(
            "truncate whitespace-nowrap overflow-hidden flex-1 text-left font-medium tracking-tight",
            highlight ? textClass : ""
          )}
        >
          {label}
        </span>
        {rightElement && (
          <div className="shrink-0 ml-2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
