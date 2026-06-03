
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TaskTitleInput } from './TaskTitleInput';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore, type Task } from '../store';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomPriorityPicker } from './CustomPriorityPicker';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash, CalendarBlank, Flag, CaretDown, CaretUp, Rows, GridFour, DotsSixVertical, ClipboardText, Clock, ArrowCircleRight, ListBullets } from '@phosphor-icons/react';

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

        <TaskTitleInput
          value={localTitle}
          onChange={setLocalTitle}
          onBlur={handleBlur}
          isCompleted={task.completed}
          className="text-xs font-semibold py-0.5 px-1"
        />
        
        {/* Drag Handle & Drag Indicators */}
        <div className="text-muted-foreground/30 group-hover/card:text-muted-foreground/60 transition-colors flex items-center shrink-0">
          <DotsSixVertical size={14} weight="bold" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 w-full pt-1.5 border-t border-border/25">
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

          <CustomPriorityPicker
            small
            priority={task.priority}
            onChange={(p: "low" | "medium" | "urgent" | undefined) => updateTask(task.id, { priority: p })}
            onOpenChange={onDatePickerOpenChange}
          />
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
