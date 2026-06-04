import React, { useState, useEffect } from "react";
import { TaskTitleInput } from "./TaskTitleInput";
import { X, CaretDown, Check, Circle, Clock, CheckCircle, CalendarBlank, Flag } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { TemplnoteEditor } from "@/features/editor/TemplnoteEditor";
import { useTaskStore } from "@/features/tasks/store";
import { useShallow } from 'zustand/react/shallow';
import { cn } from "@/shared/lib/utils";
import { CustomDatePicker } from "./CustomDatePicker";
import { CustomPriorityPicker } from "./CustomPriorityPicker";

export const TaskEditorModal = ({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const task = useTaskStore(
    useShallow((state) => state.tasks.find((t) => t?.id === taskId))
  );
  const updateTask = useTaskStore((state) => state.updateTask);
  const currentStatus = task?.status || 'open';

  const [localTitle, setLocalTitle] = useState(task?.title || "");

  useEffect(() => {
    if (task?.title) {
      setLocalTitle(task.title);
    }
  }, [task?.title]);

  const handleBlur = () => {
    if (task && localTitle !== task.title) {
      updateTask(task.id, { title: localTitle });
    }
  };

  const statusConfig = {
    open: {
      label: "Open",
      bg: "bg-sky-100/80 hover:bg-sky-200 text-sky-800 hover:text-sky-900 border-sky-200 hover:border-sky-300 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-300 dark:hover:text-sky-200 dark:border-sky-500/20 dark:hover:border-sky-500/30",
      textColor: "text-sky-800 dark:text-sky-300",
      icon: <Circle size={14} weight="bold" />
    },
    'in progress': {
      label: "In Progress",
      bg: "bg-amber-100/80 hover:bg-amber-200 text-amber-800 hover:text-amber-900 border-amber-200 hover:border-amber-300 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-200 dark:border-amber-500/20 dark:hover:border-amber-500/30",
      textColor: "text-amber-800 dark:text-amber-300",
      icon: <Clock size={14} weight="bold" />
    },
    done: {
      label: "Done",
      bg: "bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 hover:text-emerald-900 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 dark:hover:text-emerald-200 dark:border-emerald-500/20 dark:hover:border-emerald-500/30",
      textColor: "text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle size={14} weight="fill" />
    }
  };

  const handleStatusChange = (status: 'open' | 'in progress' | 'done') => {
    if (taskId) {
      updateTask(taskId, { status });
    }
    setShowStatusDropdown(false);
  };

  return (
    <AnimatePresence>
      {taskId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="onboarding-task-editor-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-sm-sm w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden relative"
          >
            <div className="w-full flex items-center justify-between p-4 border-b border-border font-bold text-sm text-foreground bg-muted relative z-20">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {task ? (
                  <TaskTitleInput
                    value={localTitle}
                    onChange={setLocalTitle}
                    onBlur={handleBlur}
                    isCompleted={task.completed}
                    className="text-sm font-semibold max-w-[360px] bg-transparent border-transparent"
                  />
                ) : (
                  <span className="truncate text-muted-foreground font-semibold">
                    Edit Task
                  </span>
                )}

                {task && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-sm-full text-xs font-semibold border cursor-pointer select-none transition-all shadow-sm-sm active:scale-95",
                        statusConfig[currentStatus].bg
                      )}
                    >
                      {statusConfig[currentStatus].icon}
                      <span>{statusConfig[currentStatus].label}</span>
                      <CaretDown size={12} weight="bold" className="opacity-60" />
                    </button>

                    {showStatusDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-30 bg-transparent"
                          onClick={() => setShowStatusDropdown(false)}
                        />
                        <div className="absolute left-0 mt-1.5 w-36 bg-background border border-border rounded-sm-sm shadow-sm-sm py-1 z-40 font-semibold text-xs text-foreground/80 flex flex-col gap-0.5 min-w-[120px] select-none">
                          {(['open', 'in progress', 'done'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{statusConfig[status].label}</span>
                              {currentStatus === status && (
                                <Check size={12} weight="bold" className="text-foreground shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {task && (
                  <CustomPriorityPicker
                    priority={task.priority}
                    onChange={(val) => updateTask(task.id, { priority: val })}
                  />
                )}
              </div>

              <button
                id="onboarding-task-editor-close"
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-sm-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {task && (
              <div className="w-full flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20 text-xs gap-4 relative z-10 flex-wrap font-sans">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                    <Clock size={14} className="text-muted-foreground/60" />
                    <span>Created:</span>
                    <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-sm border border-border/80 shadow-sm-inner">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown'}
                    </span>
                  </div>

                  {task.completedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>Completed:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20 shadow-sm-inner">
                        {new Date(task.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/80 font-medium">Start:</span>
                    <CustomDatePicker
                      small
                      value={task.startDate || ""}
                      onChange={(v: string) => updateTask(task.id, { startDate: v })}
                      placeholder="Start Date"
                      icon={<CalendarBlank size={12} />}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/80 font-medium">Deadline:</span>
                    <CustomDatePicker
                      small
                      value={task.deadline || ""}
                      onChange={(v: string) => updateTask(task.id, { deadline: v })}
                      placeholder="Deadline"
                      icon={<Flag size={12} />}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 w-full overflow-y-auto">
              <TemplnoteEditor documentId={`task-${taskId}`} isDailyNote />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
