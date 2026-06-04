import { useSettingsStore } from '@/features/settings/store';
import { useTaskStore } from '@/features/tasks/store';
import { db } from '@/storage/dexie/db';
import { formatInTimeZone } from 'date-fns-tz';
import { create } from 'zustand';

export interface TaskTimer {
  taskId: string;
  seconds: number;
  isRunning: boolean;
  secondsToday: number;
  lastWorkedDate?: string;
}

interface TaskTimerState {
  timers: Record<string, TaskTimer>;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  tick: () => void;
  hasRunningTimers: () => boolean;
}

const STORAGE_KEY = 'templnote-task-timers-state';

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
          isRunning: false,
          secondsToday: parsed[taskId].secondsToday || 0,
          lastWorkedDate: parsed[taskId].lastWorkedDate || undefined
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
    db.metadata.put({ key: STORAGE_KEY, value: timers }).catch(e => console.error("Failed to save task timers to Dexie", e));
  };

  return {
    timers: initialTimers,

    startTimer: (taskId) => {
      // Check if the task is completed/done
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (task && (task.status === 'done' || task.completed)) {
        return; // Can't start timer on a done task
      }

      set((state) => {
        const { timezone } = useSettingsStore.getState();
        const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
        const current = state.timers[taskId] || { taskId, seconds: 0, secondsToday: 0, isRunning: false };
        
        const isNewDay = current.lastWorkedDate !== todayStr;
        const secondsTodayVal = isNewDay ? 0 : (current.secondsToday || 0);

        const updatedTimers = {
          ...state.timers,
          [taskId]: {
            ...current,
            isRunning: true,
            secondsToday: secondsTodayVal,
            lastWorkedDate: todayStr
          }
        };
        saveToStorage(updatedTimers);

        // Automatically make the task's status 'in progress'
        useTaskStore.getState().updateTask(taskId, { status: 'in progress' });

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

        // Automatically change the status back to 'open'
        useTaskStore.getState().updateTask(taskId, { status: 'open' });

        return { timers: updatedTimers };
      });
    },

    tick: () => {
      set((state) => {
        const { timezone } = useSettingsStore.getState();
        const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
        
        let changed = false;
        const updatedTimers = { ...state.timers };
        Object.keys(updatedTimers).forEach(taskId => {
          const t = updatedTimers[taskId];
          if (t.isRunning) {
            const isNewDay = t.lastWorkedDate !== todayStr;
            const secondsTodayVal = isNewDay ? 1 : ((t.secondsToday || 0) + 1);

            updatedTimers[taskId] = {
              ...t,
              seconds: t.seconds + 1,
              secondsToday: secondsTodayVal,
              lastWorkedDate: todayStr
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

// Subscribe to task store updates to pause timers when tasks are completed/done
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useTaskStore.subscribe((state) => {
      const timerState = useTaskTimerStore.getState();
      const currentTimers = timerState.timers;
      let changed = false;
      const updatedTimers = { ...currentTimers };

      Object.keys(updatedTimers).forEach(taskId => {
        const timer = updatedTimers[taskId];
        if (timer.isRunning) {
          const task = state.tasks.find(t => t.id === taskId);
          if (task && (task.status === 'done' || task.completed)) {
            updatedTimers[taskId] = {
              ...timer,
              isRunning: false
            };
            changed = true;
          }
        }
      });

      if (changed) {
        useTaskTimerStore.setState({ timers: updatedTimers });
        db.metadata.put({ key: STORAGE_KEY, value: updatedTimers }).catch(e => console.error("Failed to save task timers to Dexie", e));
      }
    });
  }, 100);
}

// Asynchronously load task timers state from Dexie database on startup
if (typeof window !== 'undefined') {
  db.metadata.get(STORAGE_KEY).then((entry) => {
    if (entry && entry.value) {
      const parsed = entry.value;
      const resetTimers: Record<string, TaskTimer> = {};
      Object.keys(parsed).forEach(taskId => {
        resetTimers[taskId] = {
          ...parsed[taskId],
          isRunning: false,
          secondsToday: parsed[taskId].secondsToday || 0,
          lastWorkedDate: parsed[taskId].lastWorkedDate || undefined
        };
      });
      useTaskTimerStore.setState({ timers: resetTimers });
    }
  }).catch((e) => {
    console.error("Failed to load task timers from Dexie", e);
  });
}
