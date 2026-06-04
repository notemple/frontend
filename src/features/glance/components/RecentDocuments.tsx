import { useDocumentStore } from "@/features/documents/store";
import { getRelativeTimeString } from "@/shared/lib/time";
import { getColorStyle } from "@/shared/lib/utils";
import { useUiStore } from "@/shared/store/uiStore";
import { useMemo } from "react";

export const RecentDocuments = ({ paneId }: { paneId: string }) => {
  const documents = useDocumentStore((s) => s.documents) || {};
  const openDocument = useUiStore((s) => s.openDocument);

  const recentDocs = useMemo(() => {
    return Object.values(documents)
      .filter((d: any) => d && !d.isDeleted && !d.id.startsWith("task-"))
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [documents]);

  return (
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
  );
};
