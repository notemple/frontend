import React, { useState, useEffect } from 'react';
import { X, Folder, ArrowBendDownRight, Trash, WarningCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useDocumentStore } from '@/features/documents/store';
import { cn } from '@/shared/lib/utils';

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  fileCount: number;
  onConfirm: (action: 'delete' | 'uncategorize' | 'move', targetFolderId?: string) => void;
}

export const DeleteFolderDialog = ({
  isOpen,
  onClose,
  folderId,
  folderName,
  fileCount,
  onConfirm
}: DeleteFolderDialogProps) => {
  const folders = useDocumentStore(state => state.folders).filter(
    f => f && f.id !== folderId && !f.isDeleted
  );

  const [selectedAction, setSelectedAction] = useState<'move' | 'uncategorize' | 'delete'>(
    folders.length > 0 ? 'move' : 'uncategorize'
  );
  const [targetFolderId, setTargetFolderId] = useState<string>(
    folders.length > 0 ? folders[0].id : ''
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedAction(folders.length > 0 ? 'move' : 'uncategorize');
      setTargetFolderId(folders.length > 0 ? folders[0].id : '');
    }
  }, [isOpen, folderId]);

  const handleActionConfirm = () => {
    onConfirm(selectedAction, selectedAction === 'move' ? targetFolderId : undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-lg w-full max-w-md shadow-2xl overflow-hidden font-sans flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md">
                    <WarningCircle size={20} weight="fill" />
                  </div>
                  <h2 className="font-semibold text-base text-foreground tracking-tight">Delete Folder</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-muted/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  The folder <strong className="text-foreground">"{folderName}"</strong> contains <strong className="text-foreground">{fileCount} {fileCount === 1 ? 'file' : 'files'}</strong>. Deleting this folder gives you options for the files inside:
                </div>

                <div className="flex flex-col gap-2.5 mt-1">
                  {/* Option 1: Move to Another Folder */}
                  {folders.length > 0 && (
                    <div
                      onClick={() => setSelectedAction('move')}
                      className={cn(
                        "flex flex-col gap-3 p-3.5 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                        selectedAction === 'move'
                          ? "bg-accent/10 border-accent/40 shadow-sm"
                          : "border-border hover:bg-muted/30 hover:border-border/80"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delete-action"
                          checked={selectedAction === 'move'}
                          onChange={() => setSelectedAction('move')}
                          className="w-4 h-4 text-accent border-border focus:ring-accent cursor-pointer shrink-0 accent-accent"
                        />
                        <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                          <Folder size={18} className="text-amber-500" weight={selectedAction === 'move' ? 'fill' : 'regular'} />
                          <span>Move to another folder</span>
                        </div>
                      </div>
                      
                      {selectedAction === 'move' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-7"
                          onClick={e => e.stopPropagation()}
                        >
                          <select
                            value={targetFolderId}
                            onChange={(e) => setTargetFolderId(e.target.value)}
                            className="bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent/40 transition-colors w-full cursor-pointer focus:ring-1 focus:ring-accent font-sans"
                          >
                            {folders.map(f => (
                              <option key={f.id} value={f.id} className="bg-card text-foreground">
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Option 2: Keep in Uncategorized */}
                  <div
                    onClick={() => setSelectedAction('uncategorize')}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                      selectedAction === 'uncategorize'
                        ? "bg-accent/10 border-accent/40 shadow-sm"
                        : "border-border hover:bg-muted/30 hover:border-border/80"
                    )}
                  >
                    <input
                      type="radio"
                      name="delete-action"
                      checked={selectedAction === 'uncategorize'}
                      onChange={() => setSelectedAction('uncategorize')}
                      className="w-4 h-4 text-accent border-border focus:ring-accent cursor-pointer shrink-0 accent-accent"
                    />
                    <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                      <ArrowBendDownRight size={18} className="text-cyan-500" />
                      <span>Move files to Uncategorized</span>
                    </div>
                  </div>

                  {/* Option 3: Delete All Files */}
                  <div
                    onClick={() => setSelectedAction('delete')}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                      selectedAction === 'delete'
                        ? "bg-red-500/10 border-red-500/30 shadow-sm"
                        : "border-border hover:bg-muted/30 hover:border-border/80"
                    )}
                  >
                    <input
                      type="radio"
                      name="delete-action"
                      checked={selectedAction === 'delete'}
                      onChange={() => setSelectedAction('delete')}
                      className="w-4 h-4 text-red-500 border-border focus:ring-red-500 cursor-pointer shrink-0 accent-red-500"
                    />
                    <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                      <Trash size={18} className="text-red-500" />
                      <span>Delete all files inside</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-muted/10 shrink-0">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirm}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer",
                    selectedAction === 'delete'
                      ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white hover:shadow-red-500/20"
                      : "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/95 hover:shadow-accent/20"
                  )}
                >
                  {selectedAction === 'delete'
                    ? "Delete Folder & Files"
                    : selectedAction === 'move'
                      ? "Move Files & Delete Folder"
                      : "Move to Uncategorized & Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
