import React, { useEffect, useState } from 'react';
import { Sidebar } from './sidebar/Sidebar';
import { MainWorkspace } from './MainWorkspace';
import { RightSidebar } from './right-sidebar/RightSidebar';
import { CommandPalette } from "@/shared/ui/CommandPalette";
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { TaskEditorModal } from "@/features/tasks/components/TaskEditorModal";

export const RootLayout = () => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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


