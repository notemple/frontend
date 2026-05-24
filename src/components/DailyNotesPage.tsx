import { useState } from "react";
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
} from "@phosphor-icons/react";
import { cn } from "../lib/utils";
import { useDocumentStore } from "../store/documentStore";
import { useUiStore } from "../store/uiStore";
import { useTaskStore } from "../store/taskStore";
import { NotempleEditor } from "./editor/NotempleEditor";
import { motion, AnimatePresence } from "motion/react";
import { useSettingsStore } from "../store/settingsStore";
import { formatInTimeZone } from "date-fns-tz";
import { TaskEditorModal } from "./TaskEditorModal";

import { getCalendarDays } from "../lib/time";

export const DailyNotesPage = ({ paneId }: { paneId: string }) => {
  const [view, setView] = useState<"Month" | "Week" | "Day">("Day");
  const { timezone, weekStartDay } = useSettingsStore();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date();
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [isCreatedTodayOpen, setIsCreatedTodayOpen] = useState(true);
  const [isTasksCreatedOpen, setIsTasksCreatedOpen] = useState(true);
  const [isTasksFinishedOpen, setIsTasksFinishedOpen] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  let { documents, documentOrder } = useDocumentStore();
  documents = documents || {};
  documentOrder = documentOrder || [];
  let { tasks, updateTask, deleteTask } = useTaskStore();
  tasks = tasks || [];
  const { setActiveTab } = useUiStore();

  const formattedDateId = formatInTimeZone(
    selectedDate,
    timezone,
    "yyyy-MM-dd",
  );
  const documentId = `daily-note-${formattedDateId}`;

  const objectsCreatedToday = documentOrder.filter((id) => {
    const doc = documents[id];
    if (!doc) return false;
    if (doc.id.startsWith("daily-note-")) return false;
    return doc.updatedAt.startsWith(formattedDateId);
  });
  const createdTodayCount = objectsCreatedToday.length;

  const renderDays = () => {
    const calendarDays = getCalendarDays(selectedDate);
    return calendarDays.map((d, i) => {
      const isSelectedMonth = d.getMonth() === selectedDate.getMonth();
      const isSelected =
        isSelectedMonth && d.getDate() === selectedDate.getDate();
      return (
        <div
          key={i}
          onClick={() => setSelectedDate(d)}
          className={cn(
            "p-1 cursor-pointer hover:bg-white/10 flex items-center justify-center aspect-square relative transition-colors text-sm",
            !isSelectedMonth ? "text-muted-foreground/30" : "text-foreground",
            isSelected
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)] hover:bg-rose-500/30 font-bold"
              : "",
          )}
          style={{ borderRadius: isSelected ? "9999px" : undefined }}
        >
          {d.getDate()}
        </div>
      );
    });
  };

  return (
    <div className="flex w-full h-full text-foreground bg-background overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative min-h-full">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />

        {/* Top Bar Navigation */}
        <div className="flex flex-col sticky top-0 bg-muted/40 backdrop-blur-3xl z-20 transition-all border-b border-border">
          <div className="flex items-center justify-between p-4 px-8 relative">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none" />
            <div className="flex-1">
              {view === "Month" && (
                <span className="text-xl font-bold text-foreground/90 tracking-tight">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              {([
                { name: "Month", color: "purple" },
                { name: "Week", color: "sky" },
                { name: "Day", color: "amber" }
              ] as const).map(({ name: v, color }) => {
                const schemeClasses = {
                  purple: {
                    active: "bg-purple-500/10 text-purple-600 dark:text-purple-300 ring-1 ring-purple-500/20 font-semibold shadow-inner",
                    inactive: "text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/5",
                  },
                  sky: {
                    active: "bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/20 font-semibold shadow-inner",
                    inactive: "text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/5",
                  },
                  amber: {
                    active: "bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/20 font-semibold shadow-inner",
                    inactive: "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5",
                  },
                }[color];

                return (
                  <button
                    key={v}
                    onClick={() => setView(v as any)}
                    className={cn(
                      "px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all",
                      view === v ? schemeClasses.active : schemeClasses.inactive
                    )}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 flex items-center justify-end gap-3 text-muted-foreground">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (view === "Month")
                    newDate.setMonth(newDate.getMonth() - 1);
                  else if (view === "Week")
                    newDate.setDate(newDate.getDate() - 7);
                  else newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
                className="hover:text-foreground hover:bg-muted/80 transition-all p-2 rounded-md"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <span
                className="text-[13px] font-medium text-foreground/75 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  if (view === "Month")
                    newDate.setMonth(newDate.getMonth() + 1);
                  else if (view === "Week")
                    newDate.setDate(newDate.getDate() + 7);
                  else newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
                className="hover:text-foreground hover:bg-muted/80 transition-all p-2 rounded-md"
              >
                <CaretRight size={16} weight="bold" />
              </button>
              <div className="w-px h-4 bg-border mx-2" />
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={cn(
                  "transition-all p-2 rounded-lg border",
                  isCalendarOpen
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20 shadow-inner"
                    : "border-transparent text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5",
                )}
              >
                <CalendarBlank size={16} />
              </button>
            </div>
          </div>
          {view === "Month" && (
            <div className="flex items-center justify-between px-8 py-2 text-sm bg-muted/40 backdrop-blur-md border-t border-border sticky top-[73px] z-10 font-sans">
              {Array.from({ length: 12 }).map((_, i) => {
                const date = new Date(selectedDate);
                date.setMonth(i);
                const isSelected = selectedDate.getMonth() === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(i);
                      setSelectedDate(newDate);
                    }}
                    className={cn(
                      "px-4 py-1 rounded-full transition-all text-[13px] font-medium border duration-300",
                      isSelected
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50",
                    )}
                  >
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content container */}
        <div className="px-8 pb-20 max-w-[900px] mx-auto w-full pt-10">
          {view === "Month" ? (
            (() => {
              // Get all documents for the selected month
              const monthDocs = documentOrder
                .map((id) => documents[id])
                .filter((doc) => !!doc && doc.id.startsWith("daily-note-"))
                .filter((doc) => {
                  const dateParts = doc.id
                    .replace("daily-note-", "")
                    .split("-");
                  if (dateParts.length !== 3) return false;
                  const docYear = parseInt(dateParts[0], 10);
                  const docMonth = parseInt(dateParts[1], 10) - 1;
                  return (
                    docYear === selectedDate.getFullYear() &&
                    docMonth === selectedDate.getMonth()
                  );
                });

              monthDocs.sort((a, b) => b.id.localeCompare(a.id));

              if (monthDocs.length === 0) {
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
                  {monthDocs.map((doc) => {
                    const dateParts = doc.id
                      .replace("daily-note-", "")
                      .split("-");
                    const docYear = parseInt(dateParts[0], 10);
                    const docMonth = parseInt(dateParts[1], 10) - 1;
                    const docDay = parseInt(dateParts[2], 10);
                    const docDate = new Date(docYear, docMonth, docDay);

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDate(docDate);
                          setView("Day");
                        }}
                        className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/65 transition-all cursor-pointer group flex flex-col gap-4 min-h-[260px]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] pr-2 font-medium text-blue-500 bg-blue-500/10 py-0.5 rounded border border-blue-500/20 flex items-center gap-1 w-fit whitespace-nowrap">
                            <div className="bg-blue-500/20 p-1 rounded-sm ml-0.5">
                              <CalendarBlank size={12} weight="fill" />
                            </div>{" "}
                            Daily Note
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                          {docDate.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h3>
                        <div className="flex-1 bg-background group-hover:bg-muted/40 rounded-lg p-5 transition-colors border border-border overflow-hidden flex flex-col min-h-[140px]">
                          {doc.title && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                                <div className="bg-rose-500/15 text-rose-600 dark:text-rose-400 p-1.5 rounded border border-rose-500/20">
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
                  })}
                </div>
              );
            })()
          ) : view === "Week" ? (
            <div className="flex flex-col gap-12">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date(selectedDate);
                date.setDate(selectedDate.getDate() + i);
                const formattedId = date.toISOString().split("T")[0];
                const did = `daily-note-${formattedId}`;
                const doc = documents[did];

                const isMockToday =
                  date.getDate() === 17 && date.getMonth() === 4;

                return (
                  <div key={formattedId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-rose-500 dark:text-rose-400 font-medium">
                          {date.toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </span>
                        {isMockToday && (
                          <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs px-2 py-0.5 rounded font-medium border border-rose-500/20">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <button
                          onClick={() => {
                            setSelectedDate(date);
                            setView("Day");
                          }}
                          className="p-1 hover:text-foreground transition-colors"
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
                        {date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
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
                              <div className="bg-rose-500/15 text-rose-600 dark:text-rose-400 p-1.5 rounded-lg border border-rose-500/20">
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
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-1 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-rose-500 dark:text-rose-400 font-medium">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>
                  {selectedDate.getDate() === 17 && (
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs px-2 py-0.5 rounded font-medium border border-rose-500/20">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <button className="p-1 hover:text-foreground transition-colors">
                    <ArrowsOutSimple size={14} />
                  </button>
                  <button className="p-1 hover:text-foreground transition-colors">
                    <DotsThree size={16} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-4 mt-2">
                <h1 className="text-5xl font-bold tracking-tight">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
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
              />
            </div>
          )}

          {view === "Day" && (
            <>
              <div className="w-full h-px bg-border my-6" />

              {/* Objects Section */}
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

                <AnimatePresence>
                  {isCreatedTodayOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {documentOrder.filter((id) => {
                          const doc = documents[id];
                          if (!doc) return false;
                          // Exclude daily notes from this list
                          if (doc.id.startsWith("daily-note-")) return false;
                          return doc.updatedAt.startsWith(formattedDateId);
                        }).length === 0 && (
                            <div className="col-span-full py-8 text-center text-muted-foreground text-sm font-medium border border-dashed border-border rounded-xl">
                              No other documents created today.
                            </div>
                          )}
                        {documentOrder
                          .filter((id) => {
                            const doc = documents[id];
                            if (!doc) return false;
                            if (doc.id.startsWith("daily-note-")) return false;
                            return doc.updatedAt.startsWith(formattedDateId);
                          })
                          .map((id) => {
                            const doc = documents[id];
                            return (
                              <div
                                key={id}
                                onClick={() => setActiveTab(id, paneId)}
                                className="neu-flat border border-border p-4 rounded-xl flex flex-col gap-3 group relative shadow-none min-h-[120px] cursor-pointer hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
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
                                        className="bg-emerald-600/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                      {
                        tasks.filter((t) => {
                          const { timezone } = useSettingsStore.getState();
                          if (!t.createdAt) return false;
                          return (
                            formatInTimeZone(
                              new Date(t.createdAt),
                              timezone,
                              "yyyy-MM-dd",
                            ) === formattedDateId
                          );
                        }).length
                      }
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

                  <AnimatePresence>
                    {isTasksCreatedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 mb-4">
                          {tasks
                            .filter((t) => {
                              const { timezone } = useSettingsStore.getState();
                              if (!t.createdAt) return false;
                              return (
                                formatInTimeZone(
                                  new Date(t.createdAt),
                                  timezone,
                                  "yyyy-MM-dd",
                                ) === formattedDateId
                              );
                            })
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
                                      Deadline:{" "}
                                      {(() => {
                                        const d = new Date(task.deadline);
                                        if (isNaN(d.getTime())) return task.deadline;
                                        return formatInTimeZone(d, timezone, "MMM d");
                                      })()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10"
                                  >
                                    <Trash size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingTaskId(task.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10"
                                  >
                                    <ArrowCircleRight size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          {tasks.filter((t) => {
                            const { timezone } = useSettingsStore.getState();
                            if (!t.createdAt) return false;
                            return (
                              formatInTimeZone(
                                new Date(t.createdAt),
                                timezone,
                                "yyyy-MM-dd",
                              ) === formattedDateId
                            );
                          }).length === 0 && (
                              <div className="text-muted-foreground text-sm italic py-2">
                                No tasks created on this date.
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tasks to be Completed */}
                <div className="flex flex-col">
                  <div
                    className="flex items-center gap-2 mb-2 cursor-pointer group select-none py-1 -mx-2 px-2 hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setIsTasksFinishedOpen(!isTasksFinishedOpen)}
                  >
                    <h2 className="text-sm font-medium text-foreground">
                      Tasks to be completed
                    </h2>
                    <span className="bg-[#2A2A2A] text-muted-foreground text-xs px-2 rounded-full font-medium">
                      {
                        tasks.filter((t) => {
                          const { timezone } = useSettingsStore.getState();
                          if (!t.deadline) return false;
                          const d = new Date(t.deadline);
                          if (isNaN(d.getTime())) return false;
                          return (
                            formatInTimeZone(
                              d,
                              timezone,
                              "yyyy-MM-dd",
                            ) === formattedDateId
                          );
                        }).length
                      }
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

                  <AnimatePresence>
                    {isTasksFinishedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 mb-4">
                          {tasks
                            .filter((t) => {
                              const { timezone } = useSettingsStore.getState();
                              if (!t.deadline) return false;
                              const d = new Date(t.deadline);
                              if (isNaN(d.getTime())) return false;
                              return (
                                formatInTimeZone(
                                  d,
                                  timezone,
                                  "yyyy-MM-dd",
                                ) === formattedDateId
                              );
                            })
                            .map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between group relative hover:bg-white/5 pl-2 pr-2 py-1 -mx-2 rounded transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 shrink-0 rounded-[4px] border transition-colors flex items-center justify-center cursor-pointer min-w-[20px]",
                                      task.completed
                                        ? "bg-purple-500 border-purple-500 text-white"
                                        : "border-white/20 hover:border-white/40",
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
                                  <span className="text-xs text-muted-foreground border border-white/5 rounded px-2 py-0.5 bg-white/5 ml-2">
                                    Deadline:{" "}
                                    {(() => {
                                      const d = new Date(task.deadline);
                                      if (isNaN(d.getTime())) return task.deadline;
                                      return formatInTimeZone(d, timezone, "MMM d");
                                    })()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10"
                                  >
                                    <Trash size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingTaskId(task.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10"
                                  >
                                    <ArrowCircleRight size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          {tasks.filter((t) => {
                            const { timezone } = useSettingsStore.getState();
                            if (!t.deadline) return false;
                            const d = new Date(t.deadline);
                            if (isNaN(d.getTime())) return false;
                            return (
                              formatInTimeZone(
                                d,
                                timezone,
                                "yyyy-MM-dd",
                              ) === formattedDateId
                            );
                          }).length === 0 && (
                              <div className="text-muted-foreground text-sm italic py-2">
                                No tasks with deadline on this date.
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
            className="border-l border-border bg-background shrink-0 flex flex-col p-4 overflow-hidden"
          >
            <div className="w-[268px]">
              <div className="flex items-center justify-between mb-4 text-sm font-medium text-muted-foreground w-full">
                <button
                  className="p-1 hover:text-foreground"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <CaretLeft size={16} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center group">
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={selectedDate.getMonth()}
                      onChange={(e) => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(parseInt(e.target.value));
                        setSelectedDate(newDate);
                      }}
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "short",
                          })}
                        </option>
                      ))}
                    </select>
                    <span className="cursor-pointer group-hover:text-foreground">
                      {selectedDate.toLocaleString("default", {
                        month: "short",
                      })}{" "}
                      <CaretDown size={12} className="inline ml-1" />
                    </span>
                  </div>
                  <div className="relative flex items-center group">
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={selectedDate.getFullYear()}
                      onChange={(e) => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(parseInt(e.target.value));
                        setSelectedDate(newDate);
                      }}
                    >
                      {Array.from({ length: 10 }).map((_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="cursor-pointer group-hover:text-foreground">
                      {selectedDate.getFullYear()}{" "}
                      <CaretDown size={12} className="inline ml-1" />
                    </span>
                  </div>
                </div>
                <button
                  className="p-1 hover:text-foreground"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
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
