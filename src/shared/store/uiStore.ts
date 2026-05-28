import { create } from 'zustand';

export type PaneState = {
  id: string;
  tabs: string[]; // Document IDs
  activeTabId: string | null;
};

interface UiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;

  panes: PaneState[];
  activePaneId: string | null;
  addPane: (paneId: string, afterPaneId?: string) => void;
  removePane: (paneId: string) => void;
  setActivePane: (paneId: string) => void;

  openDocument: (docId: string, paneId?: string) => void;
  closeDocument: (docId: string, paneId: string) => void;
  setActiveTab: (docId: string, paneId: string) => void;
  moveTab: (docId: string, sourcePaneId: string, targetPaneId: string) => void;

  appearance: 'light' | 'dark' | 'system';
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void;

  selectedDailyNoteDate: Date;
  setSelectedDailyNoteDate: (date: Date) => void;
  isDailyNoteFullView: boolean;
  setDailyNoteFullView: (isOpen: boolean) => void;
}

const DEFAULT_PANE_ID = 'pane-main';

const getInitialAppearance = (): 'light' | 'dark' | 'system' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('appearance') as 'light' | 'dark' | 'system';
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  }
  return 'system';
};

export const useUiStore = create<UiState>((set, get) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  isRightSidebarOpen: false,
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

  selectedDailyNoteDate: new Date(),
  setSelectedDailyNoteDate: (selectedDailyNoteDate) => set({ selectedDailyNoteDate }),
  isDailyNoteFullView: false,
  setDailyNoteFullView: (isDailyNoteFullView) => set({ isDailyNoteFullView }),

  panes: [{ id: DEFAULT_PANE_ID, tabs: ['section-daily-notes'], activeTabId: 'section-daily-notes' }],
  activePaneId: DEFAULT_PANE_ID,

  appearance: getInitialAppearance(),
  setAppearance: (appearance) => {
    localStorage.setItem('appearance', appearance);
    set({ appearance });
  },

  addPane: (paneId, afterPaneId) => set((state) => {
    const newPane = { id: paneId, tabs: [], activeTabId: null };
    if (!afterPaneId) {
      return { panes: [...state.panes, newPane], activePaneId: paneId };
    }
    const index = state.panes.findIndex(p => p?.id === afterPaneId);
    if (index === -1) return state;
    const newPanes = [...state.panes];
    newPanes.splice(index + 1, 0, newPane);
    return { panes: newPanes, activePaneId: paneId };
  }),

  removePane: (paneId) => set((state) => {
    if (state.panes.length === 1) return state; // Don't remove last pane
    const newPanes = state.panes.filter(p => p?.id !== paneId);
    const newActivePaneId = state.activePaneId === paneId ? newPanes[0].id : state.activePaneId;
    return { panes: newPanes, activePaneId: newActivePaneId };
  }),

  setActivePane: (paneId) => set({ activePaneId: paneId }),

  openDocument: (docId, paneId) => set((state) => {
    const targetPaneId = paneId || state.activePaneId || DEFAULT_PANE_ID;
    const newPanes = state.panes.map(pane => {
      if (pane?.id === targetPaneId) {
        if (pane.tabs.includes(docId)) {
          return { ...pane, activeTabId: docId };
        } else {
          return { ...pane, tabs: [...pane.tabs, docId], activeTabId: docId };
        }
      }
      return pane;
    });
    return { panes: newPanes, activePaneId: targetPaneId };
  }),

  closeDocument: (docId, paneId) => set((state) => {
    const newPanes = state.panes.map(pane => {
      if (pane?.id === paneId) {
        const newTabs = pane.tabs.filter(id => id !== docId);
        let newActiveTabId = pane.activeTabId;
        if (newActiveTabId === docId) {
          newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
        }
        return { ...pane, tabs: newTabs, activeTabId: newActiveTabId };
      }
      return pane;
    });
    return { panes: newPanes };
  }),

  setActiveTab: (docId, paneId) => set((state) => {
    const newPanes = state.panes.map(pane => {
      if (pane?.id === paneId) {
        return { ...pane, activeTabId: docId };
      }
      return pane;
    });
    return { panes: newPanes, activePaneId: paneId };
  }),

  moveTab: (docId, sourcePaneId, targetPaneId) => set((state) => {
    if (sourcePaneId === targetPaneId) return state;

    // Simplistic move for now
    let sourcePaneUpdated = false;
    const newPanes = state.panes.map(pane => {
      if (pane?.id === sourcePaneId) {
        const newTabs = pane.tabs.filter(id => id !== docId);
        sourcePaneUpdated = true;
        return { ...pane, tabs: newTabs, activeTabId: pane.activeTabId === docId ? (newTabs[0] || null) : pane.activeTabId };
      }
      if (pane?.id === targetPaneId) {
        return { ...pane, tabs: [...pane.tabs, docId], activeTabId: docId };
      }
      return pane;
    });
    return { panes: newPanes, activePaneId: targetPaneId };
  }),
}));
