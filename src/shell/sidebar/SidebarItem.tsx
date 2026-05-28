
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretDown, CaretRight, Folder, Hash, CheckSquareOffset, FileText, Plus, SidebarSimple, DotsThree, Trash, TextT, Palette, Check, ArrowBendDownRight, CalendarBlank } from '@phosphor-icons/react';
import { cn, getFolderStyle, getFolderHexColor } from '@/shared/lib/utils';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { formatDisplayDate } from '@/shared/lib/time';
import { useSettingsStore } from '@/features/settings/store';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';

export const SidebarItem = ({
  icon,
  label,
  isOpen,
  highlight,
  onClick,
  rightElement,
  activeBgClass = "bg-muted border border-border shadow-sm",
  activeTextClass = "!text-black dark:!text-foreground font-semibold"
}: {
  icon?: React.ReactNode,
  label: string,
  isOpen: boolean,
  highlight?: boolean,
  onClick?: () => void,
  rightElement?: React.ReactNode,
  activeBgClass?: string,
  activeTextClass?: string
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 w-full px-2 py-1.5 text-[13px] outline-none group/item rounded-md transition-all duration-100 ease-out active:scale-[0.98] border border-transparent cursor-pointer",
        !isOpen && "justify-center px-0 items-center",
        highlight
          ? activeTextClass
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      )}
    >
      {highlight && (
        <motion.div
          layoutId="activeSidebarItemBg"
          className={cn("absolute inset-0 rounded-md -z-10", activeBgClass)}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {highlight && (
        <motion.div
          layoutId="activeSidebarItemIndicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-current rounded-r-full shadow-[0_0_4px_currentColor] z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-5 h-5 relative z-10 transition-transform duration-100 group-hover/item:scale-[1.05]",
          highlight ? activeTextClass : "text-muted-foreground group-hover/item:text-foreground"
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          "flex-1 flex items-center justify-between min-w-0 transition-all duration-200 ease-out relative z-10",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0 h-0 overflow-hidden"
        )}
      >
        <span
          className={cn(
            "truncate whitespace-nowrap overflow-hidden flex-1 text-left font-medium tracking-tight",
            highlight ? activeTextClass : ""
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
    </button>
  );
};
