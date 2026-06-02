
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretLeft, CaretRight, CalendarBlank, ArrowsOutSimple, DotsThree, Tag, CaretDown, FileText, CaretUp, Trash, ArrowCircleRight, X, ArrowsInSimple } from '@phosphor-icons/react';
import { cn, getTagStyle } from '@/shared/lib/utils';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useTaskStore } from '@/features/tasks/store';
import { TemplnoteEditor } from '@/features/editor/TemplnoteEditor';
import { useSettingsStore } from '@/features/settings/store';
import { TaskEditorModal } from '@/features/tasks/components/TaskEditorModal';
import { getCalendarDays, formatDisplayDate, isSameDayInTimezone, isSameMonthInTimezone, isSameDayString, getZonedYear, getZonedMonth, getZonedDate, setZonedYear, setZonedMonth, changeZonedMonth, addDaysInTimezone, getMonthDateInTimezone } from '@/shared/lib/time';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useShallow } from 'zustand/react/shallow';

export const WeekViewItem = ({ date, formattedId, setView, setSelectedDate, onOpenFullEditor }: {
  date: Date;
  formattedId: string;
  setView: (v: "Day" | "Week" | "Month") => void;
  setSelectedDate: (d: Date) => void;
  onOpenFullEditor: (id: string) => void;
}) => {
  const timezone = useSettingsStore((state) => state.timezone);
  const did = `daily-note-${formattedId}`;
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[did];
      return doc ? { title: doc.title, content: doc.content, tags: doc.tags || [] } : null;
    },
    [did]
  );
  const doc = useDocumentStore(useShallow(docSelector));
  const tagColors = useDocumentStore(state => state.tagColors);

  const isToday = isSameDayInTimezone(date, new Date(), timezone);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-rose-500 dark:text-rose-400 font-medium">
            {formatDisplayDate(date.toISOString(), "EEEE")}
          </span>
          {isToday && (
            <span className="bg-rose-200 text-rose-900 dark:text-rose-300 text-xs px-2 py-0.5 rounded-sm font-medium border border-rose-400/80 dark:border-rose-300">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button
            onClick={() => {
              onOpenFullEditor(did);
            }}
            className="p-1 hover:text-foreground transition-colors cursor-pointer"
            title="Open in full editor"
          >
            <ArrowsOutSimple size={14} />
          </button>
          <button className="p-1 hover:text-foreground transition-colors">
            <DotsThree size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-4 mt-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {formatDisplayDate(date.toISOString(), "MMMM d, yyyy")}
        </h1>
        <span className="text-muted-foreground font-medium text-sm">
          Week 20
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm font-medium mb-4 font-sans">
        <Tag size={16} className="shrink-0 opacity-60" />
        {doc && doc.tags && doc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map((tag: string) => {
              const tagStyle = getTagStyle(tag, tagColors);
              return (
                <span
                  key={tag}
                  className="tag-element flex items-center gap-0.5 border text-xs px-2 py-0.5 transition-colors font-medium rounded-sm-sm"
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
          <span className="text-xs text-muted-foreground/60 italic font-normal">No tags</span>
        )}
      </div>

      {doc ? (
        <div className="flex flex-col gap-3">
          {doc.title && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="bg-rose-200/80 text-rose-900 dark:text-rose-400 p-1.5 rounded-sm-sm border border-rose-400 dark:border-rose-300">
                  <FileText size={16} weight="fill" />
                </div>
                <span className="text-foreground font-bold">
                  {doc.title}
                </span>
              </div>
              <button className="p-1.5 rounded-sm-full bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors">
                <DotsThree size={16} />
              </button>
            </div>
          )}
          <div
            className="text-foreground/90 text-sm mt-1 prose max-w-none prose-p:my-1 line-clamp-2 overflow-hidden text-ellipsis"
            dangerouslySetInnerHTML={{
              __html: doc.content,
            }}
          />
        </div>
      ) : (
        <div className="text-muted-foreground text-sm italic mt-2">
          Empty note...
        </div>
      )}

      <div className="w-full h-px bg-border mt-12" />
    </div>
  );
};
