
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { DailyNotesPage } from '@/features/daily-notes/DailyNotesPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TagsPage } from '@/features/tags/TagsPage';
import { cn, getItemColor, getFolderStyle, getFolderHexColor } from '@/shared/lib/utils';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, Check, X, Plus, Trash } from '@phosphor-icons/react';
import { useShallow } from 'zustand/react/shallow';
import { ColorPicker } from '@/shared/ui/ColorPicker';

export const SectionGridItem = React.memo(({
  itemId,
  itemType,
  paneId,
  folderColors,
  onFolderContextMenu,
}: {
  itemId: string;
  itemType: 'page' | 'folder';
  paneId: string;
  folderColors?: Record<string, string>;
  onFolderContextMenu?: (e: React.MouseEvent, folderId: string) => void;
}) => {
  const openDocument = useUiStore(state => state.openDocument);

  const detailsSelector = useCallback(
    (state: any) => {
      if (itemType === 'folder') {
        const folder = state.folders.find((f: any) => f?.id === itemId);
        return folder ? { title: folder.name } : null;
      } else {
        const doc = state.documents[itemId];
        return doc ? { title: doc.title, type: doc.type || 'page' } : null;
      }
    },
    [itemId, itemType]
  );
  const item = useDocumentStore(useShallow(detailsSelector));

  if (!item) return null;

  // Resolve colour: prefer custom folder colour, fall back to hash-based default.
  const customStyle = itemType === 'folder' ? getFolderStyle(itemId, folderColors) : null;
  const defaultCardColor = getItemColor(item.title || 'Untitled');

  const cardBg     = customStyle ? customStyle.bg     : defaultCardColor.bg;
  const cardBorder = customStyle ? customStyle.border : defaultCardColor.border;
  const iconBg     = customStyle ? customStyle.iconBg     : defaultCardColor.iconBg;
  const iconBorder = customStyle ? customStyle.iconBorder : defaultCardColor.iconBorder;
  // Icon / text class: only used when no custom colour
  const iconTextClass = customStyle ? '' : defaultCardColor.iconText;

  // CSS vars for light/dark text when custom colour is active
  const customVars = customStyle ? {
    '--folder-text-light': (customStyle as any)['--folder-text-light'],
    '--folder-text-dark':  (customStyle as any)['--folder-text-dark'],
  } as React.CSSProperties : {};

  return (
    <div
      onClick={() => {
        if (itemType === 'folder') {
          openDocument(`section-folder-${itemId}`, paneId);
        } else {
          openDocument(itemId, paneId);
        }
      }}
      onContextMenu={itemType === 'folder' && onFolderContextMenu ? (e) => onFolderContextMenu(e, itemId) : undefined}
      className="p-6 rounded-sm-sm border cursor-pointer group flex flex-col gap-3 transition-all duration-150 overflow-hidden relative"
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="flex flex-col gap-4 relative z-10 w-full min-w-0">
        <div
          className={cn(
            "w-10 h-10 rounded-sm-sm border flex items-center justify-center transition-colors duration-300 shadow-sm-inner",
            customStyle ? 'folder-element' : iconTextClass
          )}
          style={{
            backgroundColor: iconBg,
            borderColor: iconBorder,
            ...customVars,
          }}
        >
          {itemType === 'folder'
            ? <Folder size={20} weight="duotone" className={customStyle ? 'text-[color:var(--folder-text)]' : ''} />
            : (item as any).icon ? (
              <span className="text-[18px] leading-none flex items-center justify-center font-sans">{(item as any).icon}</span>
            ) : <FileText size={20} weight="duotone" />}
        </div>
        <span className={cn(
          "font-medium text-sm truncate transition-colors leading-none pr-1 text-foreground/80",
          customStyle ? '' : cn("group-hover:", iconTextClass)
        )}>
          {item.title || 'Untitled'}
        </span>
      </div>
    </div>
  );
});
SectionGridItem.displayName = 'SectionGridItem';

