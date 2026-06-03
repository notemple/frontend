import React, { useState, useEffect } from 'react';
import { SidebarItem } from './SidebarItem';
import { Folder } from '@phosphor-icons/react';
import { useDocumentStore } from '@/features/documents/store';
import { getFolderActiveHexColor } from '@/shared/lib/utils';

export const SidebarFolderItem = ({
  folderId,
  folderName,
  isOpen,
  isRenaming = false,
  onRenameComplete,
  onRenameCancel,
  onClick,
  rightElement,
  folderColor,
  highlight = false,
}: {
  folderId: string;
  folderName: string;
  isOpen: boolean;
  isRenaming?: boolean;
  onRenameComplete?: (newName: string) => void;
  onRenameCancel?: () => void;
  onClick: () => void;
  rightElement?: React.ReactNode;
  folderColor?: string | null;
  highlight?: boolean;
}) => {
  const [tempName, setTempName] = useState(folderName);
  const originalNameRef = React.useRef(folderName);

  const folderColors = useDocumentStore(state => state.folderColors) || {};
  const activeFolderHighlightColor = getFolderActiveHexColor(folderId, folderColors, folderName);

  useEffect(() => {
    if (isRenaming) {
      originalNameRef.current = folderName;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempName(folderName);
    }
  }, [isRenaming, folderName]);

  // Resolve icon color: use custom color or fallback to amber
  const iconStyle = folderColor
    ? { color: folderColor }
    : undefined;
  const iconClassName = folderColor
    ? undefined
    : 'text-amber-500/80 dark:text-amber-400/80';

  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm-sm bg-muted border border-border w-full shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 text-muted-foreground">
          <Folder
            size={16}
            className={iconClassName}
            style={iconStyle}
          />
        </div>
        <input
          autoFocus
          value={tempName}
          onChange={(e) => {
            const val = e.target.value;
            setTempName(val);
            useDocumentStore.getState().updateFolder(folderId, val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const finalName = tempName.trim() ? tempName : (originalNameRef.current || 'New Folder');
              useDocumentStore.getState().updateFolder(folderId, finalName);
              if (onRenameComplete) onRenameComplete(finalName);
            } else if (e.key === 'Escape') {
              useDocumentStore.getState().updateFolder(folderId, originalNameRef.current);
              if (onRenameCancel) onRenameCancel();
            }
          }}
          onBlur={() => {
            const finalName = tempName.trim() ? tempName : (originalNameRef.current || 'New Folder');
            useDocumentStore.getState().updateFolder(folderId, finalName);
            if (onRenameComplete) onRenameComplete(finalName);
          }}
          className="bg-transparent border-none outline-none text-xs text-foreground w-full font-medium py-0.5"
        />
      </div>
    );
  }

  return (
    <SidebarItem
      icon={<Folder size={16} className={iconClassName} style={iconStyle} />}
      label={folderName}
      isOpen={isOpen}
      highlight={highlight}
      onClick={onClick}
      rightElement={rightElement}
      highlightColor={activeFolderHighlightColor}
    />
  );
};
