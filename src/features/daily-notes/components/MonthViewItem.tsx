
import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { formatDisplayDate } from '@/shared/lib/time';
import { getTagStyle } from '@/shared/lib/utils';
import { CalendarBlank, FileText, Tag } from '@phosphor-icons/react';
import { toDate } from 'date-fns-tz';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const MonthViewItem = ({ docId, onClick }: { docId: string; onClick: () => void }) => {
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[docId];
      return doc ? { title: doc.title, content: doc.content, contentText: doc.contentText, tags: doc.tags || [], icon: doc.icon } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));
  const tagColors = useDocumentStore(state => state.tagColors);

  if (!doc) return null;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-sm-sm border border-border bg-muted hover:bg-muted/80 transition-colors duration-150 cursor-pointer group flex flex-col gap-4 min-h-[260px] h-full"
    >
      <h3 className="text-xl font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
        {doc?.icon && <span className="select-none">{doc.icon}</span>}
        {(() => {
          const dateStr = docId.replace("daily-note-", "");
          const { timezone } = useSettingsStore.getState();
          const docDate = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });
          return formatDisplayDate(docDate.toISOString(), "MMMM d, yyyy");
        })()}
      </h3>
      <div className="flex-1 bg-background group-hover:bg-muted/40 rounded-sm-sm p-5 transition-colors border border-border overflow-hidden flex flex-col min-h-[140px]">
        <div
          className="text-muted-foreground text-sm line-clamp-6 prose max-w-none prose-p:my-0 text-ellipsis break-words whitespace-pre-wrap"
        >
          {doc.contentText || doc.content || "Empty note..."}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs mt-auto pt-2 border-t border-border/25 font-sans">
        <Tag size={12} className="shrink-0 text-muted-foreground opacity-60" />
        {doc.tags && doc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag: string) => {
              const tagStyle = getTagStyle(tag, tagColors);
              return (
                <span
                  key={tag}
                  className="tag-element flex items-center gap-0.5 border text-[10px] px-1.5 py-0.5 transition-colors font-medium rounded-sm"
                  style={{
                    backgroundColor: 'var(--tag-bg)',
                    borderColor: 'var(--tag-border)',
                    color: 'var(--tag-text)',
                    ...tagStyle
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 italic font-normal">No tags</span>
        )}
      </div>
    </div>
  );
};
