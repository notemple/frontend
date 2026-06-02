import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTaskStore, type Task } from "@/features/tasks/store";
import { useSettingsStore } from "@/features/settings/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/shared/lib/utils";
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
  ArrowsDownUp,
} from "@phosphor-icons/react";
import { DndContext, useDroppable, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";
import { NotempleEditor } from "@/features/editor/NotempleEditor";
import {
  isTaskDueToday,
  isTaskUpcoming,
  isTaskOverdue,
  getCalendarDays,
  toUtcString,
  formatDisplayDate,
  isTaskCreatedToday,
  changeZonedMonth,
  isSameMonthInTimezone,
  isSameDayInTimezone,
  getZonedDate,
} from "@/shared/lib/time";

// Remove old mock time import comments

import { TaskEditorModal } from "./components/TaskEditorModal";
import { CustomDatePicker } from "./components/CustomDatePicker";
import { TaskRow } from "./components/TaskRow";
import { KanbanCard } from "./components/KanbanCard";
import { KanbanColumn } from "./components/KanbanColumn";

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

export const CustomStatusPicker = ({
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
          "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-sm border transition-all duration-150 hover:opacity-90 shadow-sm-sm cursor-pointer",
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
            className="absolute top-full right-0 mt-1.5 w-32 bg-background border border-border rounded-sm-sm shadow-sm-sm p-1 z-[60] flex flex-col gap-0.5 origin-top-right font-sans"
          >
            {STATUS_OPTIONS.map((option) => {
              const OptIcon = option.icon;
              const isSelected = option.value === status;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 w-full text-xs font-semibold px-3 py-2 rounded-sm-sm text-left transition-colors cursor-pointer",
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
  const tasks = useTaskStore(useShallow(state => state.tasks.filter(t => !t.isDeleted))) || [];
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const parentRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<
    "Today" | "Upcoming" | "All Tasks" | "Overdue"
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
  const [sortBy, setSortBy] = useState<"priority" | "month" | "week" | null>(null);

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
      if (activeTab === "Overdue") {
        return !t.completed && t.status !== "done" && isTaskOverdue(t.deadline);
      }
      const creationUtc = t.startDate || t.createdAt;
      if (activeTab === "Today") return isTaskCreatedToday(creationUtc);
      if (activeTab === "Upcoming") return isTaskUpcoming(creationUtc);
      return true;
    });
  }, [tasks, activeTab]);

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (!sortBy) return list;

    if (sortBy === "priority") {
      const priorityWeight = { urgent: 3, medium: 2, low: 1, undefined: 0 };
      return list.sort((a, b) => {
        const wA = priorityWeight[a.priority || "undefined"];
        const wB = priorityWeight[b.priority || "undefined"];
        return wB - wA; // Higher priority first
      });
    }

    if (sortBy === "month") {
      return list.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        const monthA = dateA.getFullYear() * 12 + dateA.getMonth();
        const monthB = dateB.getFullYear() * 12 + dateB.getMonth();
        return monthA - monthB;
      });
    }

    if (sortBy === "week") {
      return list.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        const getStartOfWeek = (d: Date) => {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(d);
          start.setDate(diff);
          start.setHours(0,0,0,0);
          return start.getTime();
        };
        return getStartOfWeek(dateA) - getStartOfWeek(dateB);
      });
    }

    return list;
  }, [filteredTasks, sortBy]);

  const groupedTasksByMonth = useMemo(() => {
    if (viewMode !== "list") {
      return null;
    }

    let getDateStr: (t: Task) => string;
    if (activeTab === "All Tasks") {
      getDateStr = (t) => t.createdAt;
    } else if (activeTab === "Upcoming") {
      getDateStr = (t) => t.startDate || t.createdAt;
    } else if (activeTab === "Overdue") {
      getDateStr = (t) => t.deadline || t.createdAt;
    } else {
      return null;
    }

    const groups: { [key: string]: Task[] } = {};
    
    sortedTasks.forEach((task) => {
      const dateStr = getDateStr(task);
      const yearMonthKey = formatDisplayDate(dateStr, "yyyy-MM");
      if (!groups[yearMonthKey]) {
        groups[yearMonthKey] = [];
      }
      groups[yearMonthKey].push(task);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map((key) => {
      const firstTask = groups[key][0];
      const dateStr = getDateStr(firstTask);
      const displayLabel = formatDisplayDate(dateStr, "MMMM yyyy");
      return {
        key,
        label: displayLabel,
        tasks: groups[key],
      };
    });
  }, [sortedTasks, activeTab, viewMode]);




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

  const openTasks = useMemo(() => sortedTasks.filter(t => (t.status === "open" || (!t.status && !t.completed))), [sortedTasks]);
  const inProgressTasks = useMemo(() => sortedTasks.filter(t => t.status === "in progress"), [sortedTasks]);
  const doneTasks = useMemo(() => sortedTasks.filter(t => t.status === "done" || t.completed), [sortedTasks]);

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
    <div ref={parentRef} className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-transparent">
      <div
        className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 pt-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setIsTaskInputOpen(true)}
            className="w-10 h-10 rounded-sm-sm border border-purple-600 dark:border-purple-900/40 bg-purple-600 dark:bg-purple-950/25 text-white dark:text-purple-400 flex items-center justify-center hover:bg-purple-700 dark:hover:bg-purple-950/40 hover:border-purple-700 dark:hover:text-purple-300 transition-all shadow-sm-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PlusCircle size={20} weight="fill" />
          </button>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-0 drop-shadow-sm-sm font-sans">Tasks</h1>
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
            <TabButton
              icon={<Clock size={16} className={activeTab === "Overdue" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"} />}
              label="Overdue"
              active={activeTab === "Overdue"}
              onClick={() => setActiveTab("Overdue")}
              colorScheme="rose"
            />
          </div>

          <div className="flex items-center gap-3">
            <SortDropdown sortBy={sortBy} onChange={setSortBy} />
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-sm-sm border border-border/85 shadow-sm-sm">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-sm-sm text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm-sm border border-border/40 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <List size={14} weight={viewMode === "list" ? "bold" : "regular"} />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-sm-sm text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
                  viewMode === "kanban"
                    ? "bg-background text-foreground shadow-sm-sm border border-border/40 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Kanban size={14} weight={viewMode === "kanban" ? "bold" : "regular"} />
                <span>Kanban</span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-col relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent w-full">
            <div className="flex flex-col pl-8 w-full gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {groupedTasksByMonth ? (
                  groupedTasksByMonth.map((group, index) => (
                    <div key={group.key} className="flex flex-col gap-3">
                      <div className={cn("text-xs font-bold tracking-widest text-muted-foreground/60 uppercase font-mono flex items-center gap-2 select-none", index === 0 ? "mt-1 mb-2" : "mt-6 mb-2")}>
                        <CalendarBlank size={12} className="text-purple-500/80 dark:text-purple-400" />
                        <span>{group.label}</span>
                      </div>
                      {group.tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 38
                          }}
                          style={{
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
                        </motion.div>
                      ))}
                    </div>
                  ))
                ) : (
                  sortedTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 38
                      }}
                      style={{
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
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              {sortedTasks.length === 0 && (
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
               className="fixed inset-0 bg-transparent z-40"
              onClick={() => setIsTaskInputOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-background border border-border rounded-sm-sm p-6 shadow-sm-sm z-50 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest font-mono text-muted-foreground/50">Create Task</div>
                <button
                  className="p-1 rounded-sm-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
                  className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 border border-purple-600 dark:border-purple-500/20 shadow-sm-sm text-[13px] font-bold px-5 py-2 rounded-sm-sm transition-all cursor-pointer"
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
  colorScheme: "amber" | "sky" | "purple" | "rose";
}) => {
  const schemeClasses = {
    amber: {
      active: "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 shadow-sm-sm border font-semibold hover:bg-blush-pop/80 dark:hover:bg-blush-pop/35",
      indicator: "bg-blush-pop dark:bg-blush-pop shadow-sm-sm"
    },
    sky: {
      active: "bg-sky-blue/70 dark:bg-sky-blue/20 text-foreground dark:text-sky-blue border-sky-blue/50 dark:border-sky-blue/30 shadow-sm-sm border font-semibold hover:bg-sky-blue/80 dark:hover:bg-sky-blue/35",
      indicator: "bg-sky-blue dark:bg-sky-blue shadow-sm-sm"
    },
    purple: {
      active: "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 shadow-sm-sm border font-semibold hover:bg-pink-orchid/80 dark:hover:bg-pink-orchid/35",
      indicator: "bg-pink-orchid dark:bg-pink-orchid shadow-sm-sm"
    },
    rose: {
      active: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/20 shadow-sm-sm border font-semibold hover:bg-rose-500/15 dark:hover:bg-rose-500/30",
      indicator: "bg-rose-500 dark:bg-rose-400 shadow-sm-sm"
    }
  }[colorScheme];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-sm-sm border text-sm font-medium transition-all duration-250 ease-out shadow-sm-sm outline-none relative hover:border-muted-foreground/30 cursor-pointer",
        active
          ? schemeClasses.active
          : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {active && (
        <div
          className={cn("absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm-full", schemeClasses.indicator)}
        />
      )}
      {icon} {label}
    </button>
  );
};

export const SortDropdown = ({
  sortBy,
  onChange,
}: {
  sortBy: "priority" | "month" | "week" | null;
  onChange: (val: "priority" | "month" | "week" | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const options = [
    { value: null, label: "Default" },
    { value: "priority", label: "Priority" },
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
  ] as const;

  const currentLabel = options.find((o) => o.value === sortBy)?.label || "Sort";

  return (
    <div className="relative font-sans" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 text-xs font-semibold rounded-sm-sm border border-border/85 shadow-sm-sm hover:text-foreground hover:bg-muted/95 transition-all duration-200 cursor-pointer select-none"
      >
        <ArrowsDownUp size={14} weight={sortBy ? "bold" : "regular"} className={sortBy ? "text-purple-500" : "text-muted-foreground"} />
        <span>{sortBy ? `Sorted by: ${currentLabel}` : "Sort"}</span>
        <CaretDown size={10} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full right-0 mt-1.5 w-40 bg-background border border-border rounded-sm-sm shadow-sm-sm p-1 z-[60] flex flex-col gap-0.5 origin-top-right"
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/50 px-2.5 py-1 font-mono border-b border-border mb-0.5">
              Sort Tasks By
            </div>
            {options.map((option) => {
              const isSelected = option.value === sortBy;
              return (
                <button
                  type="button"
                  key={option.value || "default"}
                  className={cn(
                    "flex items-center justify-between w-full text-xs font-semibold px-3 py-2 rounded-sm-sm text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-sm-full bg-purple-500 dark:bg-purple-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
