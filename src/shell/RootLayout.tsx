import React, { useEffect, useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { MainWorkspace } from './MainWorkspace';
import { RightSidebar } from './right-sidebar/RightSidebar';
import { CommandPalette } from "@/shared/ui/CommandPalette";
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { TaskEditorModal } from "@/features/tasks/components/TaskEditorModal";
import { useSettingsStore } from '@/features/settings/store';

export const RootLayout = () => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const autoHideSidebars = useSettingsStore(state => state.autoHideSidebars);

  const { openDocument, appearance } = useUiStore(
    useShallow((state) => ({
      openDocument: state.openDocument,
      appearance: state.appearance,
    }))
  );

  useEffect(() => {
    const handleOpenTaskEditor = (e: CustomEvent) => {
      setEditingTaskId(e.detail.id);
    };
    window.addEventListener('task-editor-open' as any, handleOpenTaskEditor as any);
    return () => window.removeEventListener('task-editor-open' as any, handleOpenTaskEditor as any);
  }, []);

  // Global keyboard shortcuts for toggling sidebars and cycling panes/tabs
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta && e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const { panes, activePaneId, setActiveTab } = useUiStore.getState();
          const activePane = panes.find(p => p.id === activePaneId);
          if (activePane && activePane.tabs.length > 1) {
            const currentTabIndex = activePane.tabs.indexOf(activePane.activeTabId || '');
            if (currentTabIndex !== -1) {
              const prevIndex = (currentTabIndex - 1 + activePane.tabs.length) % activePane.tabs.length;
              setActiveTab(activePane.tabs[prevIndex], activePane.id);
            }
          }
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const { panes, activePaneId, setActiveTab } = useUiStore.getState();
          const activePane = panes.find(p => p.id === activePaneId);
          if (activePane && activePane.tabs.length > 1) {
            const currentTabIndex = activePane.tabs.indexOf(activePane.activeTabId || '');
            if (currentTabIndex !== -1) {
              const nextIndex = (currentTabIndex + 1) % activePane.tabs.length;
              setActiveTab(activePane.tabs[nextIndex], activePane.id);
            }
          }
          return;
        }

        const key = e.key.toLowerCase();
        if (key === 'l') {
          if (!autoHideSidebars) {
            e.preventDefault();
            useUiStore.getState().toggleSidebar();
          }
        } else if (key === 'r') {
          if (!autoHideSidebars) {
            e.preventDefault();
            useUiStore.getState().toggleRightSidebar();
          }
        } else if (key === 'h') {
          e.preventDefault();
          const { panes, activePaneId, setActivePane } = useUiStore.getState();
          const index = panes.findIndex(p => p.id === activePaneId);
          if (index > 0) {
            setActivePane(panes[index - 1].id);
          }
        } else if (key === 'j') {
          e.preventDefault();
          const { panes, activePaneId, setActivePane } = useUiStore.getState();
          const index = panes.findIndex(p => p.id === activePaneId);
          if (index !== -1 && index < panes.length - 1) {
            setActivePane(panes[index + 1].id);
          }
        } else if (key === 'n') {
          e.preventDefault();
          const { activePaneId, addPane } = useUiStore.getState();
          addPane(`pane-${Date.now()}`, activePaneId || undefined);
        } else if (key === 'q') {
          e.preventDefault();
          const { activePaneId, removePane, panes } = useUiStore.getState();
          if (activePaneId && panes.length > 1) {
            removePane(activePaneId);
          }
        }
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [autoHideSidebars]);

  // Immediately close both sidebars when auto-hide is turned ON in settings
  useEffect(() => {
    if (autoHideSidebars) {
      useUiStore.setState({ isSidebarOpen: false, isRightSidebarOpen: false });
    }
  }, [autoHideSidebars]);

  // Handle sidebar hover reveal and auto-hide close boundaries
  useEffect(() => {
    if (!autoHideSidebars) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX } = e;
      const W = window.innerWidth;

      const state = useUiStore.getState();
      const isLeftOpen = state.isSidebarOpen;
      const isRightOpen = state.isRightSidebarOpen;

      // 1. Left Sidebar Edge Triggers: open within 15px from left edge, close beyond 260px boundary
      if (clientX <= 15) {
        if (!isLeftOpen) {
          useUiStore.setState({ isSidebarOpen: true });
        }
      } else if (isLeftOpen && clientX > 260) {
        useUiStore.setState({ isSidebarOpen: false });
      }

      // 2. Right Sidebar Edge Triggers: open within 15px from right edge, close below W - 320px boundary
      if (clientX >= W - 15) {
        if (!isRightOpen) {
          useUiStore.setState({ isRightSidebarOpen: true });
        }
      } else if (isRightOpen && clientX < W - 320) {
        useUiStore.setState({ isRightSidebarOpen: false });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [autoHideSidebars]);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      let isDark = true;
      if (appearance === 'light') {
        isDark = false;
      } else if (appearance === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.remove('light');
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (appearance === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [appearance]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Synchronize UI store from the URL hash
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const isFull = hash.endsWith('/full');
        const docId = isFull ? hash.replace('/full', '') : hash;
        
        const store = useUiStore.getState();
        if (store.isDailyNoteFullView !== isFull) {
          store.setDailyNoteFullView(isFull);
        }
        
        const activePane = store.panes.find(p => p.id === store.activePaneId) || store.panes[0];
        if (activePane && activePane.activeTabId !== docId) {
          store.openDocument(docId);
        }
      } else {
        // Fallback default state tracking
        const store = useUiStore.getState();
        const activePane = store.panes.find(p => p.id === store.activePaneId) || store.panes[0];
        const docId = activePane?.activeTabId || 'section-daily-notes';
        window.history.replaceState({ docId, isFullView: false }, '', `#${docId}`);
      }
    };

    // Initialize tracking on initial page load
    handleHashChange();

    // Listen to native browser Back and Forward button events
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { docId, isFullView } = event.state;
        const store = useUiStore.getState();
        
        if (store.isDailyNoteFullView !== isFullView) {
          store.setDailyNoteFullView(isFullView);
        }
        
        const activePane = store.panes.find(p => p.id === store.activePaneId) || store.panes[0];
        if (activePane && activePane.activeTabId !== docId) {
          store.openDocument(docId);
        }
      } else {
        handleHashChange();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Subscribe to UI store updates to push new browser history entries
    const unsubscribe = useUiStore.subscribe(
      (state) => {
        const activePane = state.panes.find(p => p.id === state.activePaneId) || state.panes[0];
        const docId = activePane?.activeTabId || 'section-daily-notes';
        const isFull = state.isDailyNoteFullView;
        const hash = isFull ? `#${docId}/full` : `#${docId}`;
        
        if (window.location.hash !== hash) {
          window.history.pushState({ docId, isFullView: isFull }, '', hash);
        }
      }
    );

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribe();
    };
  }, []);

  // Click outside sidebars to close them automatically
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Close left sidebar if click is outside of it
      const leftSidebar = document.querySelector('.group\\/sidebar');
      const leftSidebarToggle = target.closest('.left-sidebar-toggle');

      if (
        leftSidebar &&
        !leftSidebar.contains(target) &&
        !leftSidebarToggle &&
        useUiStore.getState().isSidebarOpen
      ) {
        useUiStore.getState().setSidebarOpen(false);
      }

      // Close right sidebar if click is outside of it
      const rightSidebar = document.querySelector('.notemple-sidebar-right');
      const rightSidebarToggle = target.closest('.right-sidebar-toggle');

      if (
        rightSidebar &&
        !rightSidebar.contains(target) &&
        !rightSidebarToggle &&
        useUiStore.getState().isRightSidebarOpen
      ) {
        useUiStore.getState().toggleRightSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent font-sans text-foreground relative z-0">
      {/* Persistent Global Background Layer */}
      <div className="global-ambient-bg" />

      <Sidebar />
      <MainWorkspace />
      <RightSidebar />
      <CommandPalette />
      {editingTaskId && (
        <TaskEditorModal 
          taskId={editingTaskId} 
          onClose={() => setEditingTaskId(null)} 
        />
      )}
    </div>
  );
};


