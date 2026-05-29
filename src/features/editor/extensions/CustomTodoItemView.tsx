import React, { useRef } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { 
  Calendar, 
  Flag, 
  DotsThree,
  Check,
  Trash,
  Copy,
  Plus
} from '@phosphor-icons/react';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { CustomDatePicker } from '@/features/tasks/components/CustomDatePicker';

export const CustomTodoItemView: React.FC<NodeViewProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode,
  getPos,
  editor
}) => {
  const { checked, priority = 'none', dueDate = null } = node.attrs;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateAttributes({ checked: !checked });
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priorities: ('none' | 'low' | 'medium' | 'high')[] = ['none', 'low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    updateAttributes({ priority: priorities[nextIndex] });
  };

  const handleDuplicate = () => {
    if (typeof getPos === 'function' && typeof editor.commands.insertContentAt === 'function') {
      const pos = getPos();
      editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
    } else if (typeof editor.commands.insertContent === 'function') {
      editor.chain().focus().insertContent(node.toJSON()).run();
    }
  };

  const handleDelete = () => {
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    } else {
      deleteNode();
    }
  };

  const priorityColors = {
    none: 'text-muted-foreground/40 hover:text-muted-foreground/75 border-transparent bg-transparent',
    low: 'text-blue-500 border-blue-200/50 bg-blue-100/10 dark:bg-blue-900/15 hover:bg-blue-100/25',
    medium: 'text-amber-500 border-amber-200/50 bg-amber-100/10 dark:bg-amber-900/15 hover:bg-amber-100/25',
    high: 'text-red-500 border-red-200/50 bg-red-100/10 dark:bg-red-900/15 hover:bg-red-100/25',
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <NodeViewWrapper className="flex flex-col gap-1 w-full py-1 px-1 rounded-sm transition-all duration-150 group/todo relative hover:bg-muted/10">
          
          <div className="flex items-start gap-3 w-full relative">
            {/* Left Circular Checkbox */}
            <div 
              onClick={handleCheckboxClick}
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer mt-1 select-none transition-all duration-150 active:scale-90",
                checked 
                  ? "bg-blush-pop border-blush-pop shadow-sm-sm" 
                  : "border-muted-foreground/30 hover:border-blush-pop bg-card-bg"
              )}
            >
              {checked && <Check size={10} weight="bold" className="text-white" />}
            </div>

            {/* Middle Editable Text Component */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <NodeViewContent 
                className={cn(
                  "outline-none text-[14px] text-foreground min-w-0 prose-p:my-0 flex-1 leading-normal",
                  checked && "text-muted-foreground/50 line-through transition-colors duration-150"
                )} 
              />

              {/* Bottom Metadata Pill row */}
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5 select-none font-sans text-[10px]">
                
                {/* Due Date Trigger Pill */}
                <CustomDatePicker
                  value={dueDate || ''}
                  onChange={(val) => updateAttributes({ dueDate: val ? val : null })}
                  placeholder="Set Date"
                  icon={<Calendar size={11} />}
                  small={true}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-sm border cursor-pointer font-medium transition-all duration-150",
                    dueDate 
                      ? "bg-purple-100/20 border-purple-200/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100/30" 
                      : "bg-transparent border-border/80 text-muted-foreground/60 hover:border-muted-foreground/30 hover:text-foreground"
                  )}
                />

                {/* Priority Trigger Pill */}
                <div 
                  onClick={cyclePriority}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-sm border cursor-pointer font-medium transition-all duration-150",
                    priorityColors[priority as keyof typeof priorityColors]
                  )}
                  title={`Priority: ${priority}`}
                >
                  <Flag size={11} weight={priority !== 'none' ? 'fill' : 'bold'} />
                  {priority !== 'none' && <span className="capitalize">{priority}</span>}
                </div>


              </div>
            </div>

            {/* Hover Option Dropdown Trigger button */}
            <div className="opacity-0 group-hover/todo:opacity-100 absolute right-2 top-0.5 transition-all duration-150 shrink-0 z-30">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    className="w-6 h-6 rounded bg-card-bg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm-sm cursor-pointer active:scale-95 transition-transform"
                    title="Todo Actions"
                  >
                    <DotsThree size={14} weight="bold" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="table-dark-menu z-50 animate-fade-in">
                    <DropdownMenu.Item 
                      className="table-dark-menu-item"
                      onClick={() => updateAttributes({ checked: !checked })}
                    >
                      <div className="flex items-center gap-2">
                        <Check size={14} />
                        <span>{checked ? 'Mark Uncompleted' : 'Mark Completed'}</span>
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      className="table-dark-menu-item"
                      onClick={handleDuplicate}
                    >
                      <div className="flex items-center gap-2">
                        <Copy size={14} />
                        <span>Duplicate Todo</span>
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="table-dark-menu-separator" />
                    <DropdownMenu.Item 
                      className="table-dark-menu-item text-red-400 hover:text-red-300"
                      onClick={handleDelete}
                    >
                      <div className="flex items-center gap-2">
                        <Trash size={14} />
                        <span>Delete Todo</span>
                      </div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
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
              <span>Duplicate Todo</span>
            </div>
          </ContextMenu.Item>
          <ContextMenu.Separator className="table-dark-menu-separator" />
          <ContextMenu.Item 
            className="table-dark-menu-item text-red-400 hover:text-red-300"
            onClick={handleDelete}
          >
            <div className="flex items-center gap-2">
              <Trash size={14} />
              <span>Delete Todo</span>
            </div>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
