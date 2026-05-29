import {
  formatDistanceToNow,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  subDays,
} from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useSettingsStore } from '@/features/settings/store';
import { useState, useEffect } from 'react';

// Get current timezone from store
export const getCurrentTimezone = (): string => {
  return useSettingsStore.getState().timezone;
};

// Convert Date object to UTC string (to simulate database timestamptz)
export const toUtcString = (date: Date): string => {
  return date.toISOString();
};

// Convert UTC string from DB back to a Date object in user's timezone
export const fromUtc = (utcString: string | null | undefined): Date | null => {
  if (!utcString) return null;
  const d = new Date(utcString);
  return isNaN(d.getTime()) ? null : d;
};

// Parse local simple date string ('2026-05-18') from date picker to UTC start of day in that timezone.
export const localDateStringToUtc = (dateString: string): string => {
  const { timezone } = useSettingsStore.getState();
  // Safe ISO parsing at midnight in selected timezone
  const d = toDate(`${dateString}T00:00:00`, { timeZone: timezone });
  return d.toISOString();
};

// Format UTC date string for display in specified timezone
export const formatDisplayDate = (dateString: string | null | undefined, customFormat?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const { timezone } = useSettingsStore.getState();
  const fmtStr = customFormat || 'MMM d';
  return formatInTimeZone(date, timezone, fmtStr);
};

// Format UTC date-time string for display
export const formatDisplayDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const { timezone, timeFormat } = useSettingsStore.getState();
  const timeFmt = timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return formatInTimeZone(date, timezone, `MMM d, ${timeFmt}`);
};

// Get relative time string
export const getRelativeTimeString = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return formatDistanceToNow(date, { addSuffix: true });
};

// Check if a task is due today in target timezone
export const isTaskDueToday = (deadlineUtc: string | null | undefined): boolean => {
  if (!deadlineUtc) return false;
  const date = new Date(deadlineUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned === todayStrZoned;
};

// Check if a task was created today in target timezone
export const isTaskCreatedToday = (createdAtUtc: string | null | undefined): boolean => {
  if (!createdAtUtc) return false;
  const date = new Date(createdAtUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned === todayStrZoned;
};

// Check if a task date is upcoming (strictly after zoned today)
export const isTaskUpcoming = (dateUtc: string | null | undefined): boolean => {
  if (!dateUtc) return false;
  const date = new Date(dateUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned > todayStrZoned;
};

// Check if a task's deadline is overdue (strictly before zoned today)
export const isTaskOverdue = (deadlineUtc: string | null | undefined): boolean => {
  if (!deadlineUtc) return false;
  const date = new Date(deadlineUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned < todayStrZoned;
};


// Check if a UTC date string matches a target zoned date ID ('yyyy-MM-dd')
export const isSameDayString = (dateUtc: string | null | undefined, targetDateId: string): boolean => {
  if (!dateUtc) return false;
  const date = new Date(dateUtc);
  if (isNaN(date.getTime())) return false;
  const { timezone } = useSettingsStore.getState();
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd') === targetDateId;
};

// Timezone-safe comparison for day/month highlight
export const isSameDayInTimezone = (dateA: Date, dateB: Date, timezone: string): boolean => {
  return formatInTimeZone(dateA, timezone, 'yyyy-MM-dd') === formatInTimeZone(dateB, timezone, 'yyyy-MM-dd');
};

export const isSameMonthInTimezone = (dateA: Date, dateB: Date, timezone: string): boolean => {
  return formatInTimeZone(dateA, timezone, 'yyyy-MM') === formatInTimeZone(dateB, timezone, 'yyyy-MM');
};

// Get zoned calendar components
export const getZonedYear = (date: Date, timezone: string): number => {
  return parseInt(formatInTimeZone(date, timezone, 'yyyy'), 10);
};

export const getZonedMonth = (date: Date, timezone: string): number => {
  return parseInt(formatInTimeZone(date, timezone, 'M'), 10) - 1; // 0-indexed
};

export const getZonedDate = (date: Date, timezone: string): number => {
  return parseInt(formatInTimeZone(date, timezone, 'd'), 10);
};

// Timezone-safe setters
export const setZonedMonth = (date: Date, monthIndex: number, timezone: string): Date => {
  const year = getZonedYear(date, timezone);
  const day = getZonedDate(date, timezone);
  const hh = formatInTimeZone(date, timezone, 'HH');
  const mm = formatInTimeZone(date, timezone, 'mm');
  const ss = formatInTimeZone(date, timezone, 'ss');

  const isoStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hh}:${mm}:${ss}`;
  return toDate(isoStr, { timeZone: timezone });
};

export const setZonedYear = (date: Date, year: number, timezone: string): Date => {
  const month = getZonedMonth(date, timezone);
  const day = getZonedDate(date, timezone);
  const hh = formatInTimeZone(date, timezone, 'HH');
  const mm = formatInTimeZone(date, timezone, 'mm');
  const ss = formatInTimeZone(date, timezone, 'ss');

  const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hh}:${mm}:${ss}`;
  return toDate(isoStr, { timeZone: timezone });
};

// Safely navigate months in a timezone without day overflow (e.g. Jan 31 -> Feb 28)
export const changeZonedMonth = (date: Date, offset: number, timezone: string): Date => {
  const currentMonth = getZonedMonth(date, timezone);
  let targetMonth = currentMonth + offset;
  let targetYear = getZonedYear(date, timezone);

  while (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }
  while (targetMonth > 11) {
    targetMonth -= 12;
    targetYear += 1;
  }

  // Cap at 28 days to prevent monthly offset overflow bugs during quick prev/next clicks
  const day = Math.min(getZonedDate(date, timezone), 28);
  const hh = formatInTimeZone(date, timezone, 'HH');
  const mm = formatInTimeZone(date, timezone, 'mm');
  const ss = formatInTimeZone(date, timezone, 'ss');

  const isoStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hh}:${mm}:${ss}`;
  return toDate(isoStr, { timeZone: timezone });
};

// Timezone-safe addition/subtraction of days
export const addDaysInTimezone = (date: Date, amount: number, timezone: string): Date => {
  const year = getZonedYear(date, timezone);
  const month = getZonedMonth(date, timezone);
  const day = getZonedDate(date, timezone);
  const hh = formatInTimeZone(date, timezone, 'HH');
  const mm = formatInTimeZone(date, timezone, 'mm');
  const ss = formatInTimeZone(date, timezone, 'ss');

  // Convert to local moment to perform calendar operations safely
  const localDate = new Date(year, month, day);
  const adjustedLocal = amount > 0 ? addDays(localDate, amount) : subDays(localDate, Math.abs(amount));

  // Convert back to zoned date
  const targetYear = adjustedLocal.getFullYear();
  const targetMonth = adjustedLocal.getMonth();
  const targetDay = adjustedLocal.getDate();

  const isoStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T${hh}:${mm}:${ss}`;
  return toDate(isoStr, { timeZone: timezone });
};

// Construct midnight start of a specific year/month/day in the target timezone
export const getMonthDateInTimezone = (year: number, monthIndex: number, timezone: string): Date => {
  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01T00:00:00`;
  return toDate(monthStr, { timeZone: timezone });
};

// Hydration guard hook to prevent timezone/locale mismatches under pre-renders or SSG/SSR
export const useIsMounted = (): boolean => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
};

// Get the 42 days grid for calendar in target timezone
export const getCalendarDays = (currentMonthObj: Date): Date[] => {
  const { timezone, weekStartDay } = useSettingsStore.getState();

  // Get midnight start of 1st of the month in the target timezone
  const monthStartStr = formatInTimeZone(currentMonthObj, timezone, "yyyy-MM-01'T'00:00:00");
  const monthStartDate = toDate(monthStartStr, { timeZone: timezone });

  // Get start of week in user's selected week start setting
  const start = startOfWeek(monthStartDate, { weekStartsOn: weekStartDay });

  // Add 41 days to form a perfect 6-week grid (42 days)
  const end = addDays(start, 41);

  return eachDayOfInterval({ start, end });
};
