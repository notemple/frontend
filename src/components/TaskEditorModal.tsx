import React, { useState } from "react";
import { X, CaretDown, Check, Circle, Clock, CheckCircle, CalendarBlank, Flag } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { NotempleEditor } from "./editor/NotempleEditor";
import { useTaskStore } from "@/src/store/taskStore";
import { cn } from "@/src/lib/utils";
import { CustomDatePicker } from "./TasksPage";

export const TaskEditorModal = ({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) => {
  const { tasks, updateTask } = useTaskStore();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const task = tasks.find((t) => t?.id === taskId);
  const currentStatus = task?.status || 'open';

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
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col overflow-hidden relative"
          >
            <div className="w-full flex items-center justify-between p-4 border-b border-border font-bold text-sm text-foreground bg-muted relative z-20">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="truncate text-muted-foreground font-semibold">
                  {task?.title || "Edit Task"}
                </span>

                {task && (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer select-none transition-all shadow-sm active:scale-95",
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
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowStatusDropdown(false)} 
                        />
                        <div className="absolute left-0 mt-1.5 z-50 bg-background rounded-lg border border-border py-1 min-w-[130px] shadow-xl neu-panel flex flex-col">
                          {(['open', 'in progress', 'done'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer w-full text-left",
                                currentStatus === status && "bg-muted font-bold"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={statusConfig[status].textColor}>
                                  {statusConfig[status].icon}
                                </span>
                                <span>{statusConfig[status].label}</span>
                              </div>
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
              </div>

              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {task && (
              <div className="w-full flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20 text-xs gap-4 relative z-10 flex-wrap font-sans">
                <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                  <Clock size={14} className="text-muted-foreground/60" />
                  <span>Created:</span>
                  <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded border border-border/80 shadow-inner">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Unknown'}
                  </span>
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
              <NotempleEditor documentId={`task-${taskId}`} isDailyNote />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
