import { toUtcString } from '@/shared/lib/time';
import { useMemo } from 'react';
import { getCalendarDays, changeZonedMonth, isSameMonthInTimezone, isSameDayInTimezone, getZonedDate } from '@/shared/lib/time';
import { MagnifyingGlass, CaretLeft, Target, CaretRight } from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';


import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskStore, type Task } from '../store';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash, CalendarBlank, Flag, CaretDown, CaretUp, Rows, GridFour, DotsSixVertical, ClipboardText, Clock, ArrowCircleRight, ListBullets } from '@phosphor-icons/react';

export const CustomDatePicker = ({
  value,
  onChange,
  placeholder,
  icon,
  small,
  onOpenChange,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  small?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { timezone, weekStartDay } = useSettingsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDayNames = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    return [...days.slice(weekStartDay), ...days.slice(0, weekStartDay)];
  };

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth);
  }, [currentMonth, weekStartDay]);

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

  const handleDayClick = (d: Date) => {
    onChange(toUtcString(d));
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const toggleOpen = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value ? formatDisplayDate(value) : "");
  }, [value, timezone, weekStartDay]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className={cn(
          small
            ? "flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border hover:bg-muted/80"
            : "flex items-center gap-1.5 text-sm font-medium hover:bg-muted px-2 py-1 rounded-sm transition-colors",
          !small && value
            ? "text-foreground"
            : !small
              ? "text-muted-foreground"
              : "",
        )}
      >
        {icon} {displayValue || (small ? "..." : placeholder)}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-sm-sm shadow-sm-sm p-4 z-50 flex flex-col gap-4 origin-top-left"
          >
            <div className="flex items-center gap-2 bg-muted border border-border rounded-sm-sm px-2 py-1.5 focus-within:border-accent transition-colors">
              <MagnifyingGlass size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Date"
                className="bg-transparent border-none outline-none text-sm w-full text-foreground"
              />
            </div>

            <button
              className="flex items-center gap-2 text-sm font-bold text-foreground hover:bg-muted px-2 py-1.5 rounded-sm-sm transition-colors"
              onClick={() => {
                onChange(toUtcString(new Date()));
                setIsOpen(false);
              }}
            >
              <CalendarBlank size={16} /> Today
            </button>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-sm">
                  {formatDisplayDate(currentMonth.toISOString(), "MMMM")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentMonth(changeZonedMonth(currentMonth, -1, timezone))
                    }
                    className="p-1 hover:bg-muted rounded-sm"
                  >
                    <CaretLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="p-1 hover:bg-muted rounded-sm"
                  >
                    <Target size={14} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(changeZonedMonth(currentMonth, 1, timezone))
                    }
                    className="p-1 hover:bg-muted rounded-sm"
                  >
                    <CaretRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
                {getDayNames().map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-sm font-medium">
                {calendarDays.map((d, i) => {
                  const isSelectedMonth = isSameMonthInTimezone(d, currentMonth, timezone);
                  const todayMatches = isSameDayInTimezone(d, new Date(), timezone);
                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(d)}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-sm-sm hover:bg-muted transition-colors mx-auto",
                        !isSelectedMonth
                          ? "text-muted-foreground/30"
                          : "text-foreground",
                        todayMatches
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "",
                      )}
                    >
                      {getZonedDate(d, timezone)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="text-sm font-bold text-left px-1 hover:text-foreground transition-colors"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
            >
              Clear Date
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
