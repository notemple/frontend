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
import { cn } from "@/shared/lib/utils";
import { useDocumentStore } from "@/features/documents/store";
import { useUiStore } from "@/shared/store/uiStore";
import { useTaskStore } from "@/features/tasks/store";
import { NotempleEditor } from "@/features/editor/NotempleEditor";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "@/features/settings/store";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { TaskEditorModal } from "@/features/tasks/components/TaskEditorModal";
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
} from "@/shared/lib/time";
import { useShallow } from 'zustand/react/shallow';
import { useCallback } from 'react';
import { CreatedTodayItem } from "./components/CreatedTodayItem";
import { MonthViewItem } from "./components/MonthViewItem";
import { MonthViewPane } from "./components/MonthViewPane";
import { WeekViewItem } from "./components/WeekViewItem";

// ==========================================
// OPTIMIZED SUB-COMPONENTS FOR PERFORMANCE
// ==========================================
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

  const tasks = useTaskStore(useShallow(state => state.tasks.filter(t => !t.isDeleted))) || [];
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
        if (!doc || doc.isDeleted) return false;
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
        if (!doc || doc.isDeleted) return false;
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
        if (!doc || doc.isDeleted) return false;
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
        if (!doc || doc.isDeleted) return false;
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
              ? "bg-rose-200/90 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-400 dark:border-rose-500/20 shadow-sm-sm hover:bg-rose-300 dark:hover:bg-rose-500/30 font-bold"
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
      {/* Layered background radial gradients for butter-smooth color transitions */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(168,85,247,0.06),transparent_60%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: view === "Month" ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(14,165,233,0.06),transparent_60%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: view === "Week" ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(245,158,11,0.06),transparent_60%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: view === "Day" ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
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
            <div className="flex items-center gap-1 bg-muted p-1 rounded-sm-sm border border-border">
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

                const activeTextColors = {
                  purple: "text-purple-700 dark:text-purple-400 font-bold border-purple-200/30 dark:border-purple-500/10 shadow-sm-sm",
                  sky: "text-sky-700 dark:text-sky-400 font-bold border-sky-200/30 dark:border-sky-500/10 shadow-sm-sm",
                  amber: "text-amber-700 dark:text-amber-400 font-bold border-amber-200/30 dark:border-amber-500/10 shadow-sm-sm",
                }[color];

                return (
                  <button
                    key={v}
                    onClick={() => setView(v as any)}
                    className={cn(
                      "relative px-4 py-1.5 text-[13px] font-semibold rounded-sm-sm transition-all duration-300 border border-transparent outline-none cursor-pointer",
                      view === v
                        ? activeTextColors
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {view === v && (
                      <motion.div
                        layoutId="activeDailyNotesViewBg"
                        className="absolute inset-0 rounded-sm-sm -z-10 border"
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
                className="flex items-center justify-center p-2 rounded-sm-sm border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm-sm cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-sm-sm border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm-sm select-none cursor-pointer"
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
                className="flex items-center justify-center p-2 rounded-sm-sm border border-border/80 bg-card-bg/40 text-foreground/80 hover:text-foreground hover:bg-muted transition-all shadow-sm-sm cursor-pointer"
              >
                <CaretRight size={14} weight="bold" />
              </button>
              <div className="w-px h-4 bg-border mx-2" />
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={cn(
                  "transition-all p-2 rounded-sm-sm border",
                  isCalendarOpen
                    ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow-sm-inner dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
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
                      "px-4 py-1 rounded-sm-full transition-all text-[13px] font-medium border duration-300",
                      isSelected
                        ? "bg-cyan-700 text-white dark:bg-cyan-500/10 dark:text-cyan-300 border-cyan-700 dark:border-cyan-500/20 shadow-sm-sm hover:bg-cyan-800"
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
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            >
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
                <>
                  <div className="flex flex-col gap-1 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-rose-500 dark:text-rose-400 font-medium">
                          {formatDisplayDate(selectedDate.toISOString(), "EEEE")}
                        </span>
                        {isSameDayInTimezone(selectedDate, new Date(), timezone) && (
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs px-2 py-0.5 rounded-sm font-medium border border-rose-500/20">
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

                  <div className="w-full h-px bg-border my-6" />

                  {/* Objects Section */}
                  <div className="flex flex-col gap-6">
                    {/* Created Today */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-sm-sm transition-colors group"
                        onClick={() => setIsCreatedTodayOpen(!isCreatedTodayOpen)}
                      >
                        <h2 className="text-sm font-medium text-foreground">
                          Created Today
                        </h2>
                        <span className="bg-muted text-muted-foreground text-xs px-2 rounded-sm-full font-medium">
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
                            <div className="col-span-full py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-sm-sm">
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
                        className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-sm-sm transition-colors group"
                        onClick={() => setIsUpdatedTodayOpen(!isUpdatedTodayOpen)}
                      >
                        <h2 className="text-sm font-medium text-foreground">
                          Updated Today
                        </h2>
                        <span className="bg-muted text-muted-foreground text-xs px-2 rounded-sm-full font-medium">
                          {objectsUpdatedTodayIds.length}
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
                            <div className="col-span-full py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-sm-sm">
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

                    {/* Tasks Created Today */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-sm-sm transition-colors group"
                        onClick={() => setIsTasksCreatedOpen(!isTasksCreatedOpen)}
                      >
                        <h2 className="text-sm font-medium text-foreground">
                          Tasks Created Today
                        </h2>
                        <span className="bg-muted text-muted-foreground text-xs px-2 rounded-sm-full font-medium">
                          {tasks.filter((t) => isSameDayString(t.createdAt, formattedDateId)).length}
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <button className="p-1 hover:text-foreground transition-colors">
                            <CalendarBlank size={14} />
                          </button>
                          <button className="p-1 hover:text-foreground transition-colors">
                            {isTasksCreatedOpen ? (
                              <CaretUp size={14} />
                            ) : (
                              <CaretDown size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {isTasksCreatedOpen && (
                        <div className="flex flex-col gap-2 mb-4">
                          {tasks
                            .filter((t) => isSameDayString(t.createdAt, formattedDateId))
                            .map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between group relative hover:bg-muted pl-2 pr-2 py-1 -mx-2 rounded-sm transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 shrink-0 rounded-sm-sm border transition-colors flex items-center justify-center cursor-pointer min-w-[20px]",
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
                                    <span className="text-xs text-muted-foreground border border-border rounded-sm px-2 py-0.5 bg-muted ml-2">
                                      Deadline: {formatDisplayDate(task.deadline, "MMM d")}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-sm-full hover:bg-muted"
                                  >
                                    <Trash size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingTaskId(task.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-sm-full hover:bg-muted"
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

                    {/* Tasks Finished Today */}
                    <div>
                      <div
                        className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-muted py-1 -mx-2 px-2 rounded-sm-sm transition-colors group"
                        onClick={() => setIsTasksFinishedOpen(!isTasksFinishedOpen)}
                      >
                        <h2 className="text-sm font-medium text-foreground">
                          Tasks with Deadline Today
                        </h2>
                        <span className="bg-muted text-muted-foreground text-xs px-2 rounded-sm-full font-medium">
                          {tasks.filter((t) => isSameDayString(t.deadline, formattedDateId)).length}
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <button className="p-1 hover:text-foreground transition-colors">
                            <CalendarBlank size={14} />
                          </button>
                          <button className="p-1 hover:text-foreground transition-colors">
                            {isTasksFinishedOpen ? (
                              <CaretUp size={14} />
                            ) : (
                              <CaretDown size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {isTasksFinishedOpen && (
                        <div className="flex flex-col gap-2 mb-4">
                          {tasks
                            .filter((t) => isSameDayString(t.deadline, formattedDateId))
                            .map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between group relative hover:bg-muted pl-2 pr-2 py-1 -mx-2 rounded-sm transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 shrink-0 rounded-sm-sm border transition-colors flex items-center justify-center cursor-pointer min-w-[20px]",
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
                                  <span className="text-xs text-muted-foreground border border-border rounded-sm px-2 py-0.5 bg-muted ml-2">
                                    Deadline: {formatDisplayDate(task.deadline, "MMM d")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-sm-full hover:bg-muted"
                                  >
                                    <Trash size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingTaskId(task.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-sm-full hover:bg-muted"
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
            </motion.div>
          </AnimatePresence>
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
