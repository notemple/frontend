import React, { useCallback } from 'react';
import { useUiStore } from '@/src/store/uiStore';
import { useDocumentStore } from '@/src/store/documentStore';
import { useShallow } from 'zustand/react/shallow';
import { TabBar } from './TabBar';
import { NotempleEditor } from '@/src/components/editor/NotempleEditor';
import { DailyNotesPage } from '@/src/components/DailyNotesPage';
import { TasksPage } from '@/src/components/TasksPage';
import { cn } from '@/src/lib/utils';
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder as FolderIcon, Sun, Moon, Monitor } from '@phosphor-icons/react';

export const MainWorkspace = () => {
  const { panes, activePaneId, toggleRightSidebar, appearance, setAppearance, isRightSidebarOpen } = useUiStore();
  const { toggleSidebar } = useUiStore();

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
    <div className="flex-1 flex flex-col overflow-hidden bg-background relative pt-0 z-10 w-full rounded-tl-2xl shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-border">
      <div className="h-14 w-full flex items-center justify-between px-6 shrink-0 transition-colors bg-muted/40 backdrop-blur-3xl border-b border-border z-20">
        <div className="flex-1 flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-muted-foreground/80 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all mr-3 flex items-center justify-center rounded-md"
          >
            <SidebarIcon size={18} />
          </button>
        </div>
        <div className="text-[13px] font-medium text-muted-foreground flex-1 text-center font-sans tracking-wide">
          {headerText}
        </div>
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Inline Theme Segmented Control */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setAppearance('light')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'light'
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-inner"
                  : "text-muted-foreground border-transparent hover:text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/10"
              )}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
            <button
              onClick={() => setAppearance('dark')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'dark'
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20 shadow-inner"
                  : "text-muted-foreground border-transparent hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/5 hover:border-indigo-500/10"
              )}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setAppearance('system')}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200 border",
                appearance === 'system'
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 shadow-inner"
                  : "text-muted-foreground border-transparent hover:text-teal-500 dark:hover:text-teal-400 hover:bg-teal-500/5 hover:border-teal-500/10"
              )}
              title="System Theme"
            >
              <Monitor size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground rounded shadow-sm border border-border">
              N
            </div>
            <button className="flex items-center gap-1.5 h-6 px-3 rounded shadow-sm transition-all text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border bg-muted/40">
              <ShareFat size={12} weight="fill" />
              Share
            </button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"><Bell size={18} /></button>
            <button className="hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"><ClockCounterClockwise size={18} /></button>
            <button className={cn("transition-all duration-200 flex items-center gap-1.5 p-1.5 px-2.5 rounded-md border", isRightSidebarOpen ? "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20 shadow-inner font-semibold" : "text-muted-foreground/80 border-transparent hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/5 hover:border-sky-500/10")} onClick={toggleRightSidebar}>
              <Layout size={18} />
              <CaretDown size={12} className="opacity-50" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-background">
        {panes.map((pane, index) => {
          return (
            <React.Fragment key={pane.id}>
              {index > 0 && (
                <div className="w-px bg-border hover:bg-accent hover:w-[2px] transition-all cursor-col-resize shrink-0 z-10 neu-flat" />
              )}
              <div className="flex-1 flex flex-col min-w-[300px] overflow-hidden relative">
                <TabBar paneId={pane.id} />
                <div className="flex-1 overflow-hidden bg-background">
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

const SectionPage = ({ paneId, sectionId }: { paneId: string, sectionId: string }) => {
  const { openDocument } = useUiStore();

  if (sectionId === 'section-daily-notes') {
    return <DailyNotesPage paneId={paneId} />;
  }
  if (sectionId === 'section-tasks') {
    return <TasksPage paneId={paneId} />;
  }

  const titleSelector = useCallback(
    state => {
      if (sectionId === 'section-favorites') return 'Favorites';
      if (sectionId === 'section-folders') return 'Folders';
      if (sectionId.startsWith('section-folder-')) {
        const folderId = sectionId.replace('section-folder-', '');
        const folder = state.folders.find(f => f?.id === folderId);
        return folder?.name || 'Folder';
      }
      if (sectionId === 'section-uncategorized') return 'Uncategorized';
      return '';
    },
    [sectionId]
  );
  const title = useDocumentStore(titleSelector);

  const itemsSelector = useCallback(
    state => {
      if (sectionId === 'section-favorites') {
        return state.documentOrder
          .filter(id => state.documents[id]?.isFavorite)
          .map(id => ({
            id,
            title: state.documents[id]?.title || 'Untitled',
            type: state.documents[id]?.type || 'page',
            isFavorite: true
          }));
      }
      if (sectionId === 'section-folders') {
        return state.folders.filter(Boolean).map(f => ({ id: f.id, title: f.name, type: 'folder' }));
      }
      if (sectionId.startsWith('section-folder-')) {
        const folderId = sectionId.replace('section-folder-', '');
        return state.documentOrder
          .filter(id => state.documents[id]?.folderId === folderId)
          .map(id => ({
            id,
            title: state.documents[id]?.title || 'Untitled',
            type: state.documents[id]?.type || 'page'
          }));
      }
      if (sectionId === 'section-uncategorized') {
        return state.documentOrder
          .filter(id => {
            const doc = state.documents[id];
            return doc && !doc.folderId && !id.startsWith('daily-note-');
          })
          .map(id => ({
            id,
            title: state.documents[id]?.title || 'Untitled',
            type: state.documents[id]?.type || 'page'
          }));
      }
      return [];
    },
    [sectionId]
  );
  const items = useDocumentStore(useShallow(itemsSelector));

  return (
    <div className="p-10 h-full overflow-y-auto no-scrollbar relative min-h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.01] to-transparent pointer-events-none" />
      <h1 className="text-4xl font-semibold mb-10 text-foreground/90 tracking-tight font-sans relative">{title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        {items.filter(Boolean).map(item => (
          <div
            key={item.id}
            onClick={() => {
              if (item.type === 'folder') {
                openDocument(`section-folder-${item.id}`, paneId);
              } else {
                openDocument(item.id, paneId);
              }
            }}
            className="p-6 rounded-xl bg-muted/30 border border-border hover:bg-muted/60 hover:border-muted-foreground/30 cursor-pointer group flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/5 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-foreground/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col gap-4 relative">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors duration-300 shadow-inner">
                {item.type === 'folder' ? <FolderIcon size={20} weight="duotone" /> : <FileText size={20} weight="duotone" />}
              </div>
              <span className="font-medium text-sm truncate text-foreground/80 group-hover:text-foreground transition-colors">{item.title || 'Untitled'}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
              <FileText size={24} weight="light" />
            </div>
            <span className="text-muted-foreground/40 text-sm">This section is empty.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyPaneState = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <div className="w-16 h-16 border border-border flex items-center justify-center mb-4 text-border">
        <Columns size={24} />
      </div>
      <p className="text-sm">Select a document to open in this pane.</p>
    </div>
  );
};
