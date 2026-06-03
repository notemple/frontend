import React, { useMemo } from "react";
import {
  CalendarBlank,
  CheckSquare,
  FileText,
  Lightning,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { useDocumentStore } from "@/features/documents/store";
import { useTaskStore } from "@/features/tasks/store";
import { useUiStore } from "@/shared/store/uiStore";
import { getRelativeTimeString } from "@/shared/lib/time";

const getCaptureIcon = (type: string) => {
  switch (type) {
    case "Note":
      return <CalendarBlank size={15} className="text-emerald-500/90 dark:text-emerald-400/90" />;
    case "Task":
      return <CheckSquare size={15} className="text-blue-500/90 dark:text-blue-400/90" />;
    case "Doc":
      return <FileText size={15} className="text-blue-500" />;
    case "Link":
      return <Lightning size={15} className="text-emerald-500" />;
    default:
      return <Sparkle size={15} className="text-rose-500" />;
  }
};

interface CaptureEntry {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  itemId?: string;
}

interface RecentCapturesListProps {
  paneId: string;
  captures: CaptureEntry[];
  onRemoveCapture: (id: string) => void;
}

export const RecentCapturesList = ({ paneId, captures, onRemoveCapture }: RecentCapturesListProps) => {
  const documents = useDocumentStore((s) => s.documents) || {};
  const tasks = useTaskStore((s) => s.tasks) || [];
  const openDocument = useUiStore((s) => s.openDocument);

  const openTaskEditor = (taskId: string) => {
    window.dispatchEvent(new CustomEvent("task-editor-open", { detail: { taskId } }));
  };

  const activeCaptures = useMemo(() => {
    return captures.filter((c: any) => {
      if (!c.itemId) return true;
      if (c.type === "Note" || c.type === "Doc") {
        const doc = documents[c.itemId];
        if (!doc || doc.isDeleted) return false;
      } else if (c.type === "Task") {
        const task = tasks.find((t) => t.id === c.itemId);
        if (!task || task.isDeleted) return false;
      }
      return true;
    });
  }, [captures, documents, tasks]);

  if (activeCaptures.length === 0) return null;

  return (
    <>
      <div className="h-px bg-border/25 shrink-0 mx-5" />

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
          {activeCaptures.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-3 py-2.5 rounded border border-border/50 bg-muted/10 hover:bg-muted/20 transition-all group cursor-pointer"
              onClick={() => {
                if ((c.type === "Note" || c.type === "Doc") && c.itemId) {
                  openDocument(c.itemId, paneId);
                } else if (c.type === "Task" && c.itemId) {
                  openTaskEditor(c.itemId);
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{getCaptureIcon(c.type)}</span>
                <span className="text-xs font-medium text-foreground/90 truncate">
                  {c.type === "Note" && c.itemId ? (documents[c.itemId]?.title || c.content) : c.content}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 text-muted-foreground group-hover:hidden">
                  {c.type}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-mono group-hover:hidden">
                  {getRelativeTimeString(c.createdAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCapture(c.id);
                  }}
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
  );
};
