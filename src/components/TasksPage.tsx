import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { NotempleEditor } from "./editor/NotempleEditor";
import {
  isTaskDueToday,
  isTaskUpcoming,
  getCalendarDays,
  toUtcString,
  formatDisplayDate,
  isTaskCreatedToday,
} from "@/src/lib/time";

// Remove old mock time import comments

import { TaskEditorModal } from "./TaskEditorModal";
import { useVirtual } from "react-virtual";

const CustomDatePicker = ({
  value,
  onChange,
  placeholder,
  icon,
  small,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  small?: boolean;
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDayClick = (d: Date) => {
    onChange(toUtcString(d));
    setIsOpen(false);
  };

  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value ? formatDisplayDate(value) : "");
  }, [value, timezone, weekStartDay]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
                  {currentMonth.toLocaleDateString("en-US", { month: "long" })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1,
                        ),
                      )
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
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1,
                        ),
                      )
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
                  const isSelectedMonth =
                    d.getMonth() === currentMonth.getMonth();
                  const todayMatches =
                    formatDisplayDate(toUtcString(d), "yyyy-MM-dd") ===
                    formatDisplayDate(toUtcString(new Date()), "yyyy-MM-dd");
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
                      {d.getDate()}
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

export const TasksPage = ({ paneId }: { paneId: string }) => {
  const tasks = useTaskStore(state => state.tasks) || [];
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const parentRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<
    "Today" | "Upcoming" | "All Tasks"
  >("Today");
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);

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
    estimateSize: useCallback(() => 66, []), // 50px height + 16px gap spacing
    overscan: 5,
  });

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
    <div ref={parentRef} className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center p-8 bg-background">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 pt-8">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setIsTaskInputOpen(true)}
            className="w-10 h-10 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/80 dark:bg-purple-950/25 text-purple-600 dark:text-purple-300 flex items-center justify-center hover:bg-purple-100/80 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-200 transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <PlusCircle size={20} weight="fill" />
          </button>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-0 drop-shadow-sm font-sans">Tasks</h1>
        </div>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <TabButton
            icon={<Sun size={16} className="text-amber-500/80 dark:text-amber-400" />}
            label="Today"
            active={activeTab === "Today"}
            onClick={() => setActiveTab("Today")}
            colorScheme="amber"
          />
          <TabButton
            icon={<CalendarBlank size={16} className="text-sky-500/80 dark:text-sky-400" />}
            label="Upcoming"
            active={activeTab === "Upcoming"}
            onClick={() => setActiveTab("Upcoming")}
            colorScheme="sky"
          />
          <TabButton
            icon={<ClipboardText size={16} className="text-purple-500/80 dark:text-purple-400" />}
            label="All Tasks"
            active={activeTab === "All Tasks"}
            onClick={() => setActiveTab("All Tasks")}
            colorScheme="purple"
          />
        </div>

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
                      }}
                    >
                      <TaskRow
                        task={task}
                        updateTask={updateTask}
                        deleteTask={deleteTask}
                        onOpen={() => setActiveTask(task.id)}
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
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 shadow-sm text-[13px] font-bold px-5 py-2 rounded-xl transition-all"
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
      active: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/20 shadow-inner",
      indicator: "bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
    },
    sky: {
      active: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30 dark:border-sky-500/20 shadow-inner",
      indicator: "bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
    },
    purple: {
      active: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/20 shadow-inner",
      indicator: "bg-purple-500 dark:bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
    }
  }[colorScheme];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all shadow-sm outline-none relative hover:border-muted-foreground/30",
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
}: {
  task: Task;
  updateTask: any;
  deleteTask: (id: string) => void;
  onOpen: () => void;
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
      className="flex items-center justify-between group relative bg-muted border border-border p-3 rounded-xl hover:bg-muted/80 hover:border-muted-foreground/30 transition-colors duration-150 shadow-none"
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
            "text-base font-sans transition-all bg-transparent border-none outline-none focus:ring-1 focus:ring-border px-2 flex-1",
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
          />

          <CustomDatePicker
            small
            value={task.deadline || ""}
            onChange={(v: string) => updateTask(task.id, { deadline: v })}
            placeholder="Deadline"
            icon={<Flag size={12} />}
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
