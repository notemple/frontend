import { format, formatDistanceToNow, isSameDay, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useSettingsStore } from '../store/settingsStore';

export const getCurrentTimezone = () => {
  return useSettingsStore.getState().timezone;
};

// Convert local date/time to UTC string (to simulate database timestamptz)
export const toUtcString = (date: Date): string => {
  return date.toISOString();
};

// Convert UTC string from DB back to a Date object in user's timezone
export const fromUtc = (utcString: string | null | undefined): Date | null => {
  if (!utcString) return null;
  return new Date(utcString);
};

// Parse local simple date string ('2026-05-18') from date picker to UTC start of day in that timezone.
export const localDateStringToUtc = (dateString: string): string => {
  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);
  return d.toISOString(); // Assuming the input was meant to be midnight in the browser's timezone, this converts it to UTC representing that exact moment.
};

export const formatDisplayDate = (dateString: string | null | undefined, customFormat?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // fallback to raw string if old format

  const { timezone, timeFormat } = useSettingsStore.getState();

  let fmtStr = customFormat;
  if (!fmtStr) {
    fmtStr = 'MMM d';
  }

  return formatInTimeZone(date, timezone, fmtStr);
};

export const formatDisplayDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const { timezone, timeFormat } = useSettingsStore.getState();

  const timeFmt = timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
  return formatInTimeZone(date, timezone, `MMM d, ${timeFmt}`);
};

export const getRelativeTimeString = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return formatDistanceToNow(date, { addSuffix: true });
};

export const isTaskDueToday = (deadlineUtc: string | null | undefined): boolean => {
  if (!deadlineUtc) return false;
  const date = new Date(deadlineUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned === todayStrZoned;
};

export const isTaskCreatedToday = (createdAtUtc: string): boolean => {
  if (!createdAtUtc) return false;
  const date = new Date(createdAtUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned === todayStrZoned;
};

export const isTaskUpcoming = (dateUtc: string | null | undefined): boolean => {
  if (!dateUtc) return false;
  const date = new Date(dateUtc);
  if (isNaN(date.getTime())) return false;

  const { timezone } = useSettingsStore.getState();
  const dateStrZoned = formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  const todayStrZoned = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return dateStrZoned > todayStrZoned;
};

export const getCalendarDays = (currentMonthObj: Date) => {
  const { weekStartDay } = useSettingsStore.getState();

  const start = startOfWeek(startOfDay(currentMonthObj), { weekStartsOn: weekStartDay });
  // Add 41 days to get a 6-week grid
  const end = new Date(start.getTime() + 41 * 24 * 60 * 60 * 1000);

  return eachDayOfInterval({ start, end });
};
