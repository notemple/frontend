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
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, Check, X, Plus, Trash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionPage } from "@/features/documents/SectionPage";
import { SectionGridItem } from "@/features/documents/components/SectionGridItem";
import { EmptyPaneState } from "@/features/documents/components/EmptyPaneState";
import { useSettingsStore } from '@/features/settings/store';
import { formatDisplayDateTime } from '@/shared/lib/time';

export const MainWorkspace = () => {
  const { panes, activePaneId, toggleRightSidebar, appearance, setAppearance, isRightSidebarOpen } = useUiStore();
  const { toggleSidebar } = useUiStore();
  const { timezone, timeFormat } = useSettingsStore();

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
    <div className="flex-1 flex flex-col overflow-hidden bg-workspace relative pt-0 z-10 w-full border-l border-border">
      <div className="h-14 w-full flex items-center justify-between px-6 shrink-0 bg-[image:var(--background-topbar)] dark:bg-background border-b border-border z-20">
        <div className="flex-1 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-muted-foreground/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all flex items-center justify-center rounded-sm-sm cursor-pointer"
          >
            <SidebarIcon size={18} />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm-full bg-muted/40 hover:bg-muted/70 border border-border/80 text-[11px] font-medium text-muted-foreground/90 shadow-sm-sm transition-all duration-200 select-none group hover:border-border">
            <Clock size={13} className="text-muted-foreground/60 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-200" />
            <span className="font-mono tracking-wide leading-none">{dateTime}</span>
          </div>
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
            <div className="w-6 h-6 bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground rounded-sm shadow-sm-sm border border-border">
              N
            </div>
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
                <div className="flex-1 overflow-hidden bg-workspace">
                  {pane.activeTabId?.startsWith('section-') ? (
                    <SectionPage paneId={pane.id} sectionId={pane.activeTabId} />
                  ) : pane.activeTabId ? (
                    <NotempleEditor key={`${pane.id}-${pane.activeTabId}`} paneId={pane.id} documentId={pane.activeTabId} />
                  ) : (
                    <EmptyPaneState />
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
SectionGridItem.displayName = 'SectionGridItem';
