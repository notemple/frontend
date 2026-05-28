import React, { useState } from 'react';
import { useDocumentStore } from '@/features/documents/store';
import { useTaskStore } from '@/features/tasks/store';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { 
  Trash, 
  ArrowCounterClockwise, 
  FileText, 
  Folder as FolderIcon, 
  CheckSquare, 
  Warning,
  Sparkle,
  ArrowLeft
} from '@phosphor-icons/react';

type TrashTab = 'all' | 'documents' | 'folders' | 'tasks';

export const TrashPage = ({ paneId }: { paneId: string }) => {
  const [activeTab, setActiveTab] = useState<TrashTab>('all');
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  // Zustand Store States and Actions
  const { 
    documents, 
    folders,
    restoreDocument,
    permanentlyDeleteDocument,
    restoreFolder,
    permanentlyDeleteFolder,
    restoreAllDocumentsAndFolders,
    permanentlyDeleteAllDocumentsAndFolders
  } = useDocumentStore();

  const { 
    tasks,
    restoreTask,
    permanentlyDeleteTask,
    restoreAllTasks,
    permanentlyDeleteAllTasks
  } = useTaskStore();

  // Filter Deleted Items
  const deletedDocs = Object.values(documents).filter(doc => doc.isDeleted);
  const deletedFolders = folders.filter(f => f.isDeleted);
  const deletedTasks = tasks.filter(t => t.isDeleted);

  // Group All Items for Display
  const allDeletedItems = [
    ...deletedDocs.map(doc => ({
      id: doc.id,
      title: doc.title || 'Untitled Note',
      type: 'document' as const,
      deletedAt: doc.deletedAt,
      icon: <FileText size={18} className="text-blue-500/80 dark:text-blue-400/80" />,
      restore: () => restoreDocument(doc.id),
      delete: () => permanentlyDeleteDocument(doc.id)
    })),
    ...deletedFolders.map(folder => ({
      id: folder.id,
      title: folder.name || 'Untitled Folder',
      type: 'folder' as const,
      deletedAt: folder.deletedAt,
      icon: <FolderIcon size={18} className="text-amber-500/80 dark:text-amber-400/80" />,
      restore: () => restoreFolder(folder.id),
      delete: () => permanentlyDeleteFolder(folder.id)
    })),
    ...deletedTasks.map(task => ({
      id: task.id,
      title: task.title || 'Untitled Task',
      type: 'task' as const,
      deletedAt: task.deletedAt,
      icon: <CheckSquare size={18} className="text-emerald-500/80 dark:text-emerald-400/80" />,
      restore: () => restoreTask(task.id),
      delete: () => permanentlyDeleteTask(task.id)
    }))
  ].sort((a, b) => {
    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return dateB - dateA; // Newest deleted items first
  });

  const filteredItems = allDeletedItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'documents') return item.type === 'document';
    if (activeTab === 'folders') return item.type === 'folder';
    if (activeTab === 'tasks') return item.type === 'task';
    return true;
  });

  // Bulk Actions Handlers
  const handleRestoreAll = async () => {
    await restoreAllDocumentsAndFolders();
    await restoreAllTasks();
  };

  const handleEmptyTrash = async () => {
    await permanentlyDeleteAllDocumentsAndFolders();
    await permanentlyDeleteAllTasks();
    setShowConfirmEmpty(false);
  };

  const isEmpty = allDeletedItems.length === 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-workspace font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-8 pt-6 flex-1">
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-border pb-6 flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Trash size={26} className="text-red-500 dark:text-red-400" />
              Trash
            </h1>
            <p className="text-sm text-muted-foreground">
              Review and restore notes, folders, and tasks or permanently delete them.
            </p>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-2">
              {showConfirmEmpty ? (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1 px-2.5 rounded-sm shadow-sm-sm animate-fade-in">
                  <Warning size={14} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 select-none">Confirm empty permanently?</span>
                  <button 
                    onClick={handleEmptyTrash} 
                    className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded-sm cursor-pointer shadow-sm"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setShowConfirmEmpty(false)} 
                    className="text-xs hover:bg-muted/80 text-foreground font-semibold px-2 py-0.5 rounded-sm border border-border cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleRestoreAll}
                    className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted border border-border/80 text-xs font-bold py-1.5 px-3 rounded-sm shadow-sm-sm transition-all cursor-pointer text-foreground"
                  >
                    <ArrowCounterClockwise size={14} />
                    Restore All
                  </button>
                  <button
                    onClick={() => setShowConfirmEmpty(true)}
                    className="flex items-center gap-1.5 bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-600 hover:text-white text-xs font-bold py-1.5 px-3 rounded-sm shadow-sm-sm transition-all cursor-pointer"
                  >
                    <Trash size={14} />
                    Empty Trash
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isEmpty ? (
          /* Premium Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/30 mb-6 relative group shadow-sm-sm">
              <Trash size={38} className="text-muted-foreground/40 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-1 rounded-full shadow-sm">
                <Sparkle size={12} weight="fill" />
              </div>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1 select-none">Trash is empty</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
              When you delete items, they will appear here. You can choose to restore them to their folders or permanently discard them.
            </p>
          </div>
        ) : (
          /* Trash Explorer Content */
          <div className="flex flex-col gap-6 flex-1">
            {/* Category Tabs */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-sm border border-border self-start">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all duration-200 cursor-pointer select-none",
                  activeTab === 'all'
                    ? "bg-card text-foreground border-border/80 shadow-sm font-bold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                )}
              >
                All Items ({allDeletedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all duration-200 cursor-pointer select-none",
                  activeTab === 'documents'
                    ? "bg-card text-foreground border-border/80 shadow-sm font-bold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                )}
              >
                Notes ({deletedDocs.length})
              </button>
              <button
                onClick={() => setActiveTab('folders')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all duration-200 cursor-pointer select-none",
                  activeTab === 'folders'
                    ? "bg-card text-foreground border-border/80 shadow-sm font-bold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                )}
              >
                Folders ({deletedFolders.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all duration-200 cursor-pointer select-none",
                  activeTab === 'tasks'
                    ? "bg-card text-foreground border-border/80 shadow-sm font-bold"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                )}
              >
                Tasks ({deletedTasks.length})
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-12 border border-dashed border-border rounded-sm bg-muted/10 text-center text-sm text-muted-foreground">
                No items of this type in the trash.
              </div>
            ) : (
              /* Items List */
              <div className="flex flex-col border border-border rounded-sm bg-card-bg divide-y divide-border overflow-hidden shadow-sm-sm animate-fade-in">
                {filteredItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center border border-border shadow-sm-sm shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">{item.title}</span>
                        {item.deletedAt && (
                          <span className="text-[10px] text-muted-foreground/80 font-mono tracking-wide select-none">
                            Deleted on: {formatDisplayDate(item.deletedAt, 'MMM d, yyyy h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={item.restore}
                        className="p-1.5 bg-muted/40 hover:bg-muted border border-border/80 hover:border-border rounded-sm text-muted-foreground hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm-sm"
                        title="Restore Item"
                      >
                        <ArrowCounterClockwise size={15} />
                      </button>
                      <button
                        onClick={item.delete}
                        className="p-1.5 bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/10 hover:border-red-500/20 rounded-sm text-red-500/80 transition-all cursor-pointer shadow-sm-sm"
                        title="Permanently Delete"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
