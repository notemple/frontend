import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PaneState = {
  id: string;
  tabs: string[]; // Document IDs
  activeTabId: string | null;
  width?: number; // Percentage width (e.g. 0 to 100)
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
  closeDocument: (docId: string, paneId?: string) => void;
  setActiveTab: (docId: string, paneId: string) => void;
  moveTab: (docId: string, sourcePaneId: string, targetPaneId: string) => void;

  appearance: 'light' | 'dark' | 'system';
  setAppearance: (appearance: 'light' | 'dark' | 'system') => void;

  selectedDailyNoteDate: Date;
  setSelectedDailyNoteDate: (date: Date) => void;
  isDailyNoteFullView: boolean;
  setDailyNoteFullView: (isOpen: boolean) => void;

  isNavbarManuallyHidden: boolean;
  setNavbarManuallyHidden: (hidden: boolean) => void;

  updatePaneWidths: (widths: { [paneId: string]: number }) => void;
  isTutorialActive: boolean;
  setIsTutorialActive: (active: boolean) => void;
  tutorialIndex: number;
  setTutorialIndex: (index: number) => void;
  startTutorial: () => void;
}

const DEFAULT_PANE_ID = 'pane-main';

const getInitialAppearance = (): 'light' | 'dark' | 'system' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('appearance') as 'light' | 'dark' | 'system';
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  }
  return 'system';
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      isRightSidebarOpen: false,
      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

      selectedDailyNoteDate: new Date(),
      setSelectedDailyNoteDate: (selectedDailyNoteDate) => set({ selectedDailyNoteDate }),
      isDailyNoteFullView: false,
      setDailyNoteFullView: (isDailyNoteFullView) => set({ isDailyNoteFullView }),

      panes: [{ id: DEFAULT_PANE_ID, tabs: ['section-glance'], activeTabId: 'section-glance', width: 100 }],
      activePaneId: DEFAULT_PANE_ID,

      appearance: getInitialAppearance(),
      setAppearance: (appearance) => {
        localStorage.setItem('appearance', appearance);
        set({ appearance });
      },

      isNavbarManuallyHidden: false,
      setNavbarManuallyHidden: (isNavbarManuallyHidden) => set({ isNavbarManuallyHidden }),

      isTutorialActive: false,
      setIsTutorialActive: (isTutorialActive) => set({ isTutorialActive }),
      tutorialIndex: 0,
      setTutorialIndex: (tutorialIndex) => set({ tutorialIndex }),
      startTutorial: () => {
        set({ isTutorialActive: true, tutorialIndex: 0, isSidebarOpen: true });
        get().openDocument('section-glance');
      },

      updatePaneWidths: (widths) => set((state) => ({
        panes: state.panes.map(pane => ({
          ...pane,
          width: widths[pane.id] !== undefined ? widths[pane.id] : (pane.width || (100 / state.panes.length))
        }))
      })),

      addPane: (paneId, afterPaneId) => set((state) => {
        const N = state.panes.length;
        const newWidth = 100 / (N + 1);
        const scale = N / (N + 1);
        
        // Scale existing pane widths proportionally to make room for new pane
        const scaledPanes = state.panes.map(pane => ({
          ...pane,
          width: (pane.width || (100 / N)) * scale
        }));
        
        const newPane = { id: paneId, tabs: [], activeTabId: null, width: newWidth };
        
        let updatedPanes: PaneState[] = [];
        if (!afterPaneId) {
          updatedPanes = [...scaledPanes, newPane];
        } else {
          const index = scaledPanes.findIndex(p => p?.id === afterPaneId);
          if (index === -1) {
            updatedPanes = [...scaledPanes, newPane];
          } else {
            updatedPanes = [...scaledPanes];
            updatedPanes.splice(index + 1, 0, newPane);
          }
        }
        
        return { panes: updatedPanes, activePaneId: paneId };
      }),

      removePane: (paneId) => set((state) => {
        if (state.panes.length === 1) return state; // Don't remove last pane
        
        const remainingPanes = state.panes.filter(p => p?.id !== paneId);
        const sumWidths = remainingPanes.reduce((sum, p) => sum + (p.width || 0), 0);
        const scale = sumWidths > 0 ? (100 / sumWidths) : (100 / remainingPanes.length);
        
        // Scale remaining pane widths proportionally to fill the empty space
        const updatedPanes = remainingPanes.map(pane => ({
          ...pane,
          width: (pane.width || (100 / (remainingPanes.length + 1))) * scale
        }));
        
        const newActivePaneId = state.activePaneId === paneId ? updatedPanes[0].id : state.activePaneId;
        return { panes: updatedPanes, activePaneId: newActivePaneId };
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
          if (!paneId || pane?.id === paneId) {
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
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        isRightSidebarOpen: state.isRightSidebarOpen,
        panes: state.panes,
        activePaneId: state.activePaneId,
        appearance: state.appearance,
        isNavbarManuallyHidden: state.isNavbarManuallyHidden,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state) {
            const allPanesEmpty = !state.panes || state.panes.every(pane => !pane.tabs || pane.tabs.length === 0);
            if (allPanesEmpty) {
              state.panes = [{
                id: 'pane-main',
                tabs: ['section-glance'],
                activeTabId: 'section-glance',
                width: 100
              }];
              state.activePaneId = 'pane-main';
            }
          }
        };
      }
    }
  )
);
