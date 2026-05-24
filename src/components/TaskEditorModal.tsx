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
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-2xl w-full max-w-2xl h-[70vh] shadow-2xl flex flex-col overflow-hidden relative"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
