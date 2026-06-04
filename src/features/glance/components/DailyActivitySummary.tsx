import { useDocumentStore } from "@/features/documents/store";
import { useSettingsStore } from "@/features/settings/store";
import { useTaskStore } from "@/features/tasks/store";
import { useFocusTimerStore } from "@/shared/store/focusTimerStore";
import { useTaskTimerStore } from "@/shared/store/taskTimerStore";
import { CheckCircle,Clock,FileText } from "@phosphor-icons/react";
import { formatInTimeZone } from "date-fns-tz";
import { useMemo } from "react";

const formatSeconds = (total: number) => {
  if (total === 0) return "0s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const DailyActivitySummary = () => {
  const tasks = useTaskStore((s) => s.tasks) || [];
  const timers = useTaskTimerStore((s) => s.timers) || {};
  const documents = useDocumentStore((s) => s.documents) || {};
  const timezone = useSettingsStore((s) => s.timezone);

  const {
    stopwatchSeconds,
    pomodoroSecondsToday,
    timerSecondsToday,
  } = useFocusTimerStore();

  const focusTimerSeconds = stopwatchSeconds + (pomodoroSecondsToday || 0) + (timerSecondsToday || 0);

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

  const totalFocusSeconds = useMemo(() => {
    const taskFocusToday = tasks.reduce((sum, t) => {
      if (t.isDeleted) return sum;
      const timer = timers[t.id];
      if (timer && timer.lastWorkedDate === todayStr) {
        return sum + (timer.secondsToday || 0);
      }
      return sum;
    }, 0);
    return taskFocusToday + focusTimerSeconds;
  }, [tasks, timers, todayStr, focusTimerSeconds]);

  const docsActivityToday = useMemo(() => {
    return Object.values(documents).filter((d: any) => {
      if (!d || d.isDeleted || d.id.startsWith("task-")) return false;
      try {
        if (d.createdAt) {
          const cDate = new Date(d.createdAt);
          if (!isNaN(cDate.getTime())) {
            const cDateStr = formatInTimeZone(cDate, timezone, "yyyy-MM-dd");
            if (cDateStr === todayStr) return true;
          }
        }
        if (d.updatedAt) {
          const uDate = new Date(d.updatedAt);
          if (!isNaN(uDate.getTime())) {
            const uDateStr = formatInTimeZone(uDate, timezone, "yyyy-MM-dd");
            if (uDateStr === todayStr) return true;
          }
        }
      } catch (e) {}
      return false;
    }).length;
  }, [documents, todayStr, timezone]);

  return (
    <div className="absolute bottom-8 flex gap-3 items-center justify-center">
      {/* Card 1: Focus Time */}
      <div className="flex items-center gap-2 px-4 py-2 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
        <Clock size={14} className="text-purple-500 shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground">Focus:</span>
        <span className="text-xs font-bold text-foreground font-mono">{formatSeconds(totalFocusSeconds)}</span>
      </div>

      {/* Card 2: Tasks Completed */}
      <div className="flex items-center gap-2 px-4 py-2 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground">Completed:</span>
        <span className="text-xs font-bold text-foreground font-mono">{completedToday.length}</span>
      </div>

      {/* Card 3: Documents Edited + Created */}
      <div className="flex items-center gap-2 px-4 py-2 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
        <FileText size={14} className="text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground">Docs Activity:</span>
        <span className="text-xs font-bold text-foreground font-mono">{docsActivityToday}</span>
      </div>
    </div>
  );
};
