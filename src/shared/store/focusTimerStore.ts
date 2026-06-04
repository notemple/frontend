import { db } from '@/storage/dexie/db';
import { create } from 'zustand';

type TimerMode = 'stopwatch' | 'timer' | 'pomodoro';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  stopwatchSeconds: number;
  timerSeconds: number;
  timerPresetDuration: number;
  pomodoroSeconds: number;
  
  // Daily focus accumulators (reset at midnight)
  pomodoroSecondsToday: number;
  timerSecondsToday: number;
  
  setMode: (mode: TimerMode) => void;
  setIsRunning: (running: boolean) => void;
  tick: () => void;
  adjustTimer: (amount: number) => void;
  reset: () => void;
  stop: () => void;
}

const STORAGE_KEY = 'templnote-focus-timer-state';

const DEFAULT_STATE = {
  mode: 'pomodoro' as TimerMode,
  stopwatchSeconds: 0,
  timerSeconds: 300,
  timerPresetDuration: 300,
  pomodoroSeconds: 1500,
  pomodoroSecondsToday: 0,
  timerSecondsToday: 0,
};

const getInitialState = () => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        mode: parsed.mode || DEFAULT_STATE.mode,
        stopwatchSeconds: typeof parsed.stopwatchSeconds === 'number' ? parsed.stopwatchSeconds : DEFAULT_STATE.stopwatchSeconds,
        timerSeconds: typeof parsed.timerSeconds === 'number' ? parsed.timerSeconds : DEFAULT_STATE.timerSeconds,
        timerPresetDuration: typeof parsed.timerPresetDuration === 'number' ? parsed.timerPresetDuration : DEFAULT_STATE.timerPresetDuration,
        pomodoroSeconds: typeof parsed.pomodoroSeconds === 'number' ? parsed.pomodoroSeconds : DEFAULT_STATE.pomodoroSeconds,
        pomodoroSecondsToday: typeof parsed.pomodoroSecondsToday === 'number' ? parsed.pomodoroSecondsToday : DEFAULT_STATE.pomodoroSecondsToday,
        timerSecondsToday: typeof parsed.timerSecondsToday === 'number' ? parsed.timerSecondsToday : DEFAULT_STATE.timerSecondsToday,
      };
    }
  } catch (e) {
    console.error("Failed to parse timer state", e);
  }
  return DEFAULT_STATE;
};

export const useFocusTimerStore = create<TimerState>((set, get) => {
  const initialState = getInitialState();

  const saveToStorage = (updates: Partial<typeof DEFAULT_STATE>) => {
    const currentState = get();
    const dataToSave = {
      mode: updates.mode !== undefined ? updates.mode : currentState.mode,
      stopwatchSeconds: updates.stopwatchSeconds !== undefined ? updates.stopwatchSeconds : currentState.stopwatchSeconds,
      timerSeconds: updates.timerSeconds !== undefined ? updates.timerSeconds : currentState.timerSeconds,
      timerPresetDuration: updates.timerPresetDuration !== undefined ? updates.timerPresetDuration : currentState.timerPresetDuration,
      pomodoroSeconds: updates.pomodoroSeconds !== undefined ? updates.pomodoroSeconds : currentState.pomodoroSeconds,
      pomodoroSecondsToday: updates.pomodoroSecondsToday !== undefined ? updates.pomodoroSecondsToday : currentState.pomodoroSecondsToday,
      timerSecondsToday: updates.timerSecondsToday !== undefined ? updates.timerSecondsToday : currentState.timerSecondsToday,
    };
    db.metadata.put({ key: STORAGE_KEY, value: dataToSave }).catch(e => console.error("Failed to save focus timer to Dexie", e));
  };

  return {
    ...initialState,
    isRunning: false, // Always start in a paused state when first opened

    setMode: (mode) => {
      set({ mode, isRunning: false });
      saveToStorage({ mode });
    },

    setIsRunning: (isRunning) => set({ isRunning }),

    tick: () => {
      const state = get();
      if (!state.isRunning) return;

      if (state.mode === 'stopwatch') {
        const nextSecs = state.stopwatchSeconds + 1;
        set({ stopwatchSeconds: nextSecs });
        saveToStorage({ stopwatchSeconds: nextSecs });
      } else if (state.mode === 'timer') {
        const nextSecsToday = state.timerSecondsToday + 1;
        if (state.timerSeconds <= 1) {
          set({ timerSeconds: 0, isRunning: false, timerSecondsToday: nextSecsToday });
          saveToStorage({ timerSeconds: 0, timerSecondsToday: nextSecsToday });
        } else {
          const nextSecs = state.timerSeconds - 1;
          set({ timerSeconds: nextSecs, timerSecondsToday: nextSecsToday });
          saveToStorage({ timerSeconds: nextSecs, timerSecondsToday: nextSecsToday });
        }
      } else if (state.mode === 'pomodoro') {
        const nextSecsToday = state.pomodoroSecondsToday + 1;
        if (state.pomodoroSeconds <= 1) {
          set({ pomodoroSeconds: 0, isRunning: false, pomodoroSecondsToday: nextSecsToday });
          saveToStorage({ pomodoroSeconds: 0, pomodoroSecondsToday: nextSecsToday });
        } else {
          const nextSecs = state.pomodoroSeconds - 1;
          set({ pomodoroSeconds: nextSecs, pomodoroSecondsToday: nextSecsToday });
          saveToStorage({ pomodoroSeconds: nextSecs, pomodoroSecondsToday: nextSecsToday });
        }
      }
    },

    adjustTimer: (amount) => {
      const state = get();
      if (state.isRunning || state.mode !== 'timer') return;
      const newPreset = Math.max(60, Math.min(5999, state.timerPresetDuration + amount));
      set({
        timerPresetDuration: newPreset,
        timerSeconds: newPreset,
      });
      saveToStorage({
        timerPresetDuration: newPreset,
        timerSeconds: newPreset,
      });
    },

    reset: () => {
      const state = get();
      set({ isRunning: false });
      if (state.mode === 'stopwatch') {
        set({ stopwatchSeconds: 0 });
        saveToStorage({ stopwatchSeconds: 0 });
      } else if (state.mode === 'timer') {
        set({ timerSeconds: state.timerPresetDuration });
        saveToStorage({ timerSeconds: state.timerPresetDuration });
      } else if (state.mode === 'pomodoro') {
        set({ pomodoroSeconds: 1500 });
        saveToStorage({ pomodoroSeconds: 1500 });
      }
    },

    stop: () => {
      const state = get();
      set({ isRunning: false });
      if (state.mode === 'stopwatch') {
        set({ stopwatchSeconds: 0 });
        saveToStorage({ stopwatchSeconds: 0 });
      } else if (state.mode === 'timer') {
        set({ timerSeconds: state.timerPresetDuration });
        saveToStorage({ timerSeconds: state.timerPresetDuration });
      } else if (state.mode === 'pomodoro') {
        set({ pomodoroSeconds: 1500 });
        saveToStorage({ pomodoroSeconds: 1500 });
      }
    },
  };
});

// Asynchronously load focus timer state from Dexie database on startup
if (typeof window !== 'undefined') {
  db.metadata.get(STORAGE_KEY).then((entry) => {
    if (entry && entry.value) {
      const parsed = entry.value;
      useFocusTimerStore.setState({
        mode: parsed.mode || DEFAULT_STATE.mode,
        stopwatchSeconds: typeof parsed.stopwatchSeconds === 'number' ? parsed.stopwatchSeconds : DEFAULT_STATE.stopwatchSeconds,
        timerSeconds: typeof parsed.timerSeconds === 'number' ? parsed.timerSeconds : DEFAULT_STATE.timerSeconds,
        timerPresetDuration: typeof parsed.timerPresetDuration === 'number' ? parsed.timerPresetDuration : DEFAULT_STATE.timerPresetDuration,
        pomodoroSeconds: typeof parsed.pomodoroSeconds === 'number' ? parsed.pomodoroSeconds : DEFAULT_STATE.pomodoroSeconds,
        pomodoroSecondsToday: typeof parsed.pomodoroSecondsToday === 'number' ? parsed.pomodoroSecondsToday : DEFAULT_STATE.pomodoroSecondsToday,
        timerSecondsToday: typeof parsed.timerSecondsToday === 'number' ? parsed.timerSecondsToday : DEFAULT_STATE.timerSecondsToday,
      });
    }
  }).catch((e) => {
    console.error("Failed to load focus timer from Dexie", e);
  });
}
