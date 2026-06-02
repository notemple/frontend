import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useTaskStore } from "@/features/tasks/store";
import { useTaskTimerStore } from "@/shared/store/taskTimerStore";
import { useFocusTimerStore } from "@/shared/store/focusTimerStore";
import { useSettingsStore } from "@/features/settings/store";
import { cn } from "@/shared/lib/utils";
import { formatInTimeZone } from "date-fns-tz";

const formatSeconds = (total: number) => {
  if (total === 0) return "0s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const FocusTimeline = () => {
  const tasks = useTaskStore((s) => s.tasks) || [];
  const timers = useTaskTimerStore((s) => s.timers) || {};
  const timezone = useSettingsStore((s) => s.timezone);

  const {
    stopwatchSeconds,
    pomodoroSecondsToday,
    timerSecondsToday,
    isRunning: isFocusTimerRunning,
    mode: focusTimerMode,
  } = useFocusTimerStore();

  const focusTimerSeconds = stopwatchSeconds + (pomodoroSecondsToday || 0) + (timerSecondsToday || 0);

  const todayStr = useMemo(
    () => formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"),
    [timezone]
  );

  const timedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.isDeleted) return false;
        const timer = timers[t.id];
        return timer && timer.lastWorkedDate === todayStr && (timer.secondsToday || 0) >= 300;
      })
      .sort((a, b) => (timers[b.id]?.secondsToday ?? 0) - (timers[a.id]?.secondsToday ?? 0));
  }, [tasks, timers, todayStr]);

  const getFocusTimerGradient = () => {
    switch (focusTimerMode) {
      case "stopwatch":
        return "bg-gradient-to-r from-sky-500 to-sky-400";
      case "timer":
        return "bg-gradient-to-r from-blue-500 to-blue-400";
      case "pomodoro":
        return "bg-gradient-to-r from-rose-500 to-rose-400";
      default:
        return "bg-gradient-to-r from-purple-500 to-purple-400";
    }
  };

  const openTaskEditor = (taskId: string) => {
    window.dispatchEvent(new CustomEvent("task-editor-open", { detail: { taskId } }));
  };

  return (
    <div className="h-[280px] flex-shrink-0 flex flex-col overflow-hidden p-5">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Focus Time Today
        </h2>
        <span className="text-[10px] font-semibold text-muted-foreground/50 bg-muted/40 border border-border/40 px-2 py-0.5 rounded">
          24h scale
        </span>
      </div>

      {timedTasks.length === 0 && focusTimerSeconds < 300 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 italic text-center px-4">
          Start a timer on a task or focus timer to see focus time here (shows after 5 mins of focus).
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col min-w-0">
          {/* Scrollable bars */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2 pr-1 pb-1">
            {/* Focus Timer Bar */}
            {focusTimerSeconds >= 300 && (
              <div className="relative h-9 rounded-sm overflow-hidden border border-border/40 bg-muted/20 group shrink-0">
                {/* 24h tick lines */}
                {[4, 8, 12, 16, 20].map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 w-px bg-border/25 pointer-events-none"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}
                {/* Fill bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((focusTimerSeconds / 86400) * 100, 100)}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={cn("absolute inset-y-0 left-0", getFocusTimerGradient())}
                />
                {/* Label */}
                <div className="absolute inset-0 flex items-center px-3 gap-2 z-10">
                  {isFocusTimerRunning && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-400" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[11px] font-semibold truncate flex-1 leading-none",
                      (focusTimerSeconds / 86400) * 100 > 30 ? "text-white drop-shadow-sm" : "text-foreground/80"
                    )}
                  >
                    Focus Timer ({focusTimerMode === "stopwatch" ? "Stopwatch" : focusTimerMode === "pomodoro" ? "Pomodoro" : "Timer"})
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold shrink-0",
                      (focusTimerSeconds / 86400) * 100 > 30 ? "text-white/80" : "text-muted-foreground/70"
                    )}
                  >
                    {formatSeconds(focusTimerSeconds)}
                  </span>
                </div>
              </div>
            )}
            {timedTasks.map((task) => {
              const secs = timers[task.id]?.secondsToday ?? 0;
              const pct = Math.min((secs / 86400) * 100, 100);
              const running = timers[task.id]?.isRunning;
              return (
                <div
                  key={task.id}
                  onClick={() => openTaskEditor(task.id)}
                  className="relative h-9 rounded-sm overflow-hidden border border-border/40 bg-muted/20 cursor-pointer group shrink-0"
                >
                  {/* 24h tick lines */}
                  {[4, 8, 12, 16, 20].map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 w-px bg-border/25 pointer-events-none"
                      style={{ left: `${(h / 24) * 100}%` }}
                    />
                  ))}
                  {/* Fill bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={cn(
                      "absolute inset-y-0 left-0",
                      running
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : task.completed
                        ? "bg-gradient-to-r from-purple-500/50 to-purple-400/40"
                        : "bg-gradient-to-r from-purple-600 to-purple-500"
                    )}
                  />
                  {/* Label */}
                  <div className="absolute inset-0 flex items-center px-3 gap-2 z-10">
                    {running && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[11px] font-semibold truncate flex-1 leading-none",
                        pct > 30 ? "text-white drop-shadow-sm" : "text-foreground/80"
                      )}
                    >
                      {task.title || "Untitled Task"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold shrink-0",
                        pct > 30 ? "text-white/80" : "text-muted-foreground/70"
                      )}
                    >
                      {formatSeconds(secs)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour ruler */}
          <div className="relative h-4 shrink-0 mt-1 pr-1">
            {[0, 4, 8, 12, 16, 20, 24].map((h) => (
              <span
                key={h}
                className="absolute text-[8px] font-bold text-muted-foreground/40 -translate-x-1/2"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {h}h
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
