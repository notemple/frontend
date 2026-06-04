
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { FileText } from '@phosphor-icons/react';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const CreatedTodayItem = ({ docId, paneId }: { docId: string; paneId: string }) => {
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[docId];
      return doc ? { title: doc.title, tags: doc.tags } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));
  const setActiveTab = useUiStore((state) => state.setActiveTab);

  if (!doc) return null;

  return (
    <div
      onClick={() => setActiveTab(docId, paneId)}
      className="neu-flat border border-border p-4 rounded-sm-sm flex flex-col gap-3 group relative shadow-sm-none min-h-[120px] cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-medium border">
          <FileText size={12} weight="fill" /> Page
        </span>
      </div>
      <h3 className="font-bold text-foreground text-base truncate">
        {doc.title || "Untitled"}
      </h3>
      {doc.tags && doc.tags.length > 0 && (
        <div className="mt-auto pt-2 flex gap-1 flex-wrap">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/30 text-[10px] px-2 py-0.5 rounded-sm border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
