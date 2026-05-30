import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  ArrowCounterClockwise, 
  Stop, 
} from '@phosphor-icons/react';
import { useFocusTimerStore } from '@/shared/store/focusTimerStore';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';
import { useTaskStore } from '@/features/tasks/store';

type TimerMode = 'stopwatch' | 'timer' | 'pomodoro';

export const FocusTimerPopup = ({ onClose }: { onClose: () => void }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  
  const {
    mode,
    isRunning,
    stopwatchSeconds,
    timerSeconds,
    timerPresetDuration,
    pomodoroSeconds,
    setMode,
    setIsRunning,
    adjustTimer,
    reset,
    stop
  } = useFocusTimerStore();

  const tasks = useTaskStore(state => state.tasks) || [];
  const timers = useTaskTimerStore(state => state.timers) || {};
  const pauseTimer = useTaskTimerStore(state => state.pauseTimer);
  const stopTimer = useTaskTimerStore(state => state.stopTimer);

  const runningTimersList = React.useMemo(() => {
    return Object.values(timers)
      .filter(t => t.isRunning)
      .map(timer => {
        const task = tasks.find(t => t.id === timer.taskId) || { id: timer.taskId, title: 'Deleted Task' };
        return { task, timer };
      });
  }, [timers, tasks]);

  // Click outside detection
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | PointerEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Prevent closing if clicking the focus widget trigger itself
        const focusTrigger = document.querySelector('.focus-timer-widget-trigger');
        if (focusTrigger && focusTrigger.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [onClose]);

  // Get current display seconds based on active mode
  const getSeconds = () => {
    switch (mode) {
      case 'stopwatch':
        return stopwatchSeconds;
      case 'timer':
        return timerSeconds;
      case 'pomodoro':
        return pomodoroSeconds;
    }
  };

  const currentSeconds = getSeconds();

  // Format seconds to HH:MM:SS
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Circular progress calculations
  const getProgressPercentage = () => {
    switch (mode) {
      case 'stopwatch':
        // Continuous sweep every 60 seconds
        return (stopwatchSeconds % 60) / 60;
      case 'timer':
        return timerPresetDuration > 0 
          ? timerSeconds / timerPresetDuration 
          : 0;
      case 'pomodoro':
        return pomodoroSeconds / 1500;
    }
  };

  const progressFraction = getProgressPercentage();
  const radius = 48;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressFraction * circumference);

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute top-full left-0 mt-2 w-[240px] bg-card border border-border shadow-sm rounded-sm p-4 z-50 flex flex-col items-center gap-4 select-none"
    >
      {/* Mode Selectors */}
      <div className="flex w-full items-center bg-muted p-0.5 rounded-sm border border-border">
        {(['stopwatch', 'timer', 'pomodoro'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 text-[10px] py-1 text-center font-medium capitalize rounded-sm-sm transition-all duration-200 cursor-pointer ${
              mode === m
                ? 'bg-blush-pop/80 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'timer' ? 'Timer' : m === 'pomodoro' ? 'Pomo' : 'Watch'}
          </button>
        ))}
      </div>

      {/* Progress Ring and Digital Clock Area */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-40"
          />
          {/* Foreground progress circle */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            stroke={mode === 'pomodoro' ? 'var(--blush-pop)' : 'var(--icy-blue)'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ ease: 'linear', duration: isRunning ? 1 : 0.2 }}
            strokeLinecap="round"
          />
        </svg>

        {/* Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-semibold font-mono tracking-tight text-foreground">
            {formatTime(currentSeconds)}
          </span>
          <span className="text-[8px] font-medium text-muted-foreground/80 tracking-widest uppercase mt-0.5">
            {mode}
          </span>
        </div>
      </div>

      {/* Manual Duration Adjustments for Countdown Mode */}
      {mode === 'timer' && (
        <div className="flex items-center gap-1.5 justify-center -mt-1">
          <button
            onClick={() => adjustTimer(-300)}
            disabled={isRunning}
            className="p-1 px-1.5 text-[9px] font-mono rounded border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Subtract 5 Minutes"
          >
            -5m
          </button>
          <button
            onClick={() => adjustTimer(-60)}
            disabled={isRunning}
            className="p-1 px-1.5 text-[9px] font-mono rounded border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Subtract 1 Minute"
          >
            -1m
          </button>
          <button
            onClick={() => adjustTimer(60)}
            disabled={isRunning}
            className="p-1 px-1.5 text-[9px] font-mono rounded border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Add 1 Minute"
          >
            +1m
          </button>
          <button
            onClick={() => adjustTimer(300)}
            disabled={isRunning}
            className="p-1 px-1.5 text-[9px] font-mono rounded border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            title="Add 5 Minutes"
          >
            +5m
          </button>
        </div>
      )}

      {/* Control Buttons Panel */}
      <div className="flex items-center gap-3 w-full justify-center mt-1">
        {/* Reset Button */}
        <button
          onClick={reset}
          className="p-2 rounded-sm border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
          title="Reset"
        >
          <ArrowCounterClockwise size={13} />
        </button>

        {/* Central Play/Pause Button */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`h-9 w-9 rounded-sm-full flex items-center justify-center transition-all cursor-pointer border ${
            isRunning
              ? 'bg-icy-blue/80 dark:bg-icy-blue/20 text-foreground dark:text-icy-blue border-icy-blue/40 shadow-sm-sm font-semibold'
              : 'bg-blush-pop/80 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/40 shadow-sm-sm font-semibold'
          }`}
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause size={15} weight="bold" /> : <Play size={15} weight="fill" />}
        </button>

        {/* Stop Button */}
        <button
          onClick={stop}
          className="p-2 rounded-sm border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
          title="Stop & Clear"
        >
          <Stop size={13} weight="fill" />
        </button>
      </div>

      {/* Active Task Timers List */}
      {runningTimersList.length > 0 && (
        <div className="w-full border-t border-border/40 pt-3 mt-1 flex flex-col gap-2 max-h-[140px] overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider pl-1">
            Running Tasks
          </div>
          {runningTimersList.map(({ task, timer }) => (
            <div key={task.id} className="flex items-center justify-between bg-muted/30 border border-border/40 rounded px-2.5 py-1.5 w-full gap-2 shrink-0">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-foreground truncate leading-none mb-0.5">{task.title || 'Untitled Task'}</span>
                <span className="text-[9px] text-muted-foreground/60 leading-none">Task stopwatch</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold font-mono text-muted-foreground tracking-tight">
                  {(() => {
                    const hrs = Math.floor(timer.seconds / 3600);
                    const mins = Math.floor((timer.seconds % 3600) / 60);
                    const secs = timer.seconds % 60;
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
                  })()}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => pauseTimer(task.id)}
                    className="p-1 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer flex items-center justify-center shrink-0"
                    title="Pause"
                  >
                    <Pause size={10} weight="bold" />
                  </button>
                  <button
                    onClick={() => stopTimer(task.id)}
                    className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center justify-center shrink-0"
                    title="Stop & Reset"
                  >
                    <Stop size={10} weight="fill" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
