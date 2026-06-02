import React, { useRef, useEffect } from 'react';
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
  Plus,
  CalendarBlank,
  Clock,
  CircleDashed,
  CheckCircle,
  Play,
  Pause,
  Stop
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';
import { CustomDatePicker } from '@/features/tasks/components/CustomDatePicker';
import { CustomPriorityPicker } from '@/features/tasks/components/CustomPriorityPicker';
import { CustomStatusPicker } from '@/features/tasks/TasksPage';
import { useTaskStore } from '@/features/tasks/store';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';

const countTaskOccurrences = (editor: any, id: string) => {
  if (!editor || !id) return 0;
  let count = 0;
  editor.state.doc.descendants((node: any) => {
    if ((node.type.name === 'taskItem' || node.type.name === 'task_item') && node.attrs.taskId === id) {
      count++;
    }
  });
  return count;
};

export const CustomTodoItemView: React.FC<NodeViewProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode,
  getPos,
  editor
}) => {
  const { 
    checked, 
    priority = 'none', 
    dueDate = null, 
    startDate = null, 
    status = 'open', 
    taskId = null 
  } = node.attrs;

  // Initialize and check if task exists in task store, otherwise create it
  useEffect(() => {
    // Proactively initialize store
    useTaskStore.getState().initialize();

    if (!taskId) {
      const newTaskId = `task-${crypto.randomUUID()}`;
      const todayStr = new Date().toLocaleDateString('sv-SE');
      updateAttributes({ taskId: newTaskId, startDate: todayStr });
      
      useTaskStore.getState().addTask({
        id: newTaskId,
        title: node.textContent || 'New Todo Task',
        completed: !!checked,
        status: status || (checked ? 'done' : 'open'),
        priority: priority === 'none' ? undefined : (priority as any),
        startDate: todayStr,
        deadline: dueDate || undefined,
        list: 'All Tasks'
      });
    } else {
      // Check for cloned or pasted nodes sharing the exact same taskId in the document
      const occurrences = countTaskOccurrences(editor, taskId);
      if (occurrences > 1) {
        const newTaskId = `task-${crypto.randomUUID()}`;
        updateAttributes({ taskId: newTaskId });
        
        useTaskStore.getState().addTask({
          id: newTaskId,
          title: node.textContent || 'Cloned Todo Task',
          completed: !!checked,
          status: status || (checked ? 'done' : 'open'),
          priority: priority === 'none' ? undefined : (priority as any),
          startDate: startDate || undefined,
          deadline: dueDate || undefined,
          list: 'All Tasks'
        });
      } else {
        const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
        if (!task) {
          useTaskStore.getState().addTask({
            id: taskId,
            title: node.textContent || 'New Todo Task',
            completed: !!checked,
            status: status || (checked ? 'done' : 'open'),
            priority: priority === 'none' ? undefined : (priority as any),
            startDate: startDate || undefined,
            deadline: dueDate || undefined,
            list: 'All Tasks'
          });
        }
      }
    }
  }, []);

  const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));

  // Timer subscription from the global task timer store
  const timer = useTaskTimerStore(state => taskId ? state.timers[taskId] : null) || { 
    taskId: taskId || '', 
    seconds: 0, 
    isRunning: false 
  };
  
  const startTimer = useTaskTimerStore(state => state.startTimer);
  const pauseTimer = useTaskTimerStore(state => state.pauseTimer);
  const stopTimer = useTaskTimerStore(state => state.stopTimer);

  // Debounced title sync from Tiptap node content to Task Store
  const prevTextRef = useRef(node.textContent);
  useEffect(() => {
    const text = node.textContent;
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;
    
    if (!taskId) return;

    const timeout = setTimeout(() => {
      useTaskStore.getState().updateTask(taskId, { title: text });
    }, 400);

    return () => clearTimeout(timeout);
  }, [node.textContent, taskId]);

  // Two-way sync: Update editor attributes if store task changes from task page
  useEffect(() => {
    if (!task) return;
    
    const updates: any = {};
    if (task.completed !== checked) {
      updates.checked = task.completed;
    }
    if (task.startDate !== startDate) {
      updates.startDate = task.startDate || null;
    }
    if (task.deadline !== dueDate) {
      updates.dueDate = task.deadline || null;
    }
    
    const mappedPriority = task.priority || 'none';
    if (mappedPriority !== priority) {
      updates.priority = mappedPriority;
    }
    
    const mappedStatus = task.status || (task.completed ? 'done' : 'open');
    if (mappedStatus !== status) {
      updates.status = mappedStatus;
    }

    if (Object.keys(updates).length > 0) {
      updateAttributes(updates);
    }
  }, [task, checked, startDate, dueDate, priority, status]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextChecked = !checked;
    updateAttributes({ 
      checked: nextChecked,
      status: nextChecked ? 'done' : 'open'
    });
    if (taskId) {
      useTaskStore.getState().updateTask(taskId, { 
        completed: nextChecked,
        status: nextChecked ? 'done' : 'open'
      });
    }
  };

  const handleDuplicate = () => {
    if (typeof getPos === 'function' && typeof editor.commands.insertContentAt === 'function') {
      const pos = getPos();
      const newTaskId = `task-${crypto.randomUUID()}`;
      
      useTaskStore.getState().addTask({
        id: newTaskId,
        title: node.textContent || '',
        completed: !!checked,
        status: status || (checked ? 'done' : 'open'),
        priority: priority === 'none' ? undefined : (priority as any),
        startDate: startDate || undefined,
        deadline: dueDate || undefined,
        list: 'All Tasks'
      });

      const duplicatedJson = node.toJSON();
      if (duplicatedJson.attrs) {
        duplicatedJson.attrs.taskId = newTaskId;
      }

      editor.chain().focus().insertContentAt(pos + node.nodeSize, duplicatedJson).run();
    }
  };

  const handleDelete = () => {
    if (taskId) {
      useTaskStore.getState().deleteTask(taskId);
    }
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    } else {
      deleteNode();
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <NodeViewWrapper className="flex flex-col gap-1 w-full py-1.5 px-2 rounded-sm transition-all duration-150 group/todo relative hover:bg-muted/10">
          
          <div className="flex items-start gap-3 w-full relative">
            {/* Left Circular Checkbox */}
            <div 
              onClick={handleCheckboxClick}
              className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer mt-1 select-none transition-all duration-150 active:scale-90",
                checked 
                  ? "bg-blush-pop border-blush-pop shadow-sm-sm animate-none" 
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

              {/* Bottom Metadata Picker Row */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1 select-none font-sans">
                
                {/* Start Date */}
                <CustomDatePicker
                  small
                  value={startDate || ""}
                  onChange={(val) => {
                    updateAttributes({ startDate: val || null });
                    if (taskId) {
                      useTaskStore.getState().updateTask(taskId, { startDate: val || undefined });
                    }
                  }}
                  placeholder="Start"
                  icon={<CalendarBlank size={11} />}
                />

                {/* Deadline (dueDate) */}
                <CustomDatePicker
                  small
                  value={dueDate || ""}
                  onChange={(val) => {
                    updateAttributes({ dueDate: val || null });
                    if (taskId) {
                      useTaskStore.getState().updateTask(taskId, { deadline: val || undefined });
                    }
                  }}
                  placeholder="Deadline"
                  icon={<Flag size={11} />}
                />

                {/* Status */}
                <CustomStatusPicker
                  status={(status as any) || (checked ? "done" : "open")}
                  onChange={(val) => {
                    updateAttributes({ 
                      status: val,
                      checked: val === "done"
                    });
                    if (taskId) {
                      useTaskStore.getState().updateTask(taskId, { 
                        status: val,
                        completed: val === "done"
                      });
                    }
                  }}
                />

                {/* Priority */}
                <CustomPriorityPicker
                  small
                  priority={priority === "none" ? undefined : (priority as any)}
                  onChange={(val) => {
                    updateAttributes({ priority: val || "none" });
                    if (taskId) {
                      useTaskStore.getState().updateTask(taskId, { priority: val || undefined });
                    }
                  }}
                />

                {/* Inline Stopwatch Task Timer Widget */}
                {taskId && (
                  <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-border/60 shrink-0 font-sans">
                    {timer.seconds > 0 && (
                      <span className="text-[10px] font-semibold font-mono text-muted-foreground/80 tracking-tight select-none">
                        {(() => {
                          const hrs = Math.floor(timer.seconds / 3600);
                          const mins = Math.floor((timer.seconds % 3600) / 60);
                          const secs = timer.seconds % 60;
                          const pad = (n: number) => n.toString().padStart(2, '0');
                          return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
                        })()}
                      </span>
                    )}
                    
                    {timer.isRunning ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); pauseTimer(taskId); }}
                        className="p-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                        title="Pause stopwatch"
                      >
                        <Pause size={10} weight="bold" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); startTimer(taskId); }}
                        disabled={task ? (task.status === 'done' || task.completed) : checked}
                        className="p-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                        title={task ? (task.status === 'done' || task.completed) ? "Open task to start timer" : "Start stopwatch" : checked ? "Open task to start timer" : "Start stopwatch"}
                      >
                        <Play size={10} weight="fill" />
                      </button>
                    )}
                    
                    {timer.seconds > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); stopTimer(taskId); }}
                        className="p-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                        title="Stop & Reset"
                      >
                        <Stop size={10} weight="fill" />
                      </button>
                    )}
                  </div>
                )}

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
                      onClick={() => {
                        const nextChecked = !checked;
                        updateAttributes({ 
                          checked: nextChecked,
                          status: nextChecked ? 'done' : 'open'
                        });
                        if (taskId) {
                          useTaskStore.getState().updateTask(taskId, { 
                            completed: nextChecked,
                            status: nextChecked ? 'done' : 'open'
                          });
                        }
                      }}
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
