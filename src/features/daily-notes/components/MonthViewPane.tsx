import { MonthViewItem } from './MonthViewItem';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaretLeft, CaretRight, CalendarBlank, ArrowsOutSimple, DotsThree, Tag, CaretDown, FileText, CaretUp, Trash, ArrowCircleRight, X, ArrowsInSimple } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useTaskStore } from '@/features/tasks/store';
import { NotempleEditor } from '@/features/editor/NotempleEditor';
import { useSettingsStore } from '@/features/settings/store';
import { TaskEditorModal } from '@/features/tasks/components/TaskEditorModal';
import { getCalendarDays, formatDisplayDate, isSameDayInTimezone, isSameMonthInTimezone, isSameDayString, getZonedYear, getZonedMonth, getZonedDate, setZonedYear, setZonedMonth, changeZonedMonth, addDaysInTimezone, getMonthDateInTimezone } from '@/shared/lib/time';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useShallow } from 'zustand/react/shallow';

export const MonthViewPane = ({ selectedDate, setView, setSelectedDate }: {
  selectedDate: Date;
  setView: (v: "Day" | "Week" | "Month") => void;
  setSelectedDate: (d: Date) => void;
}) => {
  const { timezone } = useSettingsStore();

  const monthDocIdsSelector = useCallback(
    (state: any) => {
      const year = getZonedYear(selectedDate, timezone);
      const month = getZonedMonth(selectedDate, timezone);
      const docs = state.documentOrder
        .map((id: string) => state.documents[id])
        .filter((doc: any) => !!doc && doc.id.startsWith("daily-note-"))
        .filter((doc: any) => {
          const dateParts = doc.id.replace("daily-note-", "").split("-");
          if (dateParts.length !== 3) return false;
          const docYear = parseInt(dateParts[0], 10);
          const docMonth = parseInt(dateParts[1], 10) - 1;
          return docYear === year && docMonth === month;
        });

      // Sort by ID descending
      docs.sort((a: any, b: any) => b.id.localeCompare(a.id));
      return docs.map((doc: any) => doc.id);
    },
    [selectedDate, timezone]
  );
  const monthDocIds = useDocumentStore(useShallow(monthDocIdsSelector));

  if (monthDocIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-2">
        <h2 className="text-xl font-bold text-foreground">
          No daily notes created for this month.
        </h2>
        <p className="text-muted-foreground">
          You can change this by creating a new object.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full max-w-none">
      {monthDocIds.map((docId) => {
        const dateParts = docId.replace("daily-note-", "").split("-");
        const docYear = dateParts[0];
        const docMonth = dateParts[1];
        const docDay = dateParts[2];
        const docDate = toDate(`${docYear}-${String(docMonth).padStart(2, '0')}-${String(docDay).padStart(2, '0')}T00:00:00`, { timeZone: timezone });

        return (
          <MonthViewItem
            key={docId}
            docId={docId}
            onClick={() => {
              setSelectedDate(docDate);
              setView("Day");
            }}
          />
        );
      })}
    </div>
  );
};
