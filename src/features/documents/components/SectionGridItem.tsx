import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { cn, getItemColor, getFolderStyle, getFolderHexColor, getColorStyle } from '@/shared/lib/utils';
import { CaretDown, FileText, Folder } from '@phosphor-icons/react';
import { useShallow } from 'zustand/react/shallow';

export const SectionGridItem = React.memo(({
  itemId,
  itemType,
  paneId,
  folderColors,
  onFolderContextMenu,
  onDocumentContextMenu,
  isRenaming = false,
  onRenameComplete,
  onRenameCancel,
}: {
  itemId: string;
  itemType: 'page' | 'folder';
  paneId: string;
  folderColors?: Record<string, string>;
  onFolderContextMenu?: (e: React.MouseEvent, folderId: string) => void;
  onDocumentContextMenu?: (e: React.MouseEvent, docId: string) => void;
  isRenaming?: boolean;
  onRenameComplete?: (newName: string) => void;
  onRenameCancel?: () => void;
}) => {
  const openDocument = useUiStore(state => state.openDocument);

  const detailsSelector = useCallback(
    (state: any) => {
      if (itemType === 'folder') {
        const folder = state.folders.find((f: any) => f?.id === itemId);
        return folder ? { title: folder.name } : null;
      } else {
        const doc = state.documents[itemId];
        return doc ? { title: doc.title, type: doc.type || 'page', cardColor: doc.cardColor } : null;
      }
    },
    [itemId, itemType]
  );
  const item = useDocumentStore(useShallow(detailsSelector));
  const [tempTitle, setTempTitle] = useState(item?.title || '');

  useEffect(() => {
    if (isRenaming && item) {
      setTempTitle(item.title || '');
    }
  }, [isRenaming, item?.title]);

  if (!item) return null;

  const handleRenameSubmit = () => {
    const finalTitle = tempTitle.trim() ? tempTitle : (item.title || 'Untitled');
    if (itemType === 'folder') {
      useDocumentStore.getState().updateFolder(itemId, finalTitle);
    } else {
      useDocumentStore.getState().updateDocument(itemId, { title: finalTitle });
    }
    if (onRenameComplete) onRenameComplete(finalTitle);
  };

  // Resolve colour: prefer custom folder/document colour, fall back to hash-based default.
  const customStyle = itemType === 'folder'
    ? getFolderStyle(itemId, folderColors)
    : getColorStyle((item as any).cardColor);
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
        if (isRenaming) return;
        if (itemType === 'folder') {
          openDocument(`section-folder-${itemId}`, paneId);
        } else {
          openDocument(itemId, paneId);
        }
      }}
      onContextMenu={(e) => {
        if (isRenaming) return;
        if (itemType === 'folder') {
          if (onFolderContextMenu) onFolderContextMenu(e, itemId);
        } else {
          if (onDocumentContextMenu) onDocumentContextMenu(e, itemId);
        }
      }}
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
            ) : <FileText size={20} weight="duotone" className={customStyle ? 'text-[color:var(--folder-text)]' : ''} />}
        </div>
        {isRenaming ? (
          <input
            autoFocus
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              } else if (e.key === 'Escape') {
                if (onRenameCancel) onRenameCancel();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-background/50 border border-border text-foreground px-1.5 py-0.5 text-xs font-medium outline-none rounded min-w-0"
          />
        ) : (
          <span className={cn(
            "font-medium text-sm truncate transition-colors leading-none pr-1 text-foreground/80",
            customStyle ? '' : cn("group-hover:", iconTextClass)
          )}>
            {item.title || 'Untitled'}
          </span>
        )}
      </div>
    </div>
  );
});
SectionGridItem.displayName = 'SectionGridItem';
