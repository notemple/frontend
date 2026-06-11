import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'center' | 'slideout';
  className?: string;
  bodyClassName?: string;
  showCloseButton?: boolean;
  showBackdrop?: boolean;
}

export const PopupMenu: React.FC<PopupMenuProps> = ({
  isOpen,
  onClose,
  title,
  header,
  children,
  footer,
  variant = 'center',
  className,
  bodyClassName,
  showCloseButton = true,
  showBackdrop = true
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-[1000] flex font-sans select-none pointer-events-auto",
            variant === 'center' ? "items-center justify-center p-4" : "items-stretch justify-end"
          )}
        >
          {/* Backdrop shield - handles clicks on backdrop to close the modal */}
          {showBackdrop && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 bg-black/35 z-0 cursor-default"
              onClick={onClose}
            />
          )}

          {/* Popup card container */}
          <motion.div
            initial={variant === 'center' 
              ? { scale: 0.96, opacity: 0, y: 10 } 
              : { x: '100%', opacity: 0 }
            }
            animate={variant === 'center'
              ? { scale: 1, opacity: 1, y: 0 }
              : { x: 0, opacity: 1 }
            }
            exit={variant === 'center'
              ? { scale: 0.96, opacity: 0, y: 10 }
              : { x: '100%', opacity: 0 }
            }
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "bg-background border border-border shadow-sm-lg overflow-hidden z-10 flex flex-col relative",
              variant === 'center' 
                ? "rounded-lg w-full max-w-lg max-h-[85vh]"
                : "border-l h-full w-full max-w-xl shadow-sm-2xl",
              className
            )}
          >
            {header ?? (title || showCloseButton ? (
              <div className={cn(
                "flex items-center justify-between shrink-0",
                variant === 'center' 
                  ? "px-5 py-4 border-b border-border" 
                  : "px-5 py-4 border-b border-border bg-muted/10"
              )}>
                {title && <span className="text-sm font-semibold text-foreground/90">{title}</span>}
                {!title && <div />}
                {showCloseButton && (
                  <button 
                    onClick={onClose}
                    className={cn(
                      "text-muted-foreground hover:text-foreground rounded transition-all cursor-pointer",
                      variant === 'center' 
                        ? "p-1 hover:bg-muted/60" 
                        : "p-2 hover:bg-muted/80 border border-border"
                    )}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : null)}

            <div className={cn(
              "flex-1 overflow-y-auto no-scrollbar",
              variant === 'center' ? "p-5 space-y-4" : "p-6 space-y-5 bg-workspace",
              bodyClassName
            )}>
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/10 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
