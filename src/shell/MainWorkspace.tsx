import React, { useCallback } from 'react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useShallow } from 'zustand/react/shallow';
import { TabBar } from './TabBar';
import { NotempleEditor } from '@/features/editor/NotempleEditor';
import { DailyNotesPage } from '@/features/daily-notes/DailyNotesPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TagsPage } from '@/features/tags/TagsPage';
import { cn, getItemColor, getFolderStyle, getFolderHexColor, } from '@/shared/lib/utils';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';
import { 
  Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, 
  CaretDown, FileText, Folder, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, 
  Check, X, Plus, Trash, Hourglass, Target, Play as MiniPlay, Pause as MiniPause, Stop as MiniStop 
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { SectionPage } from "@/features/documents/SectionPage";
import { SectionGridItem } from "@/features/documents/components/SectionGridItem";
import { EmptyPaneState } from "@/features/documents/components/EmptyPaneState";
import { useSettingsStore } from '@/features/settings/store';
import { formatDisplayDateTime } from '@/shared/lib/time';
import { AccountDialog } from '@/features/settings/AccountDialog';
import { FocusTimerPopup } from './FocusTimerPopup';
import { formatInTimeZone } from 'date-fns-tz';
import { useFocusTimerStore } from '@/shared/store/focusTimerStore';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';

export const ClockWidget = () => {
  const { timezone, timeFormat } = useSettingsStore(
    useShallow((state) => ({
      timezone: state.timezone,
      timeFormat: state.timeFormat,
    }))
  );

  const [dateTime, setDateTime] = React.useState(() => {
    return formatDisplayDateTime(new Date().toISOString());
  });

  React.useEffect(() => {
    const updateDateTime = () => {
      setDateTime(formatDisplayDateTime(new Date().toISOString()));
    };

    updateDateTime(); // Update immediately on mount or dependency change

    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone, timeFormat]);

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-sm-full bg-muted/40 hover:bg-muted/70 border border-border/80 text-[11px] font-medium text-muted-foreground/90 shadow-sm-sm transition-all duration-200 select-none group hover:border-border">
      <Clock size={13} className="text-muted-foreground/60 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-200" />
      <span className="font-mono tracking-wide leading-none">{dateTime}</span>
    </div>
  );
};

export const FocusTimerWidget = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    mode,
    isRunning,
    stopwatchSeconds,
    timerSeconds,
    pomodoroSeconds,
    setIsRunning,
    stop
  } = useFocusTimerStore();

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

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'stopwatch':
        return <ClockCounterClockwise size={13} className="text-sky-400 dark:text-sky-300 transition-colors" />;
      case 'timer':
        return <Hourglass size={13} className="text-blue-400 dark:text-blue-300 transition-colors" />;
      case 'pomodoro':
        return <Target size={13} className="text-rose-400 dark:text-rose-300 transition-colors animate-pulse" />;
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="focus-timer-widget-trigger flex items-center gap-2.5 px-3 py-1 rounded-sm-full bg-muted/40 hover:bg-muted/70 border border-border/80 text-[11px] font-medium text-muted-foreground/90 shadow-sm-sm transition-all duration-200 select-none group hover:border-border">
        {/* Active Mode Icon */}
        <div className="flex items-center justify-center">
          {getModeIcon()}
        </div>

        {/* Current Duration */}
        <span className="font-mono tracking-wide leading-none select-none text-[11px]">
          {formatTime(getSeconds())}
        </span>

        {/* Small separator */}
        <div className="w-[px] border-r border-border h-3 self-center opacity-60" />

        {/* Mini controls */}
        <div className="flex items-center gap-1.5">
          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRunning(!isRunning);
            }}
            className={`p-0.5 rounded-sm hover:bg-muted transition-colors flex items-center justify-center cursor-pointer ${
              isRunning ? 'text-rose-500' : 'text-muted-foreground/80 hover:text-foreground'
            }`}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <MiniPause size={10} weight="bold" /> : <MiniPlay size={10} weight="fill" />}
          </button>

          {/* Stop Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              stop();
            }}
            className="p-0.5 rounded-sm hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground/80 hover:text-rose-500 cursor-pointer"
            title="Stop & Clear"
          >
            <MiniStop size={10} weight="fill" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <FocusTimerPopup onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const GSAPPageWrapper = ({ children, activeTabId }: { children: React.ReactNode; activeTabId: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current);
      gsap.fromTo(containerRef.current,
        { opacity: 0.2, y: 10 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.28, 
          ease: "power3.out"
        }
      );
    }
  }, [activeTabId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col overflow-hidden bg-workspace"
    >
      {children}
    </div>
  );
};

export const MainWorkspace = () => {
  const { panes, activePaneId, toggleRightSidebar, appearance, setAppearance, isRightSidebarOpen, toggleSidebar } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      toggleRightSidebar: state.toggleRightSidebar,
      appearance: state.appearance,
      setAppearance: state.setAppearance,
      isRightSidebarOpen: state.isRightSidebarOpen,
      toggleSidebar: state.toggleSidebar,
    }))
  );

  const isTimerRunning = useFocusTimerStore((state) => state.isRunning);
  const tickTimer = useFocusTimerStore((state) => state.tick);

  const tickTaskTimers = useTaskTimerStore((state) => state.tick);
  const hasRunningTasks = useTaskTimerStore((state) => Object.values(state.timers).some(t => t.isRunning));

  React.useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  React.useEffect(() => {
    if (!hasRunningTasks) return;
    const interval = setInterval(() => {
      tickTaskTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, [hasRunningTasks, tickTaskTimers]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTimerRunning) {
        const msg = "time is still timing, are you sure to close and stop?";
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTimerRunning]);

  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const userProfileIcon = useSettingsStore((state) => state.userProfileIcon);


  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeTabId = activePane?.activeTabId;

  // Use a highly optimized Zustand selector with shallow comparison to prevent ANY keystroke re-renders!
  const headerTextSelector = useCallback(
    state => {
      if (!activeTabId) return 'Home';
      if (activeTabId.startsWith('section-folder-')) {
        const folderId = activeTabId.replace('section-folder-', '');
        const folder = state.folders.find(f => f?.id === folderId);
        return folder?.name || 'Folder';
      }
      if (activeTabId === 'section-daily-notes') return 'Daily notes';
      if (activeTabId === 'section-tasks') return 'Tasks';
      if (activeTabId === 'section-tags') return 'Tags';
      if (activeTabId.startsWith('section-')) {
        const cleanId = activeTabId.replace('section-', '');
        return cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
      }
      if (activeTabId === 'new-note') return 'Untitled';
      return state.documents[activeTabId]?.title || 'Home';
    },
    [activeTabId]
  );
  const headerText = useDocumentStore(useShallow(headerTextSelector));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative pt-0 z-10 w-full border-l border-border">
      <div className="h-14 w-full flex items-center justify-between px-6 shrink-0 bg-[image:var(--background-topbar)] dark:bg-background border-b border-border z-20">
        <div className="flex-1 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-muted-foreground/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all flex items-center justify-center rounded-sm-sm cursor-pointer"
          >
            <SidebarIcon size={18} />
          </button>
          
          <ClockWidget />
          <FocusTimerWidget />
        </div>
        <div className="text-[13px] font-medium text-muted-foreground flex-1 text-center font-sans tracking-wide">
          {headerText}
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Inline Theme Segmented Control */}
          <div className="flex items-center bg-muted p-0.5 rounded-sm-sm border border-border">
            <button
              onClick={() => setAppearance('light')}
              className={cn(
                "p-1.5 rounded-sm-sm transition-all duration-200 border",
                appearance === 'light'
                  ? "bg-blush-pop/70 dark:bg-blush-pop/20 text-foreground dark:text-blush-pop border-blush-pop/50 dark:border-blush-pop/30 shadow-sm-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-blush-pop/10 dark:hover:text-blush-pop dark:hover:bg-blush-pop/5 dark:hover:border-blush-pop/10"
              )}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button
              onClick={() => setAppearance('dark')}
              className={cn(
                "p-1.5 rounded-sm-sm transition-all duration-200 border",
                appearance === 'dark'
                  ? "bg-icy-blue/70 dark:bg-icy-blue/20 text-foreground dark:text-icy-blue border-icy-blue/50 dark:border-icy-blue/30 shadow-sm-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-icy-blue/10 dark:hover:text-icy-blue dark:hover:bg-icy-blue/5 dark:hover:border-icy-blue/10"
              )}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setAppearance('system')}
              className={cn(
                "p-1.5 rounded-sm-sm transition-all duration-200 border",
                appearance === 'system'
                  ? "bg-pink-orchid/70 dark:bg-pink-orchid/20 text-foreground dark:text-pink-orchid border-pink-orchid/50 dark:border-pink-orchid/30 shadow-sm-sm font-semibold"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-pink-orchid/10 dark:hover:text-pink-orchid dark:hover:bg-pink-orchid/5 dark:hover:border-pink-orchid/10"
              )}
              title="System Theme"
            >
              <Monitor size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAccountOpen(true)}
              className="w-6 h-6 bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border rounded-sm shadow-sm-sm transition-all duration-150 cursor-pointer select-none"
            >
              {userProfileIcon || "N"}
            </button>
            <button className="flex items-center gap-1.5 h-6 px-3 rounded-sm shadow-sm-sm transition-all text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border bg-muted/40">
              <ShareFat size={12} weight="fill" />
              Share
            </button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-1.5 rounded-sm-sm hover:bg-muted"><Bell size={18} /></button>
            <button className="hover:text-foreground transition-colors p-1.5 rounded-sm-sm hover:bg-muted"><ClockCounterClockwise size={18} /></button>
            <button className={cn("transition-all duration-200 flex items-center gap-1.5 p-1.5 px-2.5 rounded-sm-sm border", isRightSidebarOpen ? "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20 shadow-sm-inner font-semibold" : "text-muted-foreground/80 border-transparent hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/5 hover:border-sky-500/10")} onClick={toggleRightSidebar}>
              <Layout size={18} />
              <CaretDown size={12} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-workspace">
        {panes.map((pane, index) => {
          return (
            <React.Fragment key={pane.id}>
              {index > 0 && (
                <div className="w-px bg-border hover:bg-accent hover:w-[2px] transition-all cursor-col-resize shrink-0 z-10 neu-flat" />
              )}
              <div className="flex-1 flex flex-col min-w-[300px] overflow-hidden relative">
                <TabBar paneId={pane.id} />
                <div className="flex-1 overflow-hidden bg-transparent relative">
                  <GSAPPageWrapper activeTabId={pane.activeTabId || 'empty'}>
                    {pane.activeTabId?.startsWith('section-') ? (
                      <SectionPage paneId={pane.id} sectionId={pane.activeTabId} />
                    ) : pane.activeTabId ? (
                      <NotempleEditor key={`${pane.id}-${pane.activeTabId}`} paneId={pane.id} documentId={pane.activeTabId} />
                    ) : (
                      <EmptyPaneState />
                    )}
                  </GSAPPageWrapper>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <AccountDialog isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </div>
  );
};
SectionGridItem.displayName = 'SectionGridItem';
