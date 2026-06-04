import { useSettingsStore } from "@/features/settings/store";
import { useTaskStore } from "@/features/tasks/store";
import { isTaskOverdue,isTaskUpcoming } from "@/shared/lib/time";
import { cn } from "@/shared/lib/utils";
import { Check } from "@phosphor-icons/react";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo } from "react";

// Priority → subtle transparent tinted styles
const PRIORITY_STYLE: Record<string, { card: string; badge: string; check: string }> = {
  urgent: {
    card: "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-400",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    check: "border-red-400 text-red-600 bg-background",
  },
  high: {
    card: "bg-orange-500/10 border-orange-500/25 text-orange-700 dark:text-orange-400",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    check: "border-orange-400 text-orange-600 bg-background",
  },
  medium: {
    card: "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    check: "border-amber-400 text-amber-600 bg-background",
  },
  low: {
    card: "bg-slate-500/8 border-slate-500/20 text-slate-700 dark:text-slate-400",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    check: "border-slate-400 text-slate-500 bg-background",
  },
  none: {
    card: "bg-muted/20 border-border/50 text-foreground/80",
    badge: "bg-muted text-muted-foreground border-border/60",
    check: "border-border text-purple-600 bg-background",
  },
};

const OVERDUE_STYLE = {
  card: "bg-red-600 border-red-700 text-white dark:bg-red-700 dark:border-red-800",
  badge: "bg-white/20 text-white border-white/30",
  check: "border-white/60 text-red-600 bg-white",
};

const getTaskStyle = (task: any) => {
  if (!task.completed && task.status !== "done" && isTaskOverdue(task.deadline)) {
    return OVERDUE_STYLE;
  }
  return PRIORITY_STYLE[task.priority ?? "none"] ?? PRIORITY_STYLE.none;
};

export const GlanceTasksSection = () => {
  const tasks = useTaskStore((s) => s.tasks) || [];
  const updateTask = useTaskStore((s) => s.updateTask);
  const timezone = useSettingsStore((s) => s.timezone);

  const todayStr = useMemo(
    () => formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"),
    [timezone]
  );

  const completedToday = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isDeleted || (!t.completed && t.status !== "done")) return false;
      if (!t.completedAt) return false;
      try {
        const date = new Date(t.completedAt);
        if (isNaN(date.getTime())) return false;
        const dateStrZoned = formatInTimeZone(date, timezone, "yyyy-MM-dd");
        return dateStrZoned === todayStr;
      } catch (e) {
        return false;
      }
    });
  }, [tasks, todayStr, timezone]);

  const incompleteTasks = useMemo(
    () => tasks.filter((t) => !t.isDeleted && !t.completed && t.status !== "done" && !isTaskUpcoming(t.startDate || t.createdAt)),
    [tasks]
  );

  const upcomingTasks = useMemo(
    () => tasks.filter((t) => !t.isDeleted && !t.completed && t.status !== "done" && isTaskUpcoming(t.startDate || t.createdAt)),
    [tasks]
  );

  const openTaskEditor = (taskId: string) => {
    window.dispatchEvent(new CustomEvent("task-editor-open", { detail: { taskId } }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Completed Today */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-5 border-b border-border/30">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Completed Today
          </h2>
          <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
            {completedToday.length}
          </span>
        </div>
        {completedToday.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/40 italic text-center">
            No tasks completed yet today.
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
            {completedToday.map((task) => {
              const s = getTaskStyle(task);
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskEditor(task.id)}
                  className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all group shrink-0", s.card)}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, { completed: false });
                    }}
                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer bg-emerald-500 border-emerald-500 text-white"
                  >
                    <Check size={10} weight="bold" />
                  </div>
                  <span className="text-xs font-medium line-through opacity-60 truncate flex-1 leading-tight">
                    {task.title || "Untitled Task"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incomplete Tasks */}
      <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden p-5", upcomingTasks.length > 0 && "border-b border-border/30")}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Incomplete
          </h2>
          <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
            {incompleteTasks.length}
          </span>
        </div>
        {incompleteTasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/40 italic text-center">
            All caught up! 🎉
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
            {incompleteTasks.map((task) => {
              const s = getTaskStyle(task);
              const overdue = !task.completed && task.status !== "done" && isTaskOverdue(task.deadline);
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskEditor(task.id)}
                  className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all group shrink-0", s.card)}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, { completed: true });
                    }}
                    className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer", s.check)}
                  >
                    <Check size={10} weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-semibold truncate flex-1 leading-tight">
                    {task.title || "Untitled Task"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {overdue && (
                      <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", s.badge)}>
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-5">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Upcoming
            </h2>
            <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground">
              {upcomingTasks.length}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
            {upcomingTasks.map((task) => {
              const s = getTaskStyle(task);
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskEditor(task.id)}
                  className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all group shrink-0 opacity-70", s.card)}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, { completed: true });
                    }}
                    className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer", s.check)}
                  >
                    <Check size={10} weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-medium truncate flex-1 leading-tight">
                    {task.title || "Untitled Task"}
                  </span>
                  {task.priority && (
                    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", s.badge)}>
                      {task.priority}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
