import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { DotsThree, Copy, Trash } from '@phosphor-icons/react';

export const CodeBlockView: React.FC<NodeViewProps> = ({ node, editor, getPos, deleteNode }) => {
  const text = node.textContent;
  
  // Split content by newline to get the lines.
  // Ensure we render at least 1 line even if the block is empty.
  const lines = useMemo(() => {
    const list = text.split('\n');
    return list.length === 0 ? [''] : list;
  }, [text]);

  const handleDuplicate = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function' && typeof editor.commands.insertContent === 'function') {
      const pos = getPos();
      editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    } else if (typeof deleteNode === 'function') {
      deleteNode();
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <NodeViewWrapper className="code-block-wrapper group relative flex font-mono bg-zinc-950/80 dark:bg-zinc-950/40 border border-border/80 dark:border-border/30 rounded-sm p-4 overflow-hidden select-none my-3">
          {/* Hover Option Dropdown Trigger button - three-dot menu like todo lists */}
          <div className="opacity-0 group-hover:opacity-100 absolute right-3 top-3 transition-all duration-150 shrink-0 z-30 pointer-events-auto">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  className="w-6 h-6 rounded bg-background/90 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Options"
                >
                  <DotsThree size={14} weight="bold" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="table-dark-menu z-50 animate-fade-in">
                  <DropdownMenu.Item 
                    className="table-dark-menu-item"
                    onClick={handleDuplicate}
                  >
                    <div className="flex items-center gap-2">
                      <Copy size={14} />
                      <span>Duplicate block</span>
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="table-dark-menu-separator" />
                  <DropdownMenu.Item 
                    className="table-dark-menu-item text-red-400 hover:text-red-300"
                    onClick={handleDelete}
                  >
                    <div className="flex items-center gap-2">
                      <Trash size={14} />
                      <span>Delete block</span>
                    </div>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Line Numbers Gutter */}
          <div 
            className="line-numbers-gutter select-none text-right pr-4 mr-4 border-r border-border/40 text-muted-foreground/30 font-mono text-xs flex flex-col pt-0.5 leading-6 align-middle shrink-0" 
            contentEditable="false"
          >
            {lines.map((_, i) => (
              <div key={`line-${i}`} className="h-6 leading-6 select-none font-semibold text-[11px] font-mono">
                {i + 1}
              </div>
            ))}
          </div>
          
          {/* Editable Code Content */}
          <pre className="flex-1 m-0 p-0 bg-transparent overflow-x-auto select-text">
            <NodeViewContent 
              className="font-mono text-xs block leading-6 pt-0.5 focus:outline-none text-[#f4f4f5] dark:text-[#f4f4f5] whitespace-pre select-text" 
            />
          </pre>
        </NodeViewWrapper>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="table-dark-menu z-50 animate-fade-in">
          <ContextMenu.Item 
            className="table-dark-menu-item"
            onClick={handleDuplicate}
          >
            <div className="flex items-center gap-2">
              <Copy size={14} />
              <span>Duplicate block</span>
            </div>
          </ContextMenu.Item>
          <ContextMenu.Separator className="table-dark-menu-separator" />
          <ContextMenu.Item 
            className="table-dark-menu-item text-red-400 hover:text-red-300"
            onClick={handleDelete}
          >
            <div className="flex items-center gap-2">
              <Trash size={14} />
              <span>Delete block</span>
            </div>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

CodeBlockView.displayName = 'CodeBlockView';
