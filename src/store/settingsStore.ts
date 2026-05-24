import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsStore {
  timezone: string;
  timeFormat: '12h' | '24h';
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for Sunday, 1 for Monday
  setTimezone: (timezone: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setWeekStartDay: (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timeFormat: '12h',
      weekStartDay: 0,
      setTimezone: (timezone) => set({ timezone }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setWeekStartDay: (day) => set({ weekStartDay: day }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
