import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  DotsSix, 
  Plus, 
  Trash, 
  Copy, 
  Sparkle,
  Paragraph,
  TextH,
  Quotes,
  CheckSquareOffset,
  ListBullets,
  Code
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { aiService } from '@/services/ai.service';

interface BlockHandleProps {
  editor: Editor;
}

export const BlockHandle = ({ editor }: BlockHandleProps) => {
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [handlePosition, setHandlePosition] = useState({ top: 0, left: 0 });
  const [aiLoading, setAiLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (menuOpen || !editor || editor.isDestroyed) return;

      const editorContainer = document.querySelector('.ProseMirror');
      if (!editorContainer) return;

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!target) return;

      // Find top-level block child of .ProseMirror
      let blockElement: HTMLElement | null = target;
      while (blockElement && blockElement.parentElement !== editorContainer) {
        blockElement = blockElement.parentElement;
      }

      if (blockElement && blockElement.nodeName !== 'DIV') {
        const rect = blockElement.getBoundingClientRect();
        const editorRect = editorContainer.getBoundingClientRect();

        setActiveElement(blockElement);
        setHandlePosition({
          top: rect.top + window.scrollY + (rect.height - 24) / 2,
          // Position to the left of the block, aligned inside the margins
          left: Math.max(10, rect.left - 28)
        });
      } else {
        // If not hovering a valid block, hide the handle (unless hovering the handle itself)
        const hoverEl = e.target as HTMLElement;
        if (!hoverEl.closest('.block-handle-container')) {
          setActiveElement(null);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [editor, menuOpen]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!activeElement && !menuOpen) return null;

  // Helper to execute commands on the current block position
  const runOnCurrentBlock = (action: (pos: number) => void) => {
    if (!activeElement || !editor) return;
    const rect = activeElement.getBoundingClientRect();
    const coords = editor.view.posAtCoords({ left: rect.left + 8, top: rect.top + 8 });
    if (coords) {
      action(coords.pos);
    }
    setMenuOpen(false);
  };

  // Block Actions
  const handleDuplicate = () => {
    runOnCurrentBlock((pos) => {
      const $pos = editor.state.doc.resolve(pos);
      const node = $pos.node(1); // Top level block node
      if (node) {
        editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
      }
    });
  };

  const handleDelete = () => {
    runOnCurrentBlock((pos) => {
      editor.chain().focus().deleteRange({ from: pos, to: pos + (activeElement?.textContent?.length || 0) + 1 }).run();
    });
  };

  const handleTransform = (type: string, attrs?: any) => {
    runOnCurrentBlock((pos) => {
      editor.commands.setTextSelection(pos);
      if (type === 'paragraph') {
        editor.chain().focus().setParagraph().run();
      } else if (type === 'h1') {
        editor.chain().focus().setHeading({ level: 1 }).run();
      } else if (type === 'h2') {
        editor.chain().focus().setHeading({ level: 2 }).run();
      } else if (type === 'h3') {
        editor.chain().focus().setHeading({ level: 3 }).run();
      } else if (type === 'quote') {
        editor.chain().focus().toggleBlockquote().run();
      } else if (type === 'todo') {
        editor.chain().focus().toggleTaskList().run();
      } else if (type === 'bullet') {
        editor.chain().focus().toggleBulletList().run();
      } else if (type === 'code') {
        editor.chain().focus().toggleCodeBlock().run();
      }
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
          editor.chain().focus().insertContentAt(pos + text.length + 1, `<blockquote class="border-l-4 border-purple-500/50 pl-4 py-1.5 my-2 text-purple-600 dark:text-purple-400 font-sans italic text-sm">${res.text}</blockquote>`).run();
        }
      } else if (action === 'improve') {
        const res = await aiService.rewrite(text);
        if (res.success) {
          editor.chain().focus().insertContentAt(pos + text.length + 1, `<p class="text-sm font-medium text-foreground/80 mt-2">${res.text}</p>`).run();
        }
      } else if (action === 'tasks') {
        const res = await aiService.generateTasks(text);
        if (res.success && res.tasks) {
          const taskHTML = `<ul data-type="taskList">${res.tasks.map(t => `<li data-type="taskItem" data-checked="false"><p>${t}</p></li>`).join('')}</ul>`;
          editor.chain().focus().insertContentAt(pos + text.length + 1, taskHTML).run();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
      setMenuOpen(false);
    }
  };

  return (
    <div 
      className="absolute block-handle-container z-40 flex items-center gap-1 select-none pointer-events-auto"
      style={{ top: handlePosition.top, left: handlePosition.left }}
    >
      <div className="flex items-center gap-0.5">
        <button 
          onClick={() => {
            // Plus button quickly appends a paragraph below the current block
            runOnCurrentBlock((pos) => {
              const rect = activeElement!.getBoundingClientRect();
              editor.chain().focus().insertContentAt(pos + (activeElement!.textContent?.length || 0) + 1, { type: 'paragraph' }).run();
            });
          }}
          className="w-5 h-5 rounded-sm bg-background/90 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-all active:scale-90"
          title="Add block below"
        >
          <Plus size={12} weight="bold" />
        </button>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "w-5 h-5 rounded-sm bg-background/90 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:bg-muted flex items-center justify-center cursor-grab active:cursor-grabbing transition-all active:scale-90",
            menuOpen && "bg-muted text-foreground"
          )}
          title="Block options"
        >
          <DotsSix size={14} weight="bold" />
        </button>
      </div>

      {/* Block Menu Dropdown */}
      {menuOpen && (
        <div 
          ref={menuRef}
          className="absolute left-12 top-0 bg-background border border-border shadow-sm-sm rounded-sm-sm p-1.5 min-w-[200px] z-50 flex flex-col font-sans text-foreground"
        >
          {/* Operations */}
          <button 
            onClick={handleDuplicate}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <Copy size={14} className="text-muted-foreground" />
            Duplicate block
          </button>
          <button 
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
          >
            <Trash size={14} />
            Delete block
          </button>

          <div className="w-full h-px bg-border/60 my-1" />

          {/* AI Tools */}
          <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">AI Actions</div>
          <button 
            disabled={aiLoading}
            onClick={() => handleAiAction('summarize')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium disabled:opacity-50"
          >
            <Sparkle size={14} className="text-purple-500" />
            Summarize Block
          </button>
          <button 
            disabled={aiLoading}
            onClick={() => handleAiAction('improve')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium disabled:opacity-50"
          >
            <Sparkle size={14} className="text-purple-500" />
            Polished Rewrite
          </button>
          <button 
            disabled={aiLoading}
            onClick={() => handleAiAction('tasks')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium disabled:opacity-50"
          >
            <Sparkle size={14} className="text-purple-500" />
            Extract Tasks
          </button>

          <div className="w-full h-px bg-border/60 my-1" />

          {/* Transform Into */}
          <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">Transform Block</div>
          <button 
            onClick={() => handleTransform('paragraph')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <Paragraph size={14} className="text-muted-foreground" />
            Text paragraph
          </button>
          <button 
            onClick={() => handleTransform('h1')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <TextH size={14} className="text-muted-foreground" />
            Heading 1
          </button>
          <button 
            onClick={() => handleTransform('h2')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <TextH size={14} className="text-muted-foreground" />
            Heading 2
          </button>
          <button 
            onClick={() => handleTransform('h3')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <TextH size={14} className="text-muted-foreground" />
            Heading 3
          </button>
          <button 
            onClick={() => handleTransform('todo')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <CheckSquareOffset size={14} className="text-muted-foreground" />
            To-do Checklist
          </button>
          <button 
            onClick={() => handleTransform('bullet')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <ListBullets size={14} className="text-muted-foreground" />
            Bullet list
          </button>
          <button 
            onClick={() => handleTransform('quote')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <Quotes size={14} className="text-muted-foreground" />
            Block Quote
          </button>
          <button 
            onClick={() => handleTransform('code')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-sm flex items-center gap-2.5 transition-colors cursor-pointer text-foreground/80 font-medium"
          >
            <Code size={14} className="text-muted-foreground" />
            Code Block
          </button>
        </div>
      )}
    </div>
  );
};
