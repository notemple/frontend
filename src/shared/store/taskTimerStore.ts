import { create } from 'zustand';

export interface TaskTimer {
  taskId: string;
  seconds: number;
  isRunning: boolean;
}

interface TaskTimerState {
  timers: Record<string, TaskTimer>;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  tick: () => void;
  hasRunningTimers: () => boolean;
}

const STORAGE_KEY = 'notemple-task-timers-state';

const getInitialState = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset isRunning to false on load to prevent orphan active states
      const resetTimers: Record<string, TaskTimer> = {};
      Object.keys(parsed).forEach(taskId => {
        resetTimers[taskId] = {
          ...parsed[taskId],
          isRunning: false
        };
      });
      return resetTimers;
    }
  } catch (e) {
    console.error("Failed to parse task timers", e);
  }
  return {};
};

export const useTaskTimerStore = create<TaskTimerState>((set, get) => {
  const initialTimers = getInitialState();

  const saveToStorage = (timers: Record<string, TaskTimer>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  };

  return {
    timers: initialTimers,

    startTimer: (taskId) => {
      set((state) => {
        const current = state.timers[taskId] || { taskId, seconds: 0, isRunning: false };
        const updatedTimers = {
          ...state.timers,
          [taskId]: {
            ...current,
            isRunning: true
          }
        };
        saveToStorage(updatedTimers);
        return { timers: updatedTimers };
      });
    },

    pauseTimer: (taskId) => {
      set((state) => {
        const current = state.timers[taskId];
        if (!current) return state;
        const updatedTimers = {
          ...state.timers,
          [taskId]: {
            ...current,
            isRunning: false
          }
        };
        saveToStorage(updatedTimers);
        return { timers: updatedTimers };
      });
    },

    stopTimer: (taskId) => {
      set((state) => {
        const current = state.timers[taskId];
        if (!current) return state;
        const updatedTimers = {
          ...state.timers,
          [taskId]: {
            ...current,
            seconds: 0,
            isRunning: false
          }
        };
        saveToStorage(updatedTimers);
        return { timers: updatedTimers };
      });
    },

    tick: () => {
      set((state) => {
        let changed = false;
        const updatedTimers = { ...state.timers };
        Object.keys(updatedTimers).forEach(taskId => {
          const t = updatedTimers[taskId];
          if (t.isRunning) {
            updatedTimers[taskId] = {
              ...t,
              seconds: t.seconds + 1
            };
            changed = true;
          }
        });
        if (changed) {
          saveToStorage(updatedTimers);
          return { timers: updatedTimers };
        }
        return state;
      });
    },

    hasRunningTimers: () => {
      return Object.values(get().timers).some(t => t.isRunning);
    }
  };
});
