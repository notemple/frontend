/**
 * BlockHandle
 *
 * Floating overlay that appears when the user hovers a top-level ProseMirror block.
 * Shows two buttons:
 *   [+]  – insert a paragraph below the hovered block
 *   [⠿]  – drag handle (useDraggable from dnd-kit) + click opens block options menu
 *
 * Positioning:
 *   The handle is absolutely positioned inside `.templnote-editor-wrapper` (which is
 *   `position:relative`).  Left is anchored to the ProseMirror element's left edge
 *   minus 32 px so it always appears in the left gutter, even when the editor is
 *   centred with `mx-auto`.
 */

import { aiService } from '@/services/ai.service';
import { cn } from '@/shared/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import {
	CheckSquareOffset,
	Code,
	Copy,
	DotsSix,
	ListBullets,
	Paragraph,
	Plus,
	Quotes,
	Sparkle,
	TextH,
	Trash,
} from '@phosphor-icons/react';
import { Editor } from '@tiptap/react';
import { useEffect,useRef,useState } from 'react';

interface BlockHandleProps {
  editor: Editor;
}

/** Returns the 0-based index of `el` among its ProseMirror siblings. */
function getBlockIndex(el: HTMLElement | null): number {
  if (!el) return -1;
  const pm = document.querySelector('.ProseMirror');
  if (!pm) return -1;
  return Array.from(pm.children).indexOf(el);
}

/** Returns the start and end positions of a sibling child in the document. */
function getBlockPosition(editor: Editor, index: number): { start: number; end: number } | null {
  if (index < 0 || !editor || editor.isDestroyed) return null;
  let pos = 0;
  const doc = editor.state.doc;
  for (let i = 0; i < doc.childCount; i++) {
    const child = doc.child(i);
    if (i === index) {
      return { start: pos, end: pos + child.nodeSize };
    }
    pos += child.nodeSize;
  }
  return null;
}

export const BlockHandle = ({ editor }: BlockHandleProps) => {
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [handlePosition, setHandlePosition] = useState({ top: 0, left: 0 });
  const [aiLoading, setAiLoading] = useState(false);
  const [plusHovered, setPlusHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── dnd-kit drag handle ──────────────────────────────────────────────────────
  const blockIndex = getBlockIndex(activeElement);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'block-drag-handle',
    data: { blockIndex, activeElement },
    // Disable when no valid block is hovered so dnd-kit skips the element
    disabled: blockIndex < 0,
  });

  // ── Hover tracking ───────────────────────────────────────────────────────────

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (menuOpen || isDragging || !editor || editor.isDestroyed) return;

      const pm = document.querySelector('.ProseMirror');
      if (!pm) return;

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target) return;

      // Walk up until we find a direct child of .ProseMirror
      let block: HTMLElement | null = target;
      while (block && block.parentElement !== pm) {
        block = block.parentElement;
      }

      if (block) {
        const blockRect = block.getBoundingClientRect();
        const editorRect = (pm as HTMLElement).getBoundingClientRect();
        // The CSS offset parent of .ProseMirror is the nearest `position:relative`
        // ancestor, which is the .templnote-editor-wrapper div — same element that
        // the handle is `absolute`-positioned inside.
        const offsetParent = (pm as HTMLElement).offsetParent as HTMLElement | null;
        const parentRect = offsetParent
          ? offsetParent.getBoundingClientRect()
          : editorRect;

        setActiveElement(block);
        setHandlePosition({
          // Vertically centre the handle buttons against the block
          top: blockRect.top - parentRect.top + (blockRect.height - 24) / 2,
          // Anchor to ProseMirror's left edge so all blocks line up
          left: editorRect.left - parentRect.left - 44,
        });
      } else {
        // Keep handle visible if the mouse is hovering the handle itself
        const hoverEl = e.target as HTMLElement;
        if (!hoverEl.closest('.block-handle-container')) {
          setActiveElement(null);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [editor, menuOpen, isDragging]);

  // ── Click outside → close menu ───────────────────────────────────────────────

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  // Don't render anything when there's no hovered block and the menu is closed
  if (!activeElement && !menuOpen) return null;

  // ── Block actions ────────────────────────────────────────────────────────────

  const runOnCurrentBlock = (action: (pos: number) => void) => {
    if (!activeElement || !editor) return;
    const rect = activeElement.getBoundingClientRect();
    const coords = editor.view.posAtCoords({ left: rect.left + 8, top: rect.top + 8 });
    if (coords) action(coords.pos);
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    runOnCurrentBlock((pos) => {
      const $pos = editor.state.doc.resolve(pos);
      const node = $pos.node(1);
      if (node) {
        editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
      }
    });
  };

  const handleDelete = () => {
    runOnCurrentBlock((pos) => {
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + (activeElement?.textContent?.length || 0) + 1 })
        .run();
    });
  };

  const handleTransform = (type: string) => {
    runOnCurrentBlock((pos) => {
      editor.commands.setTextSelection(pos);
      if (type === 'paragraph') editor.chain().focus().setParagraph().run();
      else if (type === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
      else if (type === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
      else if (type === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
      else if (type === 'quote') editor.chain().focus().toggleBlockquote().run();
      else if (type === 'todo') editor.chain().focus().toggleTaskList().run();
      else if (type === 'bullet') editor.chain().focus().toggleBulletList().run();
      else if (type === 'code') editor.chain().focus().toggleCodeBlock().run();
    });
  };

  const handleAiAction = async (action: 'summarize' | 'improve' | 'tasks') => {
    if (!activeElement || !editor) return;
    const text = activeElement.textContent || '';
    if (!text) return;

    setAiLoading(true);
    try {
      const rect = activeElement.getBoundingClientRect();
      const coords = editor.view.posAtCoords({ left: rect.left + 8, top: rect.top + 8 });
      if (!coords) return;
      const pos = coords.pos;

      if (action === 'summarize') {
        const res = await aiService.summarize(text);
        if (res.success) {
          editor
            .chain()
            .focus()
            .insertContentAt(
              pos + text.length + 1,
              `<blockquote class="border-l-4 border-purple-500/50 pl-4 py-1.5 my-2 text-purple-600 dark:text-purple-400 font-sans italic text-sm">${res.text}</blockquote>`
            )
            .run();
        }
      } else if (action === 'improve') {
        const res = await aiService.rewrite(text);
        if (res.success) {
          editor
            .chain()
            .focus()
            .insertContentAt(
              pos + text.length + 1,
              `<p class="text-sm font-medium text-foreground/80 mt-2">${res.text}</p>`
            )
            .run();
        }
      } else if (action === 'tasks') {
        const res = await aiService.generateTasks(text);
        if (res.success && res.tasks) {
          const taskHTML = `<ul data-type="taskList">${res.tasks
            .map((t) => `<li data-type="taskItem" data-checked="false"><p>${t}</p></li>`)
            .join('')}</ul>`;
          editor.chain().focus().insertContentAt(pos + text.length + 1, taskHTML).run();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
      setMenuOpen(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "absolute block-handle-container z-40 flex items-center gap-1 select-none pointer-events-auto",
        isDragging && "opacity-0 pointer-events-none"
      )}
      style={{ top: handlePosition.top, left: handlePosition.left }}
    >
      {/* Invisible hover bridge: prevents the handle from disappearing as the
          cursor crosses the gap between the block text and the handle buttons */}
      <div className="absolute right-[-44px] top-0 bottom-0 w-[44px] pointer-events-auto" />

      <div className="flex items-center gap-0.5 relative z-10">
        {/* ── Add paragraph below or above (Alt) ── */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={(e) => {
              setPlusHovered(false);
              const isAlt = e.altKey;
              const index = getBlockIndex(activeElement);
              const blockPos = getBlockPosition(editor, index);
              if (blockPos) {
                if (isAlt) {
                  editor.chain().focus().insertContentAt(blockPos.start, { type: 'paragraph' }).setTextSelection(blockPos.start + 1).run();
                } else {
                  editor.chain().focus().insertContentAt(blockPos.end, { type: 'paragraph' }).setTextSelection(blockPos.end + 1).run();
                }
              }
            }}
            onMouseEnter={() => setPlusHovered(true)}
            onMouseLeave={() => setPlusHovered(false)}
            className="w-5 h-5 rounded-sm bg-background/90 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <Plus size={12} weight="bold" />
          </button>

          {plusHovered && (
            <div className="absolute bottom-full left-0 mb-2 bg-card border border-border shadow-md rounded-md px-2.5 py-1.5 text-[10px] text-foreground font-sans whitespace-nowrap z-50 pointer-events-none flex flex-col gap-0.5 items-center text-center">
              <span className="font-semibold text-foreground/90 leading-none">Click to add a block</span>
              <span className="text-muted-foreground/60 text-[9px] leading-none">Alt-click to add block above</span>
              <div className="w-1.5 h-1.5 bg-card border-r border-b border-border rotate-45 absolute top-full left-2.5 -translate-x-1/2 -translate-y-[4px]" />
            </div>
          )}
        </div>

        {/* ── Drag handle / menu trigger ── */}
        <button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'w-5 h-5 rounded-sm bg-background/90 border border-border/40 text-muted-foreground/60',
            'hover:text-foreground hover:bg-muted flex items-center justify-center',
            'cursor-grab active:cursor-grabbing transition-colors',
            isDragging && 'opacity-40 cursor-grabbing',
            menuOpen && 'bg-muted text-foreground'
          )}
          title="Drag to move · Click for options"
        >
          <DotsSix size={14} weight="bold" />
        </button>
      </div>

      {/* ── Block context menu ───────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute left-12 top-0 bg-background border border-border shadow-sm rounded p-1.5 min-w-[200px] z-50 flex flex-col font-sans text-foreground"
        >
          {/* Operations */}
          <button
            onClick={handleDuplicate}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <Copy size={14} className="text-muted-foreground" />
            Duplicate block
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 rounded flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
          >
            <Trash size={14} />
            Delete block
          </button>

          <div className="w-full h-px bg-border/60 my-1" />

          {/* AI tools */}
          <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">
            AI Actions
          </div>
          {(
            [
              { label: 'Summarize Block', action: 'summarize' },
              { label: 'Polished Rewrite', action: 'improve' },
              { label: 'Extract Tasks', action: 'tasks' },
            ] as const
          ).map(({ label, action }) => (
            <button
              key={action}
              disabled={aiLoading}
              onClick={() => handleAiAction(action)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium disabled:opacity-50"
            >
              <Sparkle size={14} className="text-purple-500" />
              {label}
            </button>
          ))}

          <div className="w-full h-px bg-border/60 my-1" />

          {/* Transform */}
          <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">
            Transform Block
          </div>
          {(
            [
              { label: 'Text paragraph', type: 'paragraph', Icon: Paragraph },
              { label: 'Heading 1',      type: 'h1',        Icon: TextH },
              { label: 'Heading 2',      type: 'h2',        Icon: TextH },
              { label: 'Heading 3',      type: 'h3',        Icon: TextH },
              { label: 'To-do Checklist', type: 'todo',     Icon: CheckSquareOffset },
              { label: 'Bullet list',    type: 'bullet',    Icon: ListBullets },
              { label: 'Block Quote',    type: 'quote',     Icon: Quotes },
              { label: 'Code Block',     type: 'code',      Icon: Code },
            ] as const
          ).map(({ label, type, Icon }) => (
            <button
              key={type}
              onClick={() => handleTransform(type)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
            >
              <Icon size={14} className="text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
