import React, { useMemo, useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
  Sparkle,
  Check,
  Trash,
  Microphone,
  ArrowUp,
  Lightning,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useDocumentStore } from "@/features/documents/store";
import { useTaskStore } from "@/features/tasks/store";
import { useTaskTimerStore } from "@/shared/store/taskTimerStore";
import { useUiStore } from "@/shared/store/uiStore";
import { useSettingsStore } from "@/features/settings/store";
import { cn, getColorStyle } from "@/shared/lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import {
  getRelativeTimeString,
  isTaskOverdue,
  isTaskUpcoming,
} from "@/shared/lib/time";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatSeconds = (total: number) => {
  if (total === 0) return "0s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good morning", emoji: "🌅" };
  if (h >= 12 && h < 17) return { text: "Good afternoon", emoji: "☀️" };
  if (h >= 17 && h < 22) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌌" };
};

const getCaptureIcon = (type: string) => {
  switch (type) {
    case "Note": return <Sparkle size={13} className="text-amber-500" />;
    case "Task": return <CheckCircle size={13} className="text-purple-500" />;
    case "Doc":  return <FileText size={13} className="text-blue-500" />;
    case "Link": return <Lightning size={13} className="text-emerald-500" />;
    default:     return <Sparkle size={13} className="text-rose-500" />;
  }
};

// Priority → subtle transparent tinted styles
const PRIORITY_STYLE: Record<string, { card: string; badge: string; check: string }> = {
  urgent: {
    card:  "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-400",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    check: "border-red-400 text-red-600 bg-background",
  },
  high: {
    card:  "bg-orange-500/10 border-orange-500/25 text-orange-700 dark:text-orange-400",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    check: "border-orange-400 text-orange-600 bg-background",
  },
  medium: {
    card:  "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    check: "border-amber-400 text-amber-600 bg-background",
  },
  low: {
    card:  "bg-slate-500/8 border-slate-500/20 text-slate-700 dark:text-slate-400",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    check: "border-slate-400 text-slate-500 bg-background",
  },
  none: {
    card:  "bg-muted/20 border-border/50 text-foreground/80",
    badge: "bg-muted text-muted-foreground border-border/60",
    check: "border-border text-purple-600 bg-background",
  },
};

const OVERDUE_STYLE = {
  card:  "bg-red-600 border-red-700 text-white dark:bg-red-700 dark:border-red-800",
  badge: "bg-white/20 text-white border-white/30",
  check: "border-white/60 text-red-600 bg-white",
};

const getTaskStyle = (task: any) => {
  if (!task.completed && task.status !== "done" && isTaskOverdue(task.deadline)) {
    return OVERDUE_STYLE;
  }
  return PRIORITY_STYLE[task.priority ?? "none"] ?? PRIORITY_STYLE.none;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const GlancePage = ({ paneId }: { paneId: string }) => {
  const openDocument   = useUiStore((s) => s.openDocument);
  const documents      = useDocumentStore((s) => s.documents) || {};
  const tasks          = useTaskStore((s) => s.tasks) || [];
  const updateTask     = useTaskStore((s) => s.updateTask);
  const addTask        = useTaskStore((s) => s.addTask);
  const addDocument    = useDocumentStore((s) => s.addDocument);
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const timers         = useTaskTimerStore((s) => s.timers) || {};
  const timezone       = useSettingsStore((s) => s.timezone);
  const userName       = useSettingsStore((s) => s.userName);

  // Quick capture
  const [captureText, setCaptureText] = useState("");
  const [activeType, setActiveType]   = useState<"Note" | "Task" | "Doc" | "Link" | "AI">("Note");
  const [captures, setCaptures]       = useState<{ id: string; content: string; type: string; createdAt: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glance-captures");
      if (saved) setCaptures(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const saveCaptures = (list: typeof captures) => {
    setCaptures(list);
    localStorage.setItem("glance-captures", JSON.stringify(list));
  };

  const handleSubmitCapture = async () => {
    if (!captureText.trim()) return;
    const entry = {
      id: `capture-${Date.now()}`,
      content: captureText.trim(),
      type: activeType,
      createdAt: new Date().toISOString(),
    };
    if (activeType === "Note") {
      const todayDateStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
      const dailyNoteId = `daily-note-${todayDateStr}`;
      const existingDoc = documents[dailyNoteId];
      const captureTextTrimmed = captureText.trim();
      let newContent = "";
      if (existingDoc && existingDoc.content) {
        newContent = existingDoc.content + `<p>${captureTextTrimmed}</p>`;
      } else {
        newContent = `<p>${captureTextTrimmed}</p>`;
      }
      await updateDocument(dailyNoteId, {
        content: newContent,
        type: "page",
        updatedAt: new Date().toISOString()
      });
      openDocument(dailyNoteId, paneId);
    } else if (activeType === "Doc") {
      const newId = `doc-${crypto.randomUUID()}`;
      await addDocument({
        id: newId,
        title: captureText.trim().substring(0, 40),
        content: `<h1>${captureText.trim()}</h1><p>Captured from Glance.</p>`,
        type: "page",
        tags: [],
        updatedAt: new Date().toISOString(),
      });
      openDocument(newId, paneId);
    } else if (activeType === "Task") {
      addTask({ title: captureText.trim(), completed: false, status: "open", list: "All Tasks" });
    }
    saveCaptures([entry, ...captures]);
    setCaptureText("");
  };

  const handleCaptureKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitCapture(); }
  };

  const removeCapture = (id: string) => saveCaptures(captures.filter((c) => c.id !== id));

  const openTaskEditor = (taskId: string) =>
    window.dispatchEvent(new CustomEvent("task-editor-open", { detail: { taskId } }));

  // ── Derived data ────────────────────────────────────────────────────────────

  const todayStr = useMemo(
    () => formatInTimeZone(new Date(), timezone, "yyyy-MM-dd"),
    [timezone]
  );

  // Tasks with ≥ 5 min of tracked time, sorted descending
  const timedTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.isDeleted && timers[t.id] && timers[t.id].seconds >= 300)
      .sort((a, b) => (timers[b.id]?.seconds ?? 0) - (timers[a.id]?.seconds ?? 0));
  }, [tasks, timers]);

  // Recent documents

  const recentDocs = useMemo(() => {
    return Object.values(documents)
      .filter((d: any) => d && !d.isDeleted && !d.id.startsWith("task-"))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [documents]);

  // Planner tasks
  const completedToday = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isDeleted || (!t.completed && t.status !== "done")) return false;
      if (!t.completedAt) return false;
      try {
        const date = new Date(t.completedAt);
        if (isNaN(date.getTime())) return false;
        const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
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

  const totalFocusSeconds = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.isDeleted) return sum;
      return sum + (timers[t.id]?.seconds ?? 0);
    }, 0);
  }, [tasks, timers]);

  const docsActivityToday = useMemo(() => {
    return Object.values(documents).filter((d: any) => {
      if (!d || d.isDeleted || d.id.startsWith("task-")) return false;
      try {
        if (d.createdAt) {
          const cDate = new Date(d.createdAt);
          if (!isNaN(cDate.getTime())) {
            const cDateStr = formatInTimeZone(cDate, timezone, 'yyyy-MM-dd');
            if (cDateStr === todayStr) return true;
          }
        }
        if (d.updatedAt) {
          const uDate = new Date(d.updatedAt);
          if (!isNaN(uDate.getTime())) {
            const uDateStr = formatInTimeZone(uDate, timezone, 'yyyy-MM-dd');
            if (uDateStr === todayStr) return true;
          }
        }
      } catch (e) {}
      return false;
    }).length;
  }, [documents, todayStr, timezone]);

  const greeting = getGreeting();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full flex gap-0 overflow-hidden bg-background font-sans text-foreground select-none">

      {/* ── LEFT COLUMN: Time Bar Graph + Recent Docs ─────────────────────── */}
      <div className="w-96 flex-shrink-0 border-r border-border/50 flex flex-col gap-0 overflow-hidden">

        {/* Bar Graph — 24h timeline */}
        <div className="h-[280px] flex-shrink-0 flex flex-col overflow-hidden p-5">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Focus Time Today
            </h2>
            <span className="text-[10px] font-semibold text-muted-foreground/50 bg-muted/40 border border-border/40 px-2 py-0.5 rounded">
              24h scale
            </span>
          </div>

          {timedTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 italic text-center px-4">
              Start a timer on a task to see focus time here.
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              {/* Scrollable bars */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2 pr-1 pb-1">
                {timedTasks.map((task) => {
                  const secs    = timers[task.id]?.seconds ?? 0;
                  const pct     = Math.min((secs / 86400) * 100, 100);
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
                        <span className={cn(
                          "text-[11px] font-semibold truncate flex-1 leading-none",
                          pct > 30 ? "text-white drop-shadow-sm" : "text-foreground/80"
                        )}>
                          {task.title || "Untitled Task"}
                        </span>
                        <span className={cn(
                          "text-[10px] font-mono font-bold shrink-0",
                          pct > 30 ? "text-white/80" : "text-muted-foreground/70"
                        )}>
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

        {/* Divider */}
        <div className="h-px bg-border/40 shrink-0 mx-5" />

        {/* Recent Documents */}
        <div className="flex-1 min-h-0 p-5 flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Continue where you left
            </h2>
            <button
              onClick={() => openDocument("section-folders", paneId)}
              className="text-[10px] font-semibold text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
            >
              All →
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="text-xs text-muted-foreground/50 italic py-3 text-center">No documents yet.</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
              {recentDocs.map((doc: any) => {
                const style = getColorStyle(doc.cardColor);
                return (
                  <div
                    key={doc.id}
                    onClick={() => openDocument(doc.id, paneId)}
                    className="flex items-center justify-between px-3 py-2 rounded-sm border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-border/80 cursor-pointer transition-all group"
                    style={style ? { backgroundColor: style.bg, borderColor: style.border } : {}}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{doc.icon || "📄"}</span>
                      <span className="text-xs font-semibold text-foreground/90 group-hover:text-purple-500 transition-colors truncate">
                        {doc.title || "Untitled"}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/60 shrink-0 ml-2">
                      {getRelativeTimeString(doc.updatedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Captures */}
        {captures.length > 0 && (
          <>
            {/* Divider */}
            <div className="h-px bg-border/40 shrink-0 mx-5" />

            <div className="flex-1 min-h-0 p-5 flex flex-col gap-2 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Recent Captures
                </h2>
                <button
                  onClick={() => openDocument("section-daily-notes", paneId)}
                  className="text-[10px] font-semibold text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  View Inbox →
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
                {captures.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all group cursor-pointer"
                    onClick={() => {}}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{getCaptureIcon(c.type)}</span>
                      <span className="text-xs font-medium text-foreground/90 truncate">{c.content}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 text-muted-foreground group-hover:hidden">
                        {c.type}
                      </span>
                      <span className="text-[9px] text-muted-foreground/60 font-mono group-hover:hidden">
                        {getRelativeTimeString(c.createdAt)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCapture(c.id); }}
                        className="hidden group-hover:flex p-1 rounded hover:bg-rose-500/10 hover:text-rose-500 text-muted-foreground transition-colors cursor-pointer"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CENTER COLUMN: Greeting + Quick Capture ─────── */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-10 overflow-y-auto no-scrollbar">

        {/* Greeting */}
        <div className="absolute top-16 text-center shrink-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">
            {greeting.text}{userName ? `, ${userName}` : ""} {greeting.emoji}
          </h1>
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mt-1">
            {formatInTimeZone(new Date(), timezone, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {/* Quick Capture Box */}
        <div className="w-full max-w-3xl bg-muted/10 border border-border/60 rounded-lg p-4 flex flex-col gap-3 shadow-sm focus-within:border-border/90 focus-within:shadow-md transition-all shrink-0">
          <textarea
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            onKeyDown={handleCaptureKey}
            placeholder="Capture a thought, task, or note…"
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder-muted-foreground/40 resize-none h-16 py-1 text-foreground/90"
          />
          <div className="flex items-center justify-between border-t border-border/20 pt-3">
            {/* Type pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["Note", "Task", "Doc", "Link", "AI"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={cn(
                    "px-2.5 py-1 rounded border flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer select-none",
                    activeType === type
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "border-border/50 hover:border-border/80 hover:bg-muted/20 text-foreground/70"
                  )}
                >
                  {getCaptureIcon(type)}
                  <span>{type}</span>
                </button>
              ))}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button type="button" className="p-1.5 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
                <Microphone size={15} />
              </button>
              <button
                type="button"
                onClick={handleSubmitCapture}
                disabled={!captureText.trim()}
                className={cn(
                  "p-1.5 rounded flex items-center justify-center transition-all cursor-pointer",
                  captureText.trim()
                    ? "bg-purple-500 hover:bg-purple-600 text-white shadow-sm"
                    : "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/30"
                )}
              >
                <ArrowUp size={15} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom minimal summary cards */}
        <div className="absolute bottom-8 flex gap-3 items-center justify-center">
          {/* Card 1: Focus Time */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
            <Clock size={12} className="text-purple-500 shrink-0" />
            <span className="text-[10px] font-semibold text-muted-foreground">Focus:</span>
            <span className="text-[10px] font-bold text-foreground font-mono">{formatSeconds(totalFocusSeconds)}</span>
          </div>

          {/* Card 2: Tasks Completed */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
            <CheckCircle size={12} className="text-emerald-500 shrink-0" />
            <span className="text-[10px] font-semibold text-muted-foreground">Completed:</span>
            <span className="text-[10px] font-bold text-foreground font-mono">{completedToday.length}</span>
          </div>

          {/* Card 3: Documents Edited + Created */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border/40 bg-muted/10 shadow-sm-sm">
            <FileText size={12} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-semibold text-muted-foreground">Docs Activity:</span>
            <span className="text-[10px] font-bold text-foreground font-mono">{docsActivityToday}</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Completed + Incomplete + Upcoming Tasks ───────── */}
      <div className="w-96 flex-shrink-0 border-l border-border/50 flex flex-col overflow-hidden">

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
                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completed: false }); }}
                      className="w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer bg-purple-500 border-purple-500 text-white"
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
                const s       = getTaskStyle(task);
                const overdue = !task.completed && task.status !== "done" && isTaskOverdue(task.deadline);
                return (
                  <div
                    key={task.id}
                    onClick={() => openTaskEditor(task.id)}
                    className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded border cursor-pointer transition-all group shrink-0", s.card)}
                  >
                    <div
                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completed: true }); }}
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
                      onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completed: true }); }}
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


    </div>
  );
};
