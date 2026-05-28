import { useState, useEffect } from "react";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  ArrowsOutSimple,
  DotsThree,
  Tag,
  CaretDown,
  FileText,
  CaretUp,
  Trash,
  ArrowCircleRight,
  X,
  ArrowsInSimple,
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { useDocumentStore } from "../store/documentStore";
import { useUiStore } from "../store/uiStore";
import { useTaskStore } from "../store/taskStore";
import { NotempleEditor } from "./editor/NotempleEditor";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "../store/settingsStore";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { TaskEditorModal } from "./TaskEditorModal";
import {
  getCalendarDays,
  formatDisplayDate,
  isSameDayInTimezone,
  isSameMonthInTimezone,
  isSameDayString,
  getZonedYear,
  getZonedMonth,
  getZonedDate,
  setZonedYear,
  setZonedMonth,
  changeZonedMonth,
  addDaysInTimezone,
  getMonthDateInTimezone,
} from "../lib/time";
import { useShallow } from 'zustand/react/shallow';
import { useCallback } from 'react';

// ==========================================
// OPTIMIZED SUB-COMPONENTS FOR PERFORMANCE
// ==========================================

const CreatedTodayItem = ({ docId, paneId }: { docId: string; paneId: string }) => {
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[docId];
      return doc ? { title: doc.title, tags: doc.tags } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));
  const { setActiveTab } = useUiStore();

  if (!doc) return null;

  return (
    <div
      onClick={() => setActiveTab(docId, paneId)}
      className="neu-flat border border-border p-4 rounded-xl flex flex-col gap-3 group relative shadow-none min-h-[120px] cursor-pointer hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium border">
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
              className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/30 text-[10px] px-2 py-0.5 rounded border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const MonthViewItem = ({ docId, onClick }: { docId: string; onClick: () => void }) => {
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[docId];
      return doc ? { title: doc.title, content: doc.content } : null;
    },
    [docId]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  if (!doc) return null;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-colors duration-150 cursor-pointer group flex flex-col gap-4 min-h-[260px]"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] pr-2 font-medium text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 py-0.5 rounded border border-blue-300 dark:border-blue-500/30 flex items-center gap-1 w-fit whitespace-nowrap border">
          <div className="bg-blue-200/50 dark:bg-blue-500/20 p-1 rounded-sm ml-0.5 border border-blue-300 dark:border-blue-500/30">
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
      <div className="flex-1 bg-background group-hover:bg-muted/40 rounded-lg p-5 transition-colors border border-border overflow-hidden flex flex-col min-h-[140px]">
        {doc.title && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              <div className="bg-rose-200/80 text-rose-900 dark:text-rose-400 p-1.5 rounded border border-rose-400 dark:border-rose-300">
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
      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1 font-medium">
        <Tag size={14} /> Tags
      </div>
    </div>
  );
};

const MonthViewPane = ({ selectedDate, setView, setSelectedDate }: {
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

const WeekViewItem = ({ date, formattedId, setView, setSelectedDate, onOpenFullEditor }: {
  date: Date;
  formattedId: string;
  setView: (v: "Day" | "Week" | "Month") => void;
  setSelectedDate: (d: Date) => void;
  onOpenFullEditor: (id: string) => void;
}) => {
  const { timezone } = useSettingsStore();
  const did = `daily-note-${formattedId}`;
  const docSelector = useCallback(
    (state: any) => {
      const doc = state.documents[did];
      return doc ? { title: doc.title, content: doc.content } : null;
    },
    [did]
  );
  const doc = useDocumentStore(useShallow(docSelector));

  const isMockToday = getZonedDate(date, timezone) === 17 && getZonedMonth(date, timezone) === 4;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-rose-500 dark:text-rose-400 font-medium">
            {formatDisplayDate(date.toISOString(), "EEEE")}
          </span>
          {isMockToday && (
            <span className="bg-rose-200 text-rose-900 dark:text-rose-300 text-xs px-2 py-0.5 rounded font-medium border border-rose-400/80 dark:border-rose-300">
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

      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-4">
        <Tag size={16} /> Tags
      </div>

      {doc ? (
        <div className="flex flex-col gap-3">
          {doc.title && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="bg-rose-200/80 text-rose-900 dark:text-rose-400 p-1.5 rounded-lg border border-rose-400 dark:border-rose-300">
                  <FileText size={16} weight="fill" />
                </div>
                <span className="text-foreground font-bold">
                  {doc.title}
                </span>
              </div>
              <button className="p-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-colors">
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

export const DailyNotesPage = ({ paneId }: { paneId: string }) => {
  const [view, setView] = useState<"Month" | "Week" | "Day">("Day");
  const { timezone, weekStartDay } = useSettingsStore();

  const { 
    selectedDailyNoteDate: selectedDate, 
    setSelectedDailyNoteDate: setSelectedDate, 
    setActiveTab, 
    openDocument,
    isDailyNoteFullView: isFullEditorOpen,
    setDailyNoteFullView: setIsFullEditorOpen
  } = useUiStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [isCreatedTodayOpen, setIsCreatedTodayOpen] = useState(true);
  const [isUpdatedTodayOpen, setIsUpdatedTodayOpen] = useState(true);
  const [isTasksCreatedOpen, setIsTasksCreatedOpen] = useState(true);
  const [isTasksFinishedOpen, setIsTasksFinishedOpen] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const tasks = useTaskStore(state => state.tasks) || [];
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);

  const formattedDateId = formatInTimeZone(
    selectedDate,
    timezone,
    "yyyy-MM-dd",
  );
  const documentId = `daily-note-${formattedDateId}`;

  // Optimized selector to get only the IDs of non-daily note documents created today
  const createdTodayIdsSelector = useCallback(
    (state: any) => {
      const order = state.documentOrder || [];
      return order.filter((id: string) => {
        const doc = state.documents[id];
        if (!doc) return false;
        if (doc.id.startsWith("daily-note-")) return false;
        return isSameDayString(doc.createdAt, formattedDateId);
      });
    },
    [formattedDateId]
  );
  const objectsCreatedTodayIds = useDocumentStore(useShallow(createdTodayIdsSelector));

  // Optimized selector for count of documents created today to avoid unnecessary re-renders
  const createdTodayCountSelector = useCallback(
    (state: any) => {
      const order = state.documentOrder || [];
      return order.filter((id: string) => {
        const doc = state.documents[id];
        if (!doc) return false;
        if (doc.id.startsWith("daily-note-")) return false;
        return isSameDayString(doc.createdAt, formattedDateId);
      }).length;
    },
    [formattedDateId]
  );
  const createdTodayCount = useDocumentStore(createdTodayCountSelector);

  // Optimized selector to get only the IDs of non-daily note documents updated today (but not created today)
  const updatedTodayIdsSelector = useCallback(
    (state: any) => {
      const order = state.documentOrder || [];
      return order.filter((id: string) => {
        const doc = state.documents[id];
        if (!doc) return false;
        if (doc.id.startsWith("daily-note-")) return false;
        return (
          isSameDayString(doc.updatedAt, formattedDateId) &&
          !isSameDayString(doc.createdAt, formattedDateId)
        );
      });
    },
    [formattedDateId]
  );
  const objectsUpdatedTodayIds = useDocumentStore(useShallow(updatedTodayIdsSelector));

  // Optimized selector for count of documents updated today to avoid unnecessary re-renders
  const updatedTodayCountSelector = useCallback(
    (state: any) => {
      const order = state.documentOrder || [];
      return order.filter((id: string) => {
        const doc = state.documents[id];
        if (!doc) return false;
        if (doc.id.startsWith("daily-note-")) return false;
        return (
          isSameDayString(doc.updatedAt, formattedDateId) &&
          !isSameDayString(doc.createdAt, formattedDateId)
        );
      }).length;
    },
    [formattedDateId]
  );
  const updatedTodayCount = useDocumentStore(updatedTodayCountSelector);

  const renderDays = () => {
    const calendarDays = getCalendarDays(selectedDate);
    return calendarDays.map((d, i) => {
      const isSelectedMonth = isSameMonthInTimezone(d, selectedDate, timezone);
      const isSelected = isSameDayInTimezone(d, selectedDate, timezone);
      return (
        <div
          key={i}
          onClick={() => setSelectedDate(d)}
          className={cn(
            "p-1 cursor-pointer hover:bg-muted flex items-center justify-center aspect-square relative transition-colors text-sm",
            !isSelectedMonth ? "text-muted-foreground/30" : "text-foreground",
            isSelected
              ? "bg-rose-200/90 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-400 dark:border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)] hover:bg-rose-300 dark:hover:bg-rose-500/30 font-bold"
              : "",
          )}
          style={{ borderRadius: isSelected ? "9999px" : undefined }}
        >
          {getZonedDate(d, timezone)}
        </div>
      );
    });
  };

  if (isFullEditorOpen) {
    return (
      <div className="flex w-full h-full text-foreground bg-workspace overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative min-h-full">
          <NotempleEditor
            key={documentId}
            documentId={documentId}
            paneId={paneId}
            isDailyNote={false}
            onClosePopup={() => setIsFullEditorOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full text-foreground bg-workspace overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative min-h-full">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />

        {/* Top Bar Navigation */}
        <div className="flex flex-col sticky top-0 bg-[image:var(--background-topbar)] dark:bg-background z-20 border-b border-border">
          <div className="flex items-center justify-between p-4 px-8 relative">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" />
            <div className="flex-1">
              {view === "Month" && (
                <span className="text-xl font-bold text-foreground/90 tracking-tight">
                  {formatDisplayDate(selectedDate.toISOString(), "MMM yyyy")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              {([
                { name: "Month", color: "purple" },
                { name: "Week", color: "sky" },
                { name: "Day", color: "amber" }
              ] as const).map(({ name: v, color }) => {
                const colorVars = {
                  purple: "var(--active-tab-purple)",
                  sky: "var(--active-tab-sky)",
                  amber: "var(--active-tab-amber)",
                }[color];

                return (
                  <button
                    key={v}
                    onClick={() => setView(v as any)}
                    className={cn(
                      "relative px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-colors border border-transparent outline-none cursor-pointer",
                      view === v
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {view === v && (
                      <motion.div
                        layoutId="activeDailyNotesViewBg"
                        className="absolute inset-0 rounded-lg -z-10"
                        style={{ backgroundColor: colorVars }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{v}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex-1 flex items-center justify-end gap-3 text-muted-foreground">
              <button
                onClick={() => {
                  if (view === "Month")
                    setSelectedDate(changeZonedMonth(selectedDate, -1, timezone));
                  else if (view === "Week")
                    setSelectedDate(addDaysInTimezone(selectedDate, -7, timezone));
                  else
                    setSelectedDate(addDaysInTimezone(selectedDate, -1, timezone));
                }}
                className="flex items-center justify-center p-2 rounded-md border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm select-none cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => {
                  if (view === "Month")
                    setSelectedDate(changeZonedMonth(selectedDate, 1, timezone));
                  else if (view === "Week")
                    setSelectedDate(addDaysInTimezone(selectedDate, 7, timezone));
                  else
                    setSelectedDate(addDaysInTimezone(selectedDate, 1, timezone));
                }}
                className="flex items-center justify-center p-2 rounded-md border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm cursor-pointer"
              >
                <CaretRight size={14} weight="bold" />
              </button>
              <div className="w-px h-4 bg-border mx-2" />
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={cn(
                  "transition-all p-2 rounded-lg border",
                  isCalendarOpen
                    ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow-inner dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                    : "border-border/80 bg-card-bg/40 text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 dark:border-transparent dark:bg-transparent dark:text-muted-foreground dark:hover:text-rose-400"
                )}
              >
                <CalendarBlank size={16} />
              </button>
            </div>
          </div>
          {view === "Month" && (
            <div className="flex items-center justify-between px-8 py-2 text-sm bg-muted border-t border-border sticky top-[73px] z-10 font-sans">
              {Array.from({ length: 12 }).map((_, i) => {
                const date = getMonthDateInTimezone(getZonedYear(selectedDate, timezone), i, timezone);
                const isSelected = getZonedMonth(selectedDate, timezone) === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(setZonedMonth(selectedDate, i, timezone));
                    }}
                    className={cn(
                      "px-4 py-1 rounded-full transition-all text-[13px] font-medium border duration-300",
                      isSelected
                        ? "bg-cyan-700 text-white dark:bg-cyan-500/10 dark:text-cyan-300 border-cyan-700 dark:border-cyan-500/20 shadow-sm hover:bg-cyan-800"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50",
                    )}
                  >
                    {formatDisplayDate(date.toISOString(), "MMM")}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content container */}
        <div className="px-8 pb-20 max-w-[900px] mx-auto w-full pt-10">
          {view === "Month" ? (
            <MonthViewPane
              selectedDate={selectedDate}
              setView={setView}
              setSelectedDate={setSelectedDate}
            />
          ) : view === "Week" ? (
            <div className="flex flex-col gap-12">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDaysInTimezone(selectedDate, i, timezone);
                const formattedId = formatInTimeZone(date, timezone, "yyyy-MM-dd");

                return (
                  <WeekViewItem
                    key={formattedId}
                    date={date}
                    formattedId={formattedId}
                    setView={setView}
                    setSelectedDate={setSelectedDate}
                    onOpenFullEditor={(noteId) => {
                      const dateStr = noteId.replace("daily-note-", "");
                      const parsedDate = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });
                      setSelectedDate(parsedDate);
                      setIsFullEditorOpen(true);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-1 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-rose-500 dark:text-rose-400 font-medium">
                    {formatDisplayDate(selectedDate.toISOString(), "EEEE")}
                  </span>
                  {getZonedDate(selectedDate, timezone) === 17 && getZonedMonth(selectedDate, timezone) === 4 && (
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs px-2 py-0.5 rounded font-medium border border-rose-500/20">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <button
                    onClick={() => setIsFullEditorOpen(true)}
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

              <div className="flex items-baseline gap-4 mt-2">
                <h1 className="text-5xl font-bold tracking-tight">
                  {formatDisplayDate(selectedDate.toISOString(), "MMMM d, yyyy")}
                </h1>
                <span className="text-muted-foreground font-medium text-lg">
                  Week 20
                </span>
              </div>
              <div className="text-foreground mt-4 mb-2 text-sm font-medium">
                Daily note
              </div>

              {/* Use the NotempleEditor */}
              <NotempleEditor
                key={documentId}
                documentId={documentId}
                paneId={paneId}
                isDailyNote={true}
                isMinimized={true}
              />
            </div>
          )}

          {view === "Day" && (
            <>
              <div className="w-full h-px bg-border my-6" />

              {/* Objects Section */}
              <div className="flex flex-col gap-6">
                {/* Created Today */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-lg transition-colors group"
                    onClick={() => setIsCreatedTodayOpen(!isCreatedTodayOpen)}
                  >
                    <h2 className="text-sm font-medium text-foreground">
                      Created Today
                    </h2>
                    <span className="bg-muted text-muted-foreground text-xs px-2 rounded-full font-medium">
                      {createdTodayCount}
                    </span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-1 hover:text-foreground transition-colors">
                        <CalendarBlank size={14} />
                      </button>
                      <button className="p-1 hover:text-foreground transition-colors">
                        {isCreatedTodayOpen ? (
                          <CaretUp size={14} />
                        ) : (
                          <CaretDown size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isCreatedTodayOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {objectsCreatedTodayIds.length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                          No other documents created today.
                        </div>
                      )}
                      {objectsCreatedTodayIds.map((id) => (
                        <CreatedTodayItem
                          key={id}
                          docId={id}
                          paneId={paneId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Updated Today */}
                <div>
                  <div
                    className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-lg transition-colors group"
                    onClick={() => setIsUpdatedTodayOpen(!isUpdatedTodayOpen)}
                  >
                    <h2 className="text-sm font-medium text-foreground">
                      Updated Today
                    </h2>
                    <span className="bg-muted text-muted-foreground text-xs px-2 rounded-full font-medium">
                      {updatedTodayCount}
                    </span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-1 hover:text-foreground transition-colors">
                        <CalendarBlank size={14} />
                      </button>
                      <button className="p-1 hover:text-foreground transition-colors">
                        {isUpdatedTodayOpen ? (
                          <CaretUp size={14} />
                        ) : (
                          <CaretDown size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isUpdatedTodayOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {objectsUpdatedTodayIds.length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                          No other documents updated today.
                        </div>
                      )}
                      {objectsUpdatedTodayIds.map((id) => (
                        <CreatedTodayItem
                          key={id}
                          docId={id}
                          paneId={paneId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col mt-10 gap-6">
                {/* Tasks Created Today */}
                <div className="flex flex-col">
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer group select-none py-1 -mx-2 px-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsTasksCreatedOpen(!isTasksCreatedOpen)}
                  >
                    <h2 className="text-sm font-medium text-foreground">
                      Today's tasks (Created)
                    </h2>
                    <span className="bg-muted text-muted-foreground text-xs px-2 rounded-full font-medium">
                      {tasks.filter((t) => isSameDayString(t.createdAt, formattedDateId)).length}
                    </span>
                    <div className="flex-1" />
                    <button className="text-muted-foreground group-hover:text-foreground transition-colors p-1">
                      {isTasksCreatedOpen ? (
                        <CaretUp size={14} />
                      ) : (
                        <CaretDown size={14} />
                      )}
                    </button>
                  </div>

                  {isTasksCreatedOpen && (
                    <div className="flex flex-col gap-2 mb-4">
                      {tasks
                        .filter((t) => isSameDayString(t.createdAt, formattedDateId))
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between group relative hover:bg-muted pl-2 pr-2 py-1 -mx-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-5 h-5 shrink-0 rounded-[4px] border transition-colors flex items-center justify-center cursor-pointer min-w-[20px]",
                                  task.completed
                                    ? "bg-purple-500 border-purple-500 text-white"
                                    : "border-border hover:border-muted-foreground",
                                )}
                                onClick={() =>
                                  updateTask(task.id, {
                                    completed: !task.completed,
                                  })
                                }
                              />
                              <span
                                className={cn(
                                  "text-sm font-medium transition-colors",
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground",
                                )}
                              >
                                {task.title}
                              </span>
                              {task.deadline && (
                                <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 bg-muted ml-2">
                                  Deadline: {formatDisplayDate(task.deadline, "MMM d")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted"
                              >
                                <Trash size={16} />
                              </button>
                              <button
                                onClick={() => setEditingTaskId(task.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted"
                              >
                                <ArrowCircleRight size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      {tasks.filter((t) => isSameDayString(t.createdAt, formattedDateId)).length === 0 && (
                        <div className="text-muted-foreground text-sm italic py-2">
                          No tasks created on this date.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tasks to be Completed */}
                <div className="flex flex-col">
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer group select-none py-1 -mx-2 px-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsTasksFinishedOpen(!isTasksFinishedOpen)}
                  >
                    <h2 className="text-sm font-medium text-foreground">
                      Tasks to be completed
                    </h2>
                    <span className="bg-muted text-muted-foreground text-xs px-2 rounded-full font-medium">
                      {tasks.filter((t) => isSameDayString(t.deadline, formattedDateId)).length}
                    </span>
                    <div className="flex-1" />
                    <button className="text-muted-foreground group-hover:text-foreground transition-colors p-1">
                      {isTasksFinishedOpen ? (
                        <CaretUp size={14} />
                      ) : (
                        <CaretDown size={14} />
                      )}
                    </button>
                  </div>

                  {isTasksFinishedOpen && (
                    <div className="flex flex-col gap-2 mb-4">
                      {tasks
                        .filter((t) => isSameDayString(t.deadline, formattedDateId))
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between group relative hover:bg-muted pl-2 pr-2 py-1 -mx-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-5 h-5 shrink-0 rounded-sm border transition-colors flex items-center justify-center cursor-pointer min-w-[20px]",
                                  task.completed
                                    ? "bg-purple-500 border-purple-500 text-white"
                                    : "border-border hover:border-muted-foreground",
                                )}
                                onClick={() =>
                                  updateTask(task.id, {
                                    completed: !task.completed,
                                  })
                                }
                              />
                              <span
                                className={cn(
                                  "text-sm font-medium transition-colors",
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground",
                                )}
                              >
                                {task.title}
                              </span>
                              <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 bg-muted ml-2">
                                Deadline: {formatDisplayDate(task.deadline, "MMM d")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted"
                              >
                                <Trash size={16} />
                              </button>
                              <button
                                onClick={() => setEditingTaskId(task.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted"
                              >
                                <ArrowCircleRight size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      {tasks.filter((t) => isSameDayString(t.deadline, formattedDateId)).length === 0 && (
                        <div className="text-muted-foreground text-sm italic py-2">
                          No tasks with deadline on this date.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side Calendar View */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-[var(--border-calendar)] bg-[var(--background-calendar)] shrink-0 flex flex-col p-4 overflow-hidden"
          >
            <div className="w-67">
              <div className="flex items-center justify-between mb-4 text-sm font-medium text-muted-foreground w-full">
                <button
                  className="p-1 hover:text-foreground"
                  onClick={() => {
                    setSelectedDate(changeZonedMonth(selectedDate, -1, timezone));
                  }}
                >
                  <CaretLeft size={16} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center group">
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={getZonedMonth(selectedDate, timezone)}
                      onChange={(e) => {
                        setSelectedDate(setZonedMonth(selectedDate, parseInt(e.target.value), timezone));
                      }}
                    >
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                        <option key={i} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="cursor-pointer group-hover:text-foreground">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][getZonedMonth(selectedDate, timezone)]}{" "}
                      <CaretDown size={12} className="inline ml-1" />
                    </span>
                  </div>
                  <div className="relative flex items-center group">
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={getZonedYear(selectedDate, timezone)}
                      onChange={(e) => {
                        setSelectedDate(setZonedYear(selectedDate, parseInt(e.target.value), timezone));
                      }}
                    >
                      {Array.from({ length: 10 }).map((_, i) => {
                        const year = getZonedYear(new Date(), timezone) - 5 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="cursor-pointer group-hover:text-foreground">
                      {getZonedYear(selectedDate, timezone)}{" "}
                      <CaretDown size={12} className="inline ml-1" />
                    </span>
                  </div>
                </div>
                <button
                  className="p-1 hover:text-foreground"
                  onClick={() => {
                    setSelectedDate(changeZonedMonth(selectedDate, 1, timezone));
                  }}
                >
                  <CaretRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground font-medium w-full">
                {["S", "M", "T", "W", "T", "F", "S"]
                  .slice(weekStartDay)
                  .concat(
                    ["S", "M", "T", "W", "T", "F", "S"].slice(0, weekStartDay),
                  )
                  .map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-medium w-full">
                {(() => {
                  // Dynamically import time utility or assume it is available (since we imported getCalendarDays from time.ts, wait we didn't import it in DailyNotesPage)
                  // I need to import getCalendarDays first. See next edits.
                  return null;
                })()}
                {renderDays()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <TaskEditorModal
        taskId={editingTaskId}
        onClose={() => setEditingTaskId(null)}
      />
    </div>
  );
};
