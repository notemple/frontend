
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore, type Task } from '../store';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomPriorityPicker } from './CustomPriorityPicker';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash, CalendarBlank, Flag, CaretDown, CaretUp, Rows, GridFour, DotsSixVertical, ClipboardText, Clock, ArrowCircleRight, ListBullets, Play, Pause, Stop } from '@phosphor-icons/react';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';

export const KanbanCard = ({
  task,
  updateTask,
  deleteTask,
  onOpen,
  onDatePickerOpenChange,
  isDatePickerOpen,
  isOverlay = false,
}: {
  task: Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  onOpen: () => void;
  onDatePickerOpenChange: (isOpen: boolean) => void;
  isDatePickerOpen: boolean;
  isOverlay?: boolean;
}) => {
  const timer = useTaskTimerStore(state => state.timers[task.id]) || { taskId: task.id, seconds: 0, isRunning: false };
  const startTimer = useTaskTimerStore(state => state.startTimer);
  const pauseTimer = useTaskTimerStore(state => state.pauseTimer);
  const stopTimer = useTaskTimerStore(state => state.stopTimer);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isOverlay,
  });

  const style = transform && !isOverlay
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.3 : undefined,
      }
    : undefined;

  const [localTitle, setLocalTitle] = useState(task.title);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleBlur = () => {
    if (localTitle !== task.title) {
      updateTask(task.id, { title: localTitle });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        zIndex: isDatePickerOpen ? 150 : style?.zIndex,
      }}
      className={cn(
        "bg-card border border-card-border shadow-sm-sm rounded-sm-sm p-3 flex flex-col gap-3 transition-all relative group/card font-sans",
        isOverlay && "shadow-sm-none border-purple-500/30 bg-card rotate-[2deg] scale-[1.02] cursor-grabbing",
        !isOverlay && isDragging && "shadow-sm-none ring-2 ring-purple-500/20 border-purple-500/30 cursor-grabbing opacity-30",
        !isOverlay && !isDragging && "hover:shadow-sm-sm hover:border-muted-foreground/20 cursor-grab"
      )}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Clickable Status Checkbox */}
        <div
          className={cn(
            "w-4 h-4 mt-0.5 rounded-sm border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-sm-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent",
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            updateTask(task.id, { completed: !task.completed });
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-1.5 rounded-sm-sm h-1.5 bg-emerald-500 dark:bg-emerald-400"
            />
          )}
        </div>

        {/* Editable Title Input */}
        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "text-xs font-sans font-semibold transition-all bg-transparent border border-transparent hover:border-border/80 focus:border-border/80 focus:ring-1 focus:ring-border rounded-sm-sm outline-none px-1 flex-1 min-w-0 py-0",
            task.completed
              ? "line-through text-muted-foreground/50"
              : "text-foreground font-medium",
          )}
        />
        
        {/* Drag Handle & Drag Indicators */}
        <div className="text-muted-foreground/30 group-hover/card:text-muted-foreground/60 transition-colors flex items-center shrink-0">
          <DotsSixVertical size={14} weight="bold" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 w-full pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5 min-w-0" onPointerDown={(e) => e.stopPropagation()}>
          <CustomDatePicker
            small
            value={task.startDate || ""}
            onChange={(v: string) => updateTask(task.id, { startDate: v })}
            placeholder="Start"
            icon={<CalendarBlank size={10} />}
            onOpenChange={onDatePickerOpenChange}
          />

          <CustomDatePicker
            small
            value={task.deadline || ""}
            onChange={(v: string) => updateTask(task.id, { deadline: v })}
            placeholder="Deadline"
            icon={<Flag size={10} />}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* Time spent beside the date */}
          {timer.seconds >= 60 && (
            <span className="inline-flex items-center gap-1 px-1 py-0.5 text-[9px] font-mono font-semibold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Clock size={10} />
              {(() => {
                const hrs = Math.floor(timer.seconds / 3600);
                const mins = Math.floor((timer.seconds % 3600) / 60);
                if (hrs > 0) {
                  return `${hrs}h ${mins}m`;
                }
                return `${mins}m`;
              })()}
            </span>
          )}

          <CustomPriorityPicker
            small
            priority={task.priority}
            onChange={(p: "low" | "medium" | "urgent" | undefined) => updateTask(task.id, { priority: p })}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* Task Timer Widget */}
          <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-border/40 shrink-0">
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
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); pauseTimer(task.id); }}
                className="p-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Pause stopwatch"
              >
                <Pause size={10} weight="bold" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); startTimer(task.id); }}
                className="p-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Start stopwatch"
              >
                <Play size={10} weight="fill" />
              </button>
            )}
            
            {timer.seconds > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); stopTimer(task.id); }}
                className="p-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Stop & Reset"
              >
                <Stop size={10} weight="fill" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0 pl-1" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTask(task.id);
            }}
            className="text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center justify-center w-6 h-6 hover:bg-red-500/10 rounded-sm-sm cursor-pointer"
          >
            <Trash size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-6 h-6 hover:bg-muted rounded-sm-sm cursor-pointer"
          >
            <ArrowCircleRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
