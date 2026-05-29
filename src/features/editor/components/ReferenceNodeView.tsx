import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  Square, 
  Tag as TagIcon, 
  User, 
  Clock,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { formatDisplayDate } from '@/shared/lib/time';

export const ReferenceNodeView = ({ node, updateAttributes }: any) => {
  const { id, label, type, status, dueDate, dateStr } = node.attrs;
  const openDocument = useUiStore(state => state.openDocument);
  const documents = useDocumentStore(state => state.documents);
  const [hovered, setHovered] = useState(false);

  // Live lookup of note details if reference type is document
  const targetDoc = type === 'document' && id ? documents[id] : null;
  const displayLabel = targetDoc ? (targetDoc.title || 'Untitled') : label;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updateAttributes({
      status: status === 'done' ? 'todo' : 'done'
    });
  };

  const handleOpenReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (type === 'document' && id) {
      if (e.metaKey || e.ctrlKey) {
        openDocument(id);
      } else {
        // Dispatch global custom event to trigger inline portal preview popup
        window.dispatchEvent(new CustomEvent('doc-preview-open', {
          detail: { id, trigger: e.currentTarget }
        }));
      }
    }
  };

  // Compute text preview for the hover card
  const docPreviewText = React.useMemo(() => {
    if (!targetDoc?.content) return "No content in this note yet.";
    // Strip HTML tags for clean text preview
    const clean = targetDoc.content.replace(/<[^>]*>/g, ' ');
    return clean.length > 180 ? `${clean.slice(0, 180).trim()}...` : clean.trim();
  }, [targetDoc?.content]);

  // Render elements depending on reference type
  return (
    <NodeViewWrapper className="inline-block align-middle relative select-none">
      <div 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative inline-block"
      >
        {type === 'document' && (
          <span 
            onClick={handleOpenReference}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-sm bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-[13px] font-medium cursor-pointer transition-colors duration-150 hover:bg-blue-500/20 hover:border-blue-500/30 group/mention"
          >
            {targetDoc?.icon ? (
              <span className="text-[13px] leading-none shrink-0 font-sans">{targetDoc.icon}</span>
            ) : (
              <FileText size={14} weight="duotone" className="shrink-0" />
            )}
            <span className="truncate max-w-[150px]">{displayLabel}</span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                openDocument(id);
              }}
              className="opacity-0 group-hover/mention:opacity-100 hover:text-blue-700 dark:hover:text-blue-300 transition-all pl-0.5 rounded shrink-0"
              title="Open full page"
            >
              <ArrowSquareOut size={12} weight="bold" />
            </button>
          </span>
        )}

        {type === 'task' && (
          <span 
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-sm text-[13px] font-medium border transition-all duration-200 select-none",
              status === 'done' 
                ? "bg-emerald-500/5 dark:bg-emerald-400/5 border-emerald-500/15 dark:border-emerald-400/15 text-emerald-500/50 dark:text-emerald-400/50 line-through" 
                : "bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400"
            )}
          >
            <span onClick={handleCheckboxClick} className="cursor-pointer flex items-center justify-center shrink-0">
              {status === 'done' ? (
                <CheckSquare size={14} weight="fill" className="text-emerald-500 dark:text-emerald-400" />
              ) : (
                <Square size={14} className="text-amber-500 dark:text-amber-400 hover:scale-105 active:scale-95 transition-transform" />
              )}
            </span>
            <span className="truncate max-w-[150px]">{displayLabel}</span>
            {dueDate && (
              <span className={cn(
                "inline-flex items-center gap-0.5 px-1 py-0.2 rounded-sm text-[9px] font-mono",
                status === 'done' ? "opacity-50" : "bg-red-500/10 text-red-500"
              )}>
                <Clock size={10} />
                {formatDisplayDate(dueDate, "MMM d")}
              </span>
            )}
          </span>
        )}

        {type === 'date' && (
          <span 
            className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 rounded-sm bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 dark:border-purple-400/20 text-purple-600 dark:text-purple-400 text-[13px] font-medium"
          >
            <Calendar size={14} weight="duotone" className="shrink-0" />
            <span className="truncate">{dateStr || label}</span>
          </span>
        )}

        {type === 'tag' && (
          <span 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-sm bg-rose-500/10 dark:bg-rose-400/10 border border-rose-500/20 dark:border-rose-400/20 text-rose-600 dark:text-rose-400 text-[13px] font-semibold"
          >
            <TagIcon size={12} weight="fill" className="shrink-0 opacity-70" />
            <span className="truncate">{displayLabel}</span>
          </span>
        )}

        {type === 'person' && (
          <span 
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-sm bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/20 dark:border-sky-400/20 text-sky-600 dark:text-sky-400 text-[13px] font-medium"
          >
            <User size={13} weight="duotone" className="shrink-0" />
            <span className="truncate">{displayLabel}</span>
          </span>
        )}

        {/* Floating Hover Preview Card for Documents */}
        {hovered && type === 'document' && targetDoc && (
          <div 
            onClick={handleOpenReference}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-background border border-border shadow-sm-sm rounded-sm-sm p-4 z-50 text-sans text-foreground cursor-pointer animate-fade-in text-left pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <FileText size={12} />
                Document Preview
              </span>
              <ArrowSquareOut size={12} className="text-muted-foreground opacity-60" />
            </div>
            <h4 className="font-semibold text-sm leading-tight text-foreground truncate mb-1.5">
              {targetDoc.title || 'Untitled'}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4 select-none">
              {docPreviewText}
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground/60 font-mono font-medium">
              <span>Updated:</span>
              <span>{formatDisplayDate(targetDoc.updatedAt, "MMM d, h:mm a")}</span>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
