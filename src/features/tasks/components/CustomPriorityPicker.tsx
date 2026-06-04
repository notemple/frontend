import { cn } from "@/shared/lib/utils";
import { Flag } from "@phosphor-icons/react";
import { AnimatePresence,motion } from "motion/react";
import React,{ useEffect,useRef,useState } from "react";

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    color: "bg-slate-100/80 hover:bg-slate-200 text-slate-700 hover:text-slate-800 border-slate-200 hover:border-slate-300 dark:bg-slate-500/10 dark:hover:bg-slate-500/20 dark:text-slate-400 dark:hover:text-slate-300 dark:border-slate-500/20 dark:hover:border-slate-500/30",
    iconColor: "text-slate-500",
  },
  {
    value: "medium",
    label: "Medium",
    color: "bg-amber-100/80 hover:bg-amber-200 text-amber-800 hover:text-amber-900 border-amber-200 hover:border-amber-300 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:hover:text-amber-200 dark:border-amber-500/20 dark:hover:border-amber-500/30",
    iconColor: "text-amber-500",
  },
  {
    value: "urgent",
    label: "Urgent",
    color: "bg-rose-100/80 hover:bg-rose-200 text-rose-800 hover:text-rose-900 border-rose-200 hover:border-rose-300 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:hover:text-rose-300 dark:border-rose-500/20 dark:hover:border-rose-500/30",
    iconColor: "text-rose-500",
  },
] as const;

export const CustomPriorityPicker = ({
  priority,
  onChange,
  onOpenChange,
  small,
}: {
  priority?: "low" | "medium" | "urgent";
  onChange: (val: "low" | "medium" | "urgent" | undefined) => void;
  onOpenChange?: (isOpen: boolean) => void;
  small?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onOpenChangeRef.current?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const currentOption = priority ? PRIORITY_OPTIONS.find((o) => o.value === priority) : null;

  return (
    <div className="relative font-sans animate-none flex-shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "flex items-center gap-1 font-semibold rounded-sm border transition-all duration-150 hover:opacity-90 shadow-sm-sm cursor-pointer",
          small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
          currentOption
            ? currentOption.color
            : "bg-muted/40 hover:bg-muted text-muted-foreground/60 border-border hover:border-muted-foreground/30",
        )}
      >
        <Flag size={small ? 10 : 12} weight={currentOption ? "fill" : "bold"} className={currentOption?.iconColor} />
        <span>{currentOption ? currentOption.label : "Priority"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full right-0 mt-1.5 w-32 bg-background border border-border rounded-sm-sm shadow-sm-sm p-1 z-[60] flex flex-col gap-0.5 origin-top-right font-sans"
          >
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = option.value === priority;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 w-full text-xs font-semibold px-3 py-2 rounded-sm-sm text-left transition-colors cursor-pointer",
                    isSelected
                      ? option.color
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(isSelected ? undefined : option.value);
                    setIsOpen(false);
                    onOpenChange?.(false);
                  }}
                >
                  <Flag size={14} weight={isSelected ? "fill" : "regular"} className={option.iconColor} />
                  {option.label}
                </button>
              );
            })}
            {priority && (
              <button
                type="button"
                className="flex items-center gap-2 w-full text-[11px] font-semibold px-3 py-1.5 text-rose-500/85 hover:bg-rose-500/10 hover:text-rose-600 rounded-sm-sm text-left transition-colors cursor-pointer mt-0.5 border-t border-border"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setIsOpen(false);
                  onOpenChange?.(false);
                }}
              >
                Clear Priority
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
