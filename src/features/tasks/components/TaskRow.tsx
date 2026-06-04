import { CustomStatusPicker } from "../TasksPage";
import { CustomDatePicker } from "./CustomDatePicker";
import { CustomPriorityPicker } from "./CustomPriorityPicker";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TaskTitleInput } from './TaskTitleInput';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore, type Task } from '../store';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash, CalendarBlank, Flag, CaretDown, CaretUp, Rows, GridFour, DotsSixVertical, ClipboardText, Clock, ArrowCircleRight, ListBullets, Play, Pause, Stop } from '@phosphor-icons/react';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';

export const TaskRow = React.memo(({
  task,
  updateTask,
  deleteTask,
  onOpen,
  onDatePickerOpenChange,
  isSmallView = false,
}: {
  task: Task;
  updateTask: any;
  deleteTask: (id: string) => void;
  onOpen: () => void;
  onDatePickerOpenChange?: (isOpen: boolean) => void;
  isSmallView?: boolean;
}) => {
  const [localTitle, setLocalTitle] = useState(task.title);
  
  const timer = useTaskTimerStore(state => state.timers[task.id]) || { taskId: task.id, seconds: 0, isRunning: false };
  const startTimer = useTaskTimerStore(state => state.startTimer);
  const pauseTimer = useTaskTimerStore(state => state.pauseTimer);
  const stopTimer = useTaskTimerStore(state => state.stopTimer);

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
      data-onboarding-task-row="true"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between group relative bg-[var(--task-row-bg)] dark:bg-muted border border-[var(--task-row-border)] dark:border-border py-1.5 px-3 rounded-sm-sm hover:bg-[var(--task-row-hover-bg)] dark:hover:bg-muted/80 hover:border-muted-foreground/30 transition-colors duration-150 shadow-sm-none"
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-border group-hover:bg-muted-foreground group-hover:w-6 transition-all" />

      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "w-5 h-5 rounded-sm-sm border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm-sm",
            task.completed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-sm-inner"
              : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-transparent",
          )}
          onClick={() => updateTask(task.id, { completed: !task.completed })}
        >
          {task.completed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 rounded-sm-sm h-2 bg-emerald-500 dark:bg-emerald-400" />}
        </div>

        <TaskTitleInput
          value={localTitle}
          onChange={setLocalTitle}
          onBlur={handleBlur}
          isCompleted={task.completed}
          isSmallView={isSmallView}
          className="text-base font-medium"
        />

        <div className="flex items-center gap-2">
          {/* Date Pickers container: hidden in small views */}
          {!isSmallView && (
            <>
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
            </>
          )}

          {/* Time spent beside the date */}
          {timer.seconds >= 60 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm-sm shrink-0">
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

          {/* CustomStatusPicker */}
          <CustomStatusPicker
            status={task.status || (task.completed ? "done" : "open")}
            onChange={(s: "open" | "in progress" | "done") => updateTask(task.id, { status: s })}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* CustomPriorityPicker */}
          <CustomPriorityPicker
            priority={task.priority}
            onChange={(p: "low" | "medium" | "urgent" | undefined) => updateTask(task.id, { priority: p })}
            onOpenChange={onDatePickerOpenChange}
          />

          {/* Task Timer Widget */}
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/60 shrink-0">
            {timer.seconds > 0 && (
              <span className="text-[11px] font-semibold font-mono text-muted-foreground/80 tracking-tight select-none">
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
                onClick={(e) => { e.stopPropagation(); pauseTimer(task.id); }}
                className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Pause stopwatch"
              >
                <Pause size={12} weight="bold" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); startTimer(task.id); }}
                disabled={task.completed || task.status === 'done'}
                data-onboarding-timer-play={task.id}
                className="p-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                title={task.completed || task.status === 'done' ? "Open task to start timer" : "Start stopwatch"}
              >
                <Play size={12} weight="fill" />
              </button>
            )}
            
            {timer.seconds > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); stopTimer(task.id); }}
                className="p-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Stop & Reset"
              >
                <Stop size={12} weight="fill" />
              </button>
            )}
          </div>
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
          data-onboarding-task-edit={task.id}
          className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center justify-center w-8 h-8 hover:bg-muted"
        >
          <ArrowCircleRight size={16} />
        </button>
      </div>
    </motion.div>
  );
});
