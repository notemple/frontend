import { toUtcString } from '@/shared/lib/time';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as Popover from '@radix-ui/react-popover';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { getCalendarDays, changeZonedMonth, isSameMonthInTimezone, isSameDayInTimezone, getZonedDate } from '@/shared/lib/time';
import { MagnifyingGlass, CaretLeft, Target, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';
import { useShallow } from 'zustand/react/shallow';
import { formatDisplayDate } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';

export const CustomDatePicker = React.memo(({
  value,
  onChange,
  placeholder,
  icon,
  small,
  onOpenChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  small?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { timezone, weekStartDay } = useSettingsStore(
    useShallow((state) => ({
      timezone: state.timezone,
      weekStartDay: state.weekStartDay,
    }))
  );
  
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const getDayNames = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    return [...days.slice(weekStartDay), ...days.slice(0, weekStartDay)];
  };

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth);
  }, [currentMonth, weekStartDay]);

  // Floating UI for precise, compositor-thread transform-based positioning
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 })
    ]
  });

  const handleDayClick = useCallback((d: Date) => {
    onChange(toUtcString(d));
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onChange, onOpenChange]);

  const handleTodayClick = useCallback(() => {
    onChange(toUtcString(new Date()));
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onChange, onOpenChange]);

  const handleClear = useCallback(() => {
    onChange("");
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onChange, onOpenChange]);

  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value ? formatDisplayDate(value) : "");
  }, [value, timezone, weekStartDay]);

  const handlePrevMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => changeZonedMonth(prev, -1, timezone));
  }, [timezone]);

  const handleNextMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(prev => changeZonedMonth(prev, 1, timezone));
  }, [timezone]);

  const handleCurrentMonthReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date());
  }, []);

  // Stop events from propagation to prevent dnd-kit or parent components from intercepting click/drags
  const handlePropagationStop = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Popover.Root open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      onOpenChange?.(open);
    }}>
      <Popover.Trigger asChild>
        <button
          ref={refs.setReference}
          type="button"
          onMouseDown={handlePropagationStop}
          onPointerDown={handlePropagationStop}
          onClick={handlePropagationStop}
          className={cn(
            small
              ? "flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border hover:bg-muted/80 cursor-pointer"
              : "flex items-center gap-1.5 text-sm font-medium hover:bg-muted px-2 py-1 rounded-sm transition-colors cursor-pointer",
            !small && value
              ? "text-foreground"
              : !small
                ? "text-muted-foreground"
                : "",
            className
          )}
        >
          {icon} {displayValue || (small ? "..." : placeholder)}
        </button>
      </Popover.Trigger>

      {isOpen && createPortal(
        <Popover.Portal forceMount>
          <Popover.Content
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 99999,
              pointerEvents: 'auto',
            }}
            onMouseDown={handlePropagationStop}
            onPointerDown={handlePropagationStop}
            className="w-64 bg-background border border-border rounded-sm p-4 flex flex-col gap-4 shadow-sm focus:outline-none z-[99999]"
          >
            <div 
              className="flex items-center gap-2 bg-muted border border-border rounded-sm px-2 py-1.5 focus-within:border-accent transition-colors"
              onMouseDown={handlePropagationStop}
              onPointerDown={handlePropagationStop}
            >
              <MagnifyingGlass size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Date"
                className="bg-transparent border-none outline-none text-sm w-full text-foreground"
                onMouseDown={handlePropagationStop}
                onPointerDown={handlePropagationStop}
              />
            </div>

            <button
              type="button"
              className="flex items-center gap-2 text-sm font-bold text-foreground hover:bg-muted px-2 py-1.5 rounded-sm transition-colors text-left w-full cursor-pointer"
              onClick={handleTodayClick}
              onMouseDown={handlePropagationStop}
              onPointerDown={handlePropagationStop}
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
                    type="button"
                    onClick={handlePrevMonth}
                    onMouseDown={handlePropagationStop}
                    onPointerDown={handlePropagationStop}
                    className="p-1 hover:bg-muted rounded-sm cursor-pointer text-foreground"
                  >
                    <CaretLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCurrentMonthReset}
                    onMouseDown={handlePropagationStop}
                    onPointerDown={handlePropagationStop}
                    className="p-1 hover:bg-muted rounded-sm cursor-pointer text-foreground"
                  >
                    <Target size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    onMouseDown={handlePropagationStop}
                    onPointerDown={handlePropagationStop}
                    className="p-1 hover:bg-muted rounded-sm cursor-pointer text-foreground"
                  >
                    <CaretRight size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
                {getDayNames().map((d, i) => (
                  <div key={`dayname-${i}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-sm font-medium">
                {calendarDays.map((d) => {
                  const isSelectedMonth = isSameMonthInTimezone(d, currentMonth, timezone);
                  const todayMatches = isSameDayInTimezone(d, new Date(), timezone);
                  const stableKey = `day-${d.getTime()}`; // Stable key
                  return (
                    <button
                      type="button"
                      key={stableKey}
                      onClick={() => handleDayClick(d)}
                      onMouseDown={handlePropagationStop}
                      onPointerDown={handlePropagationStop}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-sm hover:bg-muted transition-colors mx-auto cursor-pointer",
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
              type="button"
              className="text-sm font-bold text-left px-1 hover:text-foreground transition-colors cursor-pointer w-full text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              onMouseDown={handlePropagationStop}
              onPointerDown={handlePropagationStop}
            >
              Clear Date
            </button>
          </Popover.Content>
        </Popover.Portal>,
        document.body
      )}
    </Popover.Root>
  );
});
CustomDatePicker.displayName = "CustomDatePicker";

