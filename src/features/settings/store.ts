import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsStore {
  timezone: string;
  timeFormat: '12h' | '24h';
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for Sunday, 1 for Monday
  roundness: 'rounded-md' | 'rounded-none' | 'rounded-lg';
  spaceName: string;
  spaceIcon: string;
  userName: string;
  userEmail: string;
  userPassword: string;
  userProfileIcon: string;
  autoHideNavbar: boolean;
  autoHideSidebars: boolean;

  // Active/Inactive Pane highlight options
  activeHighlightType: 'solid' | 'gradient';
  activeHighlightColor: string;
  activeHighlightGradient: string;
  inactiveHighlightType: 'solid' | 'gradient';
  inactiveHighlightColor: string;
  inactiveHighlightGradient: string;

  setTimezone: (timezone: string) => void;
  setTimeFormat: (format: '12h' | '24h') => void;
  setWeekStartDay: (day: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  setRoundness: (roundness: 'rounded-md' | 'rounded-none' | 'rounded-lg') => void;
  setSpaceName: (name: string) => void;
  setSpaceIcon: (icon: string) => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserPassword: (password: string) => void;
  setUserProfileIcon: (icon: string) => void;
  setAutoHideNavbar: (autoHide: boolean) => void;
  setAutoHideSidebars: (autoHide: boolean) => void;

  setActiveHighlightType: (type: 'solid' | 'gradient') => void;
  setActiveHighlightColor: (color: string) => void;
  setActiveHighlightGradient: (gradient: string) => void;
  setInactiveHighlightType: (type: 'solid' | 'gradient') => void;
  setInactiveHighlightColor: (color: string) => void;
  setInactiveHighlightGradient: (gradient: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timeFormat: '12h',
      weekStartDay: 0,
      roundness: 'rounded-md',
      spaceName: 'Personal Space',
      spaceIcon: 'N',
      userName: 'User',
      userEmail: 'user@example.com',
      userPassword: 'password123',
      userProfileIcon: 'N',
      autoHideNavbar: false,
      autoHideSidebars: false,

      // Initial highlight preferences
      activeHighlightType: 'solid',
      activeHighlightColor: '#0ea5e9', // Sky blue
      activeHighlightGradient: 'linear-gradient(to right, #3b82f6, #8b5cf6)', // Blue to Purple
      inactiveHighlightType: 'solid',
      inactiveHighlightColor: 'transparent',
      inactiveHighlightGradient: 'none',

      setTimezone: (timezone) => set({ timezone }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setWeekStartDay: (day) => set({ weekStartDay: day }),
      setRoundness: (roundness) => set({ roundness }),
      setSpaceName: (spaceName) => set({ spaceName }),
      setSpaceIcon: (spaceIcon) => set({ spaceIcon }),
      setUserName: (userName) => set({ userName }),
      setUserEmail: (userEmail) => set({ userEmail }),
      setUserPassword: (userPassword) => set({ userPassword }),
      setUserProfileIcon: (userProfileIcon) => set({ userProfileIcon }),
      setAutoHideNavbar: (autoHideNavbar) => set({ autoHideNavbar }),
      setAutoHideSidebars: (autoHideSidebars) => set({ autoHideSidebars }),

      setActiveHighlightType: (activeHighlightType) => set({ activeHighlightType }),
      setActiveHighlightColor: (activeHighlightColor) => set({ activeHighlightColor }),
      setActiveHighlightGradient: (activeHighlightGradient) => set({ activeHighlightGradient }),
      setInactiveHighlightType: (inactiveHighlightType) => set({ inactiveHighlightType }),
      setInactiveHighlightColor: (inactiveHighlightColor) => set({ inactiveHighlightColor }),
      setInactiveHighlightGradient: (inactiveHighlightGradient) => set({ inactiveHighlightGradient }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
