import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTaskStore, type Task } from "@/src/store/taskStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { cn } from "@/src/lib/utils";
import {
  PlusCircle,
  Tray,
  Sun,
  CalendarBlank,
  ClipboardText,
  CaretDown,
  CaretRight,
  X,
  Flag,
  MagnifyingGlass,
  CaretLeft,
  Target,
  ArrowCircleRight,
  Trash,
  CircleDashed,
  Clock,
  CheckCircle,
  List,
  Kanban,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { DndContext, useDroppable, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { NotempleEditor } from "./editor/NotempleEditor";
import {
  isTaskDueToday,
  isTaskUpcoming,
  getCalendarDays,
  toUtcString,
  formatDisplayDate,
  isTaskCreatedToday,
  changeZonedMonth,
  isSameMonthInTimezone,
  isSameDayInTimezone,
  getZonedDate,
} from "@/src/lib/time";

// Remove old mock time import comments

import { TaskEditorModal } from "./TaskEditorModal";
import { useVirtual } from "react-virtual";

export const CustomDatePicker = ({
  value,
  onChange,
  placeholder,
  icon,
  small,
  onOpenChange,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  small?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { timezone, weekStartDay } = useSettingsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDayNames = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    return [...days.slice(weekStartDay), ...days.slice(0, weekStartDay)];
  };

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth);
  }, [currentMonth, weekStartDay]);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onOpenChangeRef.current?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleDayClick = (d: Date) => {
    onChange(toUtcString(d));
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const toggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value ? formatDisplayDate(value) : "");
  }, [value, timezone, weekStartDay]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className={cn(
          small
            ? "flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border hover:bg-muted/80"
            : "flex items-center gap-1.5 text-sm font-medium hover:bg-muted px-2 py-1 rounded transition-colors",
          !small && value
            ? "text-foreground"
            : !small
              ? "text-muted-foreground"
              : "",
        )}
      >
        {icon} {displayValue || (small ? "..." : placeholder)}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4 origin-top-left"
          >
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-2 py-1.5 focus-within:border-accent transition-colors">
              <MagnifyingGlass size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Date"
                className="bg-transparent border-none outline-none text-sm w-full text-foreground"
              />
            </div>

            <button
              className="flex items-center gap-2 text-sm font-bold text-foreground hover:bg-muted px-2 py-1.5 rounded-lg transition-colors"
              onClick={() => {
                onChange(toUtcString(new Date()));
                setIsOpen(false);
              }}
            >
              <CalendarBlank size={16} /> Today
            </button>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-sm">
                  {formatDisplayDate(currentMonth.toISOString(), "MMMM")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentMonth(changeZonedMonth(currentMonth, -1, timezone))
                    }
                    className="p-1 hover:bg-muted rounded"
                  >
                    <CaretLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Target size={14} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(changeZonedMonth(currentMonth, 1, timezone))
                    }
                    className="p-1 hover:bg-muted rounded"
                  >
                    <CaretRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
                {getDayNames().map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-sm font-medium">
                {calendarDays.map((d, i) => {
                  const isSelectedMonth = isSameMonthInTimezone(d, currentMonth, timezone);
                  const todayMatches = isSameDayInTimezone(d, new Date(), timezone);
                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(d)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors mx-auto",
                        !isSelectedMonth
                          ? "text-muted-foreground/30"
                          : "text-foreground",
                        todayMatches
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "",
                      )}
                    >
                      {getZonedDate(d, timezone)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="text-sm font-bold text-left px-1 hover:text-foreground transition-colors"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
            >
              Clear Date
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const STATUS_OPTIONS = [
  {
    value: "open",
    label: "Open",
    color: "bg-sky-100/80 hover:bg-sky-200 text-sky-800 hover:text-sky-900 border-sky-200 hover:border-sky-300 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 dark:hover:text-sky-200 dark:border-sky-500/20 dark:hover:border-sky-500/30",
    icon: CircleDashed,
  },
  {
    value: "in progress",
    label: "In Progress",
    color: "bg-amber-100/80 hover:bg-amber-200 text-amber-800 hover:text-amber-900 border-amber-200 hover:border-amber-300 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-200 dark:border-amber-500/20 dark:hover:border-amber-500/30",
    icon: Clock,
  },
  {
    value: "done",
    label: "Done",
    color: "bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 dark:hover:text-emerald-200 dark:border-emerald-500/20 dark:hover:border-emerald-500/30",
    icon: CheckCircle,
  },
] as const;

const CustomStatusPicker = ({
  status,
  onChange,
  onOpenChange,
}: {
  status: "open" | "in progress" | "done";
  onChange: (val: "open" | "in progress" | "done") => void;
  onOpenChange?: (isOpen: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onOpenChangeRef.current?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const currentOption = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  const Icon = currentOption.icon;

  return (
    <div className="relative font-sans animate-none" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border transition-all duration-150 hover:opacity-90 shadow-sm cursor-pointer",
          currentOption.color,
        )}
      >
        <Icon size={12} weight="bold" /> {currentOption.label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full right-0 mt-1.5 w-32 bg-background border border-border rounded-xl shadow-2xl p-1 z-[60] flex flex-col gap-0.5 origin-top-right font-sans"
          >
            {STATUS_OPTIONS.map((option) => {
              const OptIcon = option.icon;
              const isSelected = option.value === status;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 w-full text-xs font-semibold px-3 py-2 rounded-lg text-left transition-colors cursor-pointer",
                    isSelected
                      ? option.color
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                    onOpenChange?.(false);
                  }}
                >
                  <OptIcon size={14} weight={isSelected ? "bold" : "regular"} />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TasksPage = ({ paneId }: { paneId: string }) => {
  const tasks = useTaskStore(state => state.tasks) || [];
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const parentRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<
    "Today" | "Upcoming" | "All Tasks"
  >("Today");
  const [viewMode, setViewMode] = useState<"list" | "kanban">(() => {
    const saved = localStorage.getItem("tasks-view-mode");
    return (saved === "list" || saved === "kanban") ? saved : "list";
  });

  useEffect(() => {
    localStorage.setItem("tasks-view-mode", viewMode);
  }, [viewMode]);
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [openDatePickerTaskId, setOpenDatePickerTaskId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskList, setNewTaskList] = useState<
    "Today" | "Upcoming" | "All Tasks"
  >("Today");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskStartDate, setNewTaskStartDate] = useState(
    new Date().toISOString(),
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (activeTab === "All Tasks") return true;
      const creationUtc = t.startDate || t.createdAt;
      if (activeTab === "Today") return isTaskCreatedToday(creationUtc);
      if (activeTab === "Upcoming") return isTaskUpcoming(creationUtc);
      return true;
    });
  }, [tasks, activeTab]);

  const rowVirtualizer = useVirtual({
    size: filteredTasks.length,
    parentRef,
    estimateSize: useCallback(() => 50, []), // 38px height + 12px gap spacing
    overscan: 5,
  });

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as "open" | "in progress" | "done";

    updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const openTasks = useMemo(() => filteredTasks.filter(t => (t.status === "open" || (!t.status && !t.completed))), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === "in progress"), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter(t => t.status === "done" || t.completed), [filteredTasks]);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle,
      list: newTaskList,
      completed: false,
      startDate: newTaskStartDate,
      deadline: newTaskDeadline,
    });
    setNewTaskTitle("");
    setIsTaskInputOpen(false);
  };

  return (
    <div ref={parentRef} className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-workspace">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 pt-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setIsTaskInputOpen(true)}
            className="w-10 h-10 rounded-xl border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PlusCircle size={20} weight="fill" />
          </button>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-0 drop-shadow-sm font-sans">Tasks</h1>
        </div>

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TabButton
              icon={<Sun size={16} className={activeTab === "Today" ? "text-foreground dark:text-blush-pop" : "text-muted-foreground"} />}
              label="Today"
              active={activeTab === "Today"}
              onClick={() => setActiveTab("Today")}
              colorScheme="amber"
            />
            <TabButton
              icon={<CalendarBlank size={16} className={activeTab === "Upcoming" ? "text-foreground dark:text-sky-blue" : "text-muted-foreground"} />}
              label="Upcoming"
              active={activeTab === "Upcoming"}
              onClick={() => setActiveTab("Upcoming")}
              colorScheme="sky"
            />
            <TabButton
              icon={<ClipboardText size={16} className={activeTab === "All Tasks" ? "text-foreground dark:text-pink-orchid" : "text-muted-foreground"} />}
              label="All Tasks"
              active={activeTab === "All Tasks"}
              onClick={() => setActiveTab("All Tasks")}
              colorScheme="purple"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/85 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm border border-border/40 font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <List size={14} weight={viewMode === "list" ? "bold" : "regular"} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-sm border border-border/40 font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Kanban size={14} weight={viewMode === "kanban" ? "bold" : "regular"} />
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-col relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent w-full">
            <div className="flex flex-col pl-8 w-full">
              <div
                style={{
                  height: `${rowVirtualizer.totalSize}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <AnimatePresence>
                  {rowVirtualizer.virtualItems.map((virtualRow) => {
                    const task = filteredTasks[virtualRow.index];
                    if (!task) return null;
                    return (
                      <div
                        key={task.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          zIndex: openDatePickerTaskId === task.id ? 50 : undefined,
                        }}
                      >
                        <TaskRow
                          task={task}
                          updateTask={updateTask}
                          deleteTask={deleteTask}
                          onOpen={() => setActiveTask(task.id)}
                          onDatePickerOpenChange={(isOpen) => setOpenDatePickerTaskId(isOpen ? task.id : null)}
                        />
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-muted-foreground text-sm italic py-4">
                  No tasks in this list.
                </div>
              )}
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2 items-start">
              <KanbanColumn
                status="open"
                title="Open"
                tasks={openTasks}
                icon={CircleDashed}
                colorClass="text-sky-800 dark:text-sky-300"
                badgeClass="bg-sky-100/50 text-sky-800 border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20"
                updateTask={updateTask}
                deleteTask={deleteTask}
                onOpenTask={setActiveTask}
                onDatePickerOpenChange={(isOpen, id) => setOpenDatePickerTaskId(isOpen ? id : null)}
                openDatePickerTaskId={openDatePickerTaskId}
              />
              <KanbanColumn
                status="in progress"
                title="In Progress"
                tasks={inProgressTasks}
                icon={Clock}
                colorClass="text-amber-800 dark:text-amber-300"
                badgeClass="bg-amber-100/50 text-amber-800 border-amber-300/30 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                updateTask={updateTask}
                deleteTask={deleteTask}
                onOpenTask={setActiveTask}
                onDatePickerOpenChange={(isOpen, id) => setOpenDatePickerTaskId(isOpen ? id : null)}
                openDatePickerTaskId={openDatePickerTaskId}
              />
              <KanbanColumn
                status="done"
                title="Done"
                tasks={doneTasks}
                icon={CheckCircle}
                colorClass="text-emerald-800 dark:text-emerald-300"
                badgeClass="bg-emerald-100/50 text-emerald-800 border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                updateTask={updateTask}
                deleteTask={deleteTask}
                onOpenTask={setActiveTask}
                onDatePickerOpenChange={(isOpen, id) => setOpenDatePickerTaskId(isOpen ? id : null)}
                openDatePickerTaskId={openDatePickerTaskId}
              />
            </div>
            <DragOverlay>
              {activeDragId ? (
                <KanbanCard
                  task={tasks.find(t => t.id === activeDragId)!}
                  updateTask={updateTask}
                  deleteTask={deleteTask}
                  onOpen={() => setActiveTask(activeDragId)}
                  onDatePickerOpenChange={() => {}}
                  isDatePickerOpen={false}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <AnimatePresence>
        {isTaskInputOpen && (
          <>
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsTaskInputOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest font-mono text-muted-foreground/50">Create Task</div>
                <button
                  className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => setIsTaskInputOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <input
                autoFocus
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                }}
                className="w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 border-none outline-none pl-1 tracking-tight"
              />

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <CustomDatePicker
                    value={newTaskStartDate}
                    onChange={setNewTaskStartDate}
                    placeholder="Start Date"
                    icon={<CalendarBlank size={16} />}
                  />
                  <CustomDatePicker
                    value={newTaskDeadline}
                    onChange={setNewTaskDeadline}
                    placeholder="Deadline"
                    icon={<Flag size={16} />}
                  />
                </div>
                <button
                  onClick={handleCreateTask}
                  className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 border border-purple-600 dark:border-purple-500/20 shadow-sm text-[13px] font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <TaskEditorModal
        taskId={activeTask}
        onClose={() => setActiveTask(null)}
      />
    </div>
  );
};

const TabButton = ({
  icon,
  label,
  active,
  onClick,
  colorScheme,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  colorScheme: "amber" | "sky" | "purple";
}) => {
  const schemeClasses = {
    amber: {
      active: "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 shadow-sm border font-semibold hover:bg-blush-pop/80 dark:hover:bg-blush-pop/35",
      indicator: "bg-blush-pop dark:bg-blush-pop shadow-[0_0_8px_rgba(255,175,204,0.5)]"
    },
    sky: {
      active: "bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue/50 dark:border-sky-blue/30 shadow-sm border font-semibold hover:bg-sky-blue/80 dark:hover:bg-sky-blue/35",
      indicator: "bg-sky-blue dark:bg-sky-blue shadow-[0_0_8px_rgba(162,210,255,0.5)]"
    },
    purple: {
      active: "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 shadow-sm border font-semibold hover:bg-pink-orchid/80 dark:hover:bg-pink-orchid/35",
      indicator: "bg-pink-orchid dark:bg-pink-orchid shadow-[0_0_8px_rgba(205,180,219,0.5)]"
    }
  }[colorScheme];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-250 ease-out shadow-sm outline-none relative hover:border-muted-foreground/30 cursor-pointer",
        active
          ? schemeClasses.active
          : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {active && (
        <motion.div
          layoutId="task-tab-indicator"
          className={cn("absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full", schemeClasses.indicator)}
        />
      )}
      {icon} {label}
    </button>
  );
};

const TaskRow = React.memo(({
  task,
  updateTask,
  deleteTask,
  onOpen,
  onDatePickerOpenChange,
}: {
  task: Task;
  updateTask: any;
  deleteTask: (id: string) => void;
  onOpen: () => void;
  onDatePickerOpenChange?: (isOpen: boolean) => void;
}) => {
  const [localTitle, setLocalTitle] = useState(task.title);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleBlur = () => {
    if (localTitle !== task.title) {
      updateTask(task.id, { title: localTitle });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between group relative bg-[var(--task-row-bg)] dark:bg-muted border border-[var(--task-row-border)] dark:border-border py-1.5 px-3 rounded-lg hover:bg-[var(--task-row-hover-bg)] dark:hover:bg-muted/80 hover:border-muted-foreground/30 transition-colors duration-150 shadow-none"
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-border group-hover:bg-muted-foreground group-hover:w-6 transition-all" />

      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            "w-5 h-5 rounded-md border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent",
          )}
          onClick={() => updateTask(task.id, { completed: !task.completed })}
        >
          {task.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 rounded-sm h-2 bg-emerald-500 dark:bg-emerald-400" />}
        </div>

        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "text-base font-sans transition-all bg-transparent border border-transparent hover:border-border/80 focus:border-border/80 focus:ring-1 focus:ring-border rounded-sm outline-none px-2 flex-1",
            task.completed
              ? "line-through text-muted-foreground/50"
              : "text-foreground font-medium",
          )}
        />

        <div className="flex items-center gap-2">
          <CustomDatePicker
            small
            value={task.startDate || ""}
            onChange={(v: string) => updateTask(task.id, { startDate: v })}
            placeholder="Start"
            icon={<CalendarBlank size={12} />}
            onOpenChange={onDatePickerOpenChange}
          />

          <CustomDatePicker
            small
            value={task.deadline || ""}
            onChange={(v: string) => updateTask(task.id, { deadline: v })}
            placeholder="Deadline"
            icon={<Flag size={12} />}
            onOpenChange={onDatePickerOpenChange}
          />

          <CustomStatusPicker
            status={task.status || (task.completed ? "done" : "open")}
            onChange={(s: "open" | "in progress" | "done") => updateTask(task.id, { status: s })}
            onOpenChange={onDatePickerOpenChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 flex-shrink-0 group-hover:opacity-100 transition-opacity ml-4 pl-4 border-l border-border">
        <button
          onClick={() => deleteTask(task.id)}
          className="text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center justify-center w-8 h-8 hover:bg-red-500/10"
        >
          <Trash size={16} />
        </button>
        <button
          onClick={onOpen}
          className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 hover:bg-muted"
        >
          <ArrowCircleRight size={16} />
        </button>
      </div>
    </motion.div>
  );
});

const KanbanColumn = ({
  status,
  title,
  tasks,
  icon: Icon,
  colorClass,
  badgeClass,
  updateTask,
  deleteTask,
  onOpenTask,
  onDatePickerOpenChange,
  openDatePickerTaskId,
}: {
  status: "open" | "in progress" | "done";
  title: string;
  tasks: Task[];
  icon: any;
  colorClass: string;
  badgeClass: string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onOpenTask: (id: string) => void;
  onDatePickerOpenChange: (isOpen: boolean, id: string) => void;
  openDatePickerTaskId: string | null;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] bg-card/45 dark:bg-muted/15 border border-border/80 rounded-xl p-4 transition-all duration-150 relative min-h-[500px] select-none",
        isOver && "bg-muted/20 border-purple-500/30 scale-[1.01] shadow-md"
      )}
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className={colorClass}>
            <Icon size={16} weight="bold" />
          </span>
          <span className="font-sans font-bold text-sm text-foreground">{title}</span>
        </div>
        <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border", badgeClass)}>
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-280px)] pr-0.5">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onOpen={() => onOpenTask(task.id)}
            onDatePickerOpenChange={(isOpen) => onDatePickerOpenChange(isOpen, task.id)}
            isDatePickerOpen={openDatePickerTaskId === task.id}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-lg p-6 min-h-[120px] transition-colors duration-150">
            <span className="text-xs text-muted-foreground/60 italic font-medium font-sans">
              Drop tasks here
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanCard = ({
  task,
  updateTask,
  deleteTask,
  onOpen,
  onDatePickerOpenChange,
  isDatePickerOpen,
  isOverlay = false,
}: {
  task: Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onOpen: () => void;
  onDatePickerOpenChange: (isOpen: boolean) => void;
  isDatePickerOpen: boolean;
  isOverlay?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = transform && !isOverlay
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.3 : undefined,
      }
    : undefined;

  const [localTitle, setLocalTitle] = useState(task.title);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleBlur = () => {
    if (localTitle !== task.title) {
      updateTask(task.id, { title: localTitle });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        zIndex: isDatePickerOpen ? 150 : style?.zIndex,
      }}
      className={cn(
        "bg-card border border-card-border shadow-sm rounded-xl p-3 flex flex-col gap-3 transition-all relative group/card font-sans",
        isOverlay && "shadow-none border-purple-500/30 bg-card rotate-[2deg] scale-[1.02] cursor-grabbing",
        !isOverlay && isDragging && "shadow-none ring-2 ring-purple-500/20 border-purple-500/30 cursor-grabbing opacity-30",
        !isOverlay && !isDragging && "hover:shadow-md hover:border-muted-foreground/20 cursor-grab"
      )}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Clickable Status Checkbox */}
        <div
          className={cn(
            "w-4 h-4 mt-0.5 rounded border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent",
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            updateTask(task.id, { completed: !task.completed });
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-1.5 rounded-sm h-1.5 bg-emerald-500 dark:bg-emerald-400"
            />
          )}
        </div>

        {/* Editable Title Input */}
        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "text-xs font-sans font-semibold transition-all bg-transparent border border-transparent hover:border-border/80 focus:border-border/80 focus:ring-1 focus:ring-border rounded-sm outline-none px-1 flex-1 min-w-0 py-0",
            task.completed
              ? "line-through text-muted-foreground/50"
              : "text-foreground font-medium",
          )}
        />
        
        {/* Drag Handle & Drag Indicators */}
        <div className="text-muted-foreground/30 group-hover/card:text-muted-foreground/60 transition-colors flex items-center shrink-0">
          <DotsSixVertical size={14} weight="bold" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 w-full pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
          <CustomDatePicker
            small
            value={task.startDate || ""}
            onChange={(v: string) => updateTask(task.id, { startDate: v })}
            placeholder="Start"
            icon={<CalendarBlank size={10} />}
            onOpenChange={onDatePickerOpenChange}
          />

          <CustomDatePicker
            small
            value={task.deadline || ""}
            onChange={(v: string) => updateTask(task.id, { deadline: v })}
            placeholder="Deadline"
            icon={<Flag size={10} />}
            onOpenChange={onDatePickerOpenChange}
          />
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0 pl-1" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center justify-center w-6 h-6 hover:bg-red-500/10 rounded-md cursor-pointer"
          >
            <Trash size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 hover:bg-muted rounded-md cursor-pointer"
          >
            <ArrowCircleRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

