
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretLeft, CaretRight, CalendarBlank, ArrowsOutSimple, DotsThree, Tag, CaretDown, FileText, CaretUp, Trash, ArrowCircleRight, X, ArrowsInSimple } from '@phosphor-icons/react';
import { cn, getTagStyle } from '@/shared/lib/utils';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useTaskStore } from '@/features/tasks/store';
import { NotempleEditor } from '@/features/editor/NotempleEditor';
import { useSettingsStore } from '@/features/settings/store';
import { TaskEditorModal } from '@/features/tasks/components/TaskEditorModal';
import { getCalendarDays, formatDisplayDate, isSameDayInTimezone, isSameMonthInTimezone, isSameDayString, getZonedYear, getZonedMonth, getZonedDate, setZonedYear, setZonedMonth, changeZonedMonth, addDaysInTimezone, getMonthDateInTimezone } from '@/shared/lib/time';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useShallow } from 'zustand/react/shallow';

export const MonthViewItem = ({ docId, onClick }: { docId: string; onClick: () => void }) => {
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[docId];
      return doc ? { title: doc.title, content: doc.content, tags: doc.tags || [] } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));
  const tagColors = useDocumentStore(state => state.tagColors);

  if (!doc) return null;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-sm-sm border border-border bg-muted hover:bg-muted/80 transition-colors duration-150 cursor-pointer group flex flex-col gap-4 min-h-[260px]"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] pr-2 font-medium text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 py-0.5 rounded-sm border border-blue-300 dark:border-blue-500/30 flex items-center gap-1 w-fit whitespace-nowrap border">
          <div className="bg-blue-200/50 dark:bg-blue-500/20 p-1 rounded-sm-sm ml-0.5 border border-blue-300 dark:border-blue-500/30">
            <CalendarBlank size={12} weight="fill" />
          </div>{" "}
          Daily Note
        </span>
      </div>
      <h3 className="text-xl font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
        {(() => {
          const dateStr = docId.replace("daily-note-", "");
          const { timezone } = useSettingsStore.getState();
          const docDate = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });
          return formatDisplayDate(docDate.toISOString(), "MMMM d, yyyy");
        })()}
      </h3>
      <div className="flex-1 bg-background group-hover:bg-muted/40 rounded-sm-sm p-5 transition-colors border border-border overflow-hidden flex flex-col min-h-[140px]">
        {doc.title && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              <div className="bg-rose-200/80 text-rose-900 dark:text-rose-400 p-1.5 rounded-sm border border-rose-400 dark:border-rose-300">
                <FileText size={12} weight="fill" />
              </div>
              {doc.title}
            </div>
          </div>
        )}
        <div
          className="text-muted-foreground text-sm line-clamp-6 prose max-w-none prose-p:my-0 text-ellipsis break-words"
          dangerouslySetInnerHTML={{ __html: doc.content }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs mt-auto pt-2 border-t border-border/40 font-sans">
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
