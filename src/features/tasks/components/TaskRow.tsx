import { CustomStatusPicker } from "../TasksPage";
import { CustomDatePicker } from "./CustomDatePicker";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore, type Task } from '../store';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash, CalendarBlank, Flag, CaretDown, CaretUp, Rows, GridFour, DotsSixVertical, ClipboardText, Clock, ArrowCircleRight, ListBullets } from '@phosphor-icons/react';

export const TaskRow = React.memo(({
  task,
  updateTask,
  deleteTask,
  onOpen,
  onDatePickerOpenChange,
}: {
  task: Task;
  updateTask: any;
  deleteTask: (id: string) => void;
  onOpen: () => void;
  onDatePickerOpenChange?: (isOpen: boolean) => void;
}) => {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between group relative bg-[var(--task-row-bg)] dark:bg-muted border border-[var(--task-row-border)] dark:border-border py-1.5 px-3 rounded-lg hover:bg-[var(--task-row-hover-bg)] dark:hover:bg-muted/80 hover:border-muted-foreground/30 transition-colors duration-150 shadow-none"
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-border group-hover:bg-muted-foreground group-hover:w-6 transition-all" />

      <div className="flex items-center gap-4 flex-1">
        <div
          className={cn(
            "w-5 h-5 rounded-md border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent",
          )}
          onClick={() => updateTask(task.id, { completed: !task.completed })}
        >
          {task.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 rounded-sm h-2 bg-emerald-500 dark:bg-emerald-400" />}
        </div>

        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "text-base font-sans transition-all bg-transparent border border-transparent hover:border-border/80 focus:border-border/80 focus:ring-1 focus:ring-border rounded-sm outline-none px-2 flex-1",
            task.completed
              ? "line-through text-muted-foreground/50"
              : "text-foreground font-medium",
          )}
        />

        <div className="flex items-center gap-2">
          {/* CustomDatePicker */}
<CustomDatePicker
            small
            value={task.startDate || ""}
            onChange={(v: string) => updateTask(task.id, { startDate: v })}
            placeholder="Start"
            icon={<CalendarBlank size={12} />}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* CustomDatePicker */}
<CustomDatePicker
            small
            value={task.deadline || ""}
            onChange={(v: string) => updateTask(task.id, { deadline: v })}
            placeholder="Deadline"
            icon={<Flag size={12} />}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* CustomStatusPicker */}
<CustomStatusPicker
            status={task.status || (task.completed ? "done" : "open")}
            onChange={(s: "open" | "in progress" | "done") => updateTask(task.id, { status: s })}
            onOpenChange={onDatePickerOpenChange}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 flex-shrink-0 group-hover:opacity-100 transition-opacity ml-4 pl-4 border-l border-border">
        <button
          onClick={() => deleteTask(task.id)}
          className="text-muted-foreground/60 hover:text-red-500 transition-colors flex items-center justify-center w-8 h-8 hover:bg-red-500/10"
        >
          <Trash size={16} />
        </button>
        <button
          onClick={onOpen}
          className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 hover:bg-muted"
        >
          <ArrowCircleRight size={16} />
        </button>
      </div>
    </motion.div>
  );
});
