import React from "react";
import { CaretLeft, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { NotempleEditor } from "./editor/NotempleEditor";
import { useTaskStore } from "@/src/store/taskStore";

export const TaskEditorModal = ({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) => {
  const { tasks } = useTaskStore();

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
            <div className="w-full flex items-center justify-between p-4 border-b border-border font-bold text-sm text-foreground bg-muted">
              <span className="truncate text-muted-foreground">
                {tasks.find((t) => t?.id === taskId)?.title || "Edit Task"}
              </span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 w-full overflow-y-auto">
              <NotempleEditor documentId={`task-${taskId}`} isDailyNote />
            </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
