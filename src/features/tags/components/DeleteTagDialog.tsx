import { WarningCircle,X } from '@phosphor-icons/react';
import { AnimatePresence,motion } from 'motion/react';

interface DeleteTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: string;
  onConfirm: () => void;
}

export const DeleteTagDialog = ({
  isOpen,
  onClose,
  tag,
  onConfirm
}: DeleteTagDialogProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-lg w-full max-w-sm shadow-2xl overflow-hidden font-sans flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-md">
                    <WarningCircle size={20} weight="fill" />
                  </div>
                  <h2 className="font-semibold text-base text-foreground tracking-tight">Delete Tag</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-muted/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to delete the tag <strong className="text-foreground">#{tag}</strong> globally? This will remove it from all documents.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-muted/10 shrink-0">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer bg-red-600 hover:bg-red-500 active:bg-red-700 text-white hover:shadow-red-500/20"
                >
                  Delete Tag
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
