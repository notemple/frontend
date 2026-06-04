import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '@/features/settings/store';
import { useTaskTimerStore } from '@/shared/store/taskTimerStore';
import { useTaskStore } from '@/features/tasks/store';
import { formatInTimeZone } from 'date-fns-tz';
import { useDocumentStore } from '@/features/documents/store';

// ─── Types ─────────────────────────────────────────────────────────────────

interface TutorialStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  color: string;
  sidebarOpen: boolean;
  page?: string;
  interactive?: boolean;
}

type SearchPhase = 'wait-open' | 'wait-arrows' | 'done';

// ─── Keyboard badge component ──────────────────────────────────────────────

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd
    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
    style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.14)',
      color: 'rgba(255,255,255,0.75)',
      boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
    }}
  >
    {children}
  </kbd>
);

// ─── Progress pip component ────────────────────────────────────────────────

const ProgressPips = ({ total, current, color }: { total: number; current: number; color: string }) => (
  <div className="flex gap-1">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? 14 : 6,
          height: 6,
          backgroundColor: i === current ? color : '#27272a',
        }}
      />
    ))}
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────

export const SpotlightTutorial = () => {
  const {
    isTutorialActive,
    setIsTutorialActive,
    tutorialIndex,
    setTutorialIndex,
    panes,
    activePaneId,
  } = useUiStore(
    useShallow((state) => ({
      isTutorialActive: state.isTutorialActive,
      setIsTutorialActive: state.setIsTutorialActive,
      tutorialIndex: state.tutorialIndex,
      setTutorialIndex: state.setTutorialIndex,
      panes: state.panes,
      activePaneId: state.activePaneId,
    }))
  );

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  // Dispatch a custom event to imperatively close the command palette
  const closePalette = () => window.dispatchEvent(new Event('tutorial:close-palette'));

  // Onboarding States
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [initialCapturesCount, setInitialCapturesCount] = useState<number>(0);

  // Sub-step states
  const [slashPhase, setSlashPhase] = useState<'wait-slash' | 'wait-select' | 'done'>('wait-slash');
  const [splitPhase, setSplitPhase] = useState<'wait-split' | 'wait-move' | 'done'>('wait-split');
  const [initialActivePaneId, setInitialActivePaneId] = useState<string | null>(null);
  const [initialTaskCount, setInitialTaskCount] = useState<number>(0);
  const [initialTaskIds, setInitialTaskIds] = useState<string[]>([]);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const [createdFolderId, setCreatedFolderId] = useState<string | null>(null);
  const [initialFolderIds, setInitialFolderIds] = useState<string[]>([]);
  const [mentionPhase, setMentionPhase] = useState<'wait-at' | 'wait-select' | 'done'>('wait-at');
  const [taskEditorPhase, setTaskEditorPhase] = useState<'write' | 'done'>('write');

  // ─── Compute Linear Tutorial Steps ────────────────────────────────────────
  const steps = useMemo<TutorialStep[]>(() => {
    return [
      {
        id: 'glance',
        targetId: 'onboarding-quick-capture',
        title: 'Quick Capture Box',
        description: 'Type a note in the quick capture box below, select the Note pill, and press Enter to submit.',
        color: '#BDE0FE',
        sidebarOpen: false,
        page: 'section-glance',
        interactive: true,
      },
      {
        id: 'note-slash',
        targetId: 'onboarding-editor',
        title: 'Daily Note Editor',
        description: '', // driven dynamically
        color: '#FFC8DD',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'note-minimize',
        targetId: 'onboarding-daily-note-minimize',
        title: 'Minimize Daily Note',
        description: 'Click the Daily Notes button to minimize the editor and return to the dashboard.',
        color: '#B5EAD7',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'daily-notes-page',
        targetId: 'onboarding-tab-bar',
        title: 'Daily Notes Page',
        description: 'This is your Daily Notes page. Here you can see your notes, tasks, and history for the day.',
        color: '#B5EAD7',
        sidebarOpen: false,
      },
      {
        id: 'pane-split',
        targetId: 'onboarding-tab-bar',
        title: 'Splitting Workspaces',
        description: 'Press Ctrl+Alt+N (or ⌘⌥N) to split the workspace into two panes.',
        color: '#FFDAC1',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'pane-switch',
        targetId: 'onboarding-tab-bar',
        title: 'Switching Pane Focus',
        description: 'Press Ctrl+Alt+J or Ctrl+Alt+H (or ⌘⌥J/H) to move focus to the other pane.',
        color: '#E8C5E5',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'search-open',
        targetId: 'onboarding-tab-bar',
        title: 'Open Document Search',
        description: 'Press Ctrl+K (or ⌘K) to open the document search palette.',
        color: '#A0C4FF',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'search-tasks',
        targetId: 'onboarding-command-palette',
        title: 'Search and Open Tasks',
        description: 'Type "Tasks" and press Enter to open the Tasks board.',
        color: '#A0C4FF',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'task-add-click',
        targetId: 'onboarding-add-task-button',
        title: 'Create a New Task',
        description: 'Click the purple button to open the task creator.',
        color: '#C7CEEA',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'task-add-input',
        targetId: 'onboarding-create-task-input',
        title: 'Task Title',
        description: 'Type your task title and click Create Task or press Enter.',
        color: '#C7CEEA',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'task-guide',
        targetId: 'onboarding-editor',
        title: 'Task Management & Timer',
        description: 'Click the Play button next to your task to start the stopwatch/timer.',
        color: '#C7CEEA',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'task-edit-click',
        targetId: 'onboarding-editor',
        title: 'Task Editor Window',
        description: 'Click the edit arrow button next to the task to open the editor window.',
        color: '#C7CEEA',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'task-edit-modal',
        targetId: 'onboarding-task-editor-close',
        title: 'Task Details',
        description: 'Type something in the task notes editor. After 5 seconds, close it.',
        color: '#C7CEEA',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'pane-close',
        targetId: 'onboarding-tab-bar',
        title: 'Closing a Pane',
        description: 'Press Ctrl+Alt+Q (or ⌘⌥Q) to close the active pane and return to a single view.',
        color: '#FFB7B2',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'sidebar-open',
        targetId: 'onboarding-tab-bar',
        title: 'Open Sidebar',
        description: 'Press Ctrl+Alt+L (or ⌘⌥L) to open the sidebar.',
        color: '#BDE0FE',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'folder-create',
        targetId: 'onboarding-create-folder-button',
        title: 'Create a Folder',
        description: 'Click the + button next to Folders to create a new folder.',
        color: '#FFDAC1',
        sidebarOpen: true,
        interactive: true,
      },
      {
        id: 'folder-open',
        targetId: 'onboarding-create-folder-button', // Will be overridden dynamically
        title: 'Open the Folder',
        description: 'Click on the newly created folder in the sidebar to open its dashboard view.',
        color: '#B5EAD7',
        sidebarOpen: true,
        interactive: true,
      },
      {
        id: 'folder-create-doc',
        targetId: 'onboarding-create-note-in-folder-button',
        title: 'New Note in Folder',
        description: 'Click the plus button in the folder view to create a new document inside this folder.',
        color: '#BDE0FE',
        sidebarOpen: true,
        interactive: true,
      },
      {
        id: 'doc-title',
        targetId: 'onboarding-document-title-input',
        title: 'Document Title',
        description: 'Type a title for your new document and press Enter.',
        color: '#FFC8DD',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'doc-mention',
        targetId: 'onboarding-editor',
        title: 'Mention a Task',
        description: 'Type @ inside the editor to open the mentions menu, and select a task to reference.',
        color: '#B5EAD7',
        sidebarOpen: false,
        interactive: true,
      },
      {
        id: 'settings-tab',
        targetId: 'onboarding-settings-tab',
        title: 'Settings & Customization',
        description: 'Open the Settings page from the bottom of the sidebar to customize your preferences.',
        color: '#FFF5C3',
        sidebarOpen: true,
      },
      {
        id: 'settings-colors',
        targetId: 'onboarding-color-presets',
        title: 'Pane Highlight Colors',
        description: 'Choose from solid or gradient preset colors to personalize the active pane indicator.',
        color: '#BDE0FE',
        sidebarOpen: false,
        page: 'section-settings',
      },
      {
        id: 'settings-autohide',
        targetId: 'onboarding-autohide-toggle',
        title: 'Auto-Hide Sidebars',
        description: 'Toggle these switches to auto-collapse the top navbar and sidebars. They slide open on hover.',
        color: '#FFDAC1',
        sidebarOpen: false,
        page: 'section-settings',
      }
    ];
  }, []);

  const currentStep = steps[tutorialIndex] || steps[0];

  // ── Reset sub-states when entering interactive steps
  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.id === 'note-slash') setSlashPhase('wait-slash');
    if (currentStep.id === 'pane-split') setSplitPhase('wait-split');
    if (currentStep.id === 'pane-switch') setInitialActivePaneId(useUiStore.getState().activePaneId);
    if (currentStep.id === 'task-add-input') {
      setInitialTaskCount(useTaskStore.getState().tasks.filter(t => !t.completed && t.status !== 'done').length);
      setInitialTaskIds(useTaskStore.getState().tasks.map(t => t.id));
    }
    if (currentStep.id === 'folder-create') {
      setInitialFolderIds(useDocumentStore.getState().folders.map(f => f.id));
    }
    if (currentStep.id === 'doc-mention') {
      setMentionPhase('wait-at');
    }
  }, [tutorialIndex, currentStep]);

  // ── Reset when tutorial is restarted or at index 0
  useEffect(() => {
    if (tutorialIndex === 0) {
      setCreatedDocId(null);
      setCreatedTaskId(null);
      setCreatedFolderId(null);
      setInitialTaskIds([]);
      setInitialFolderIds([]);
      try {
        const saved = localStorage.getItem("glance-captures");
        const list = saved ? JSON.parse(saved) : [];
        setInitialCapturesCount(list.length);
      } catch (_) {
        setInitialCapturesCount(0);
      }
    }
  }, [tutorialIndex]);

  // ── Stage sync: open page + sidebar per step
  useEffect(() => {
    if (!isTutorialActive || !currentStep) return;

    if (currentStep.id === 'glance') {
      useUiStore.getState().openDocument('section-glance');
    } else if (currentStep.id === 'note-slash' || currentStep.id === 'note-minimize' || currentStep.id === 'daily-notes-page') {
      if (currentStep.id === 'daily-notes-page') {
        useUiStore.getState().openDocument('section-daily-notes');
      } else {
        const todayDateStr = formatInTimeZone(new Date(), useSettingsStore.getState().timezone, "yyyy-MM-dd");
        const dailyNoteId = `daily-note-${todayDateStr}`;
        useUiStore.getState().openDocument(dailyNoteId);
      }
    } else if (currentStep.id === 'task-add-click' || currentStep.id === 'task-add-input' || currentStep.id === 'task-guide' || currentStep.id === 'task-edit-click' || currentStep.id === 'task-edit-modal') {
      useUiStore.getState().openDocument('section-tasks');
    } else if (currentStep.id === 'pane-split' || currentStep.id === 'pane-switch' || currentStep.id === 'pane-close') {
      // Don't automatically create a new document after finishing daily notes
    } else if (currentStep.id === 'folder-create-doc') {
      if (createdFolderId) {
        useUiStore.getState().openDocument(`section-folder-${createdFolderId}`);
      }
    } else if (currentStep.id === 'doc-title' || currentStep.id === 'doc-mention') {
      if (createdDocId) {
        useUiStore.getState().openDocument(createdDocId);
      }
    } else if (currentStep.id === 'settings-colors' || currentStep.id === 'settings-autohide') {
      useUiStore.getState().openDocument('section-settings');
    }

    useUiStore.setState({ isSidebarOpen: currentStep.sidebarOpen });
  }, [tutorialIndex, isTutorialActive, currentStep, createdDocId, createdFolderId]);

  // ── Settings page scroll: top for color presets, bottom for autohide
  useEffect(() => {
    if (!isTutorialActive || !currentStep) return;
    const scroller = document.getElementById('settings-scroll-container');
    if (!scroller) return;

    if (currentStep.id === 'settings-colors') {
      const t = setTimeout(() => scroller.scrollTo({ top: 0, behavior: 'smooth' }), 450);
      return () => clearTimeout(t);
    }

    if (currentStep.id === 'settings-autohide') {
      const t = setTimeout(() => {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
      }, 450);
      return () => clearTimeout(t);
    }
  }, [currentStep, isTutorialActive]);

  // ── Step 1 (Glance): poll for quick capture note submission
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'glance') return;
    const iv = setInterval(() => {
      try {
        const saved = localStorage.getItem("glance-captures");
        const list = saved ? JSON.parse(saved) : [];
        if (list.length > initialCapturesCount) {
          const latest = list[0];
          if (latest && latest.type === 'Note') {
            setTimeout(() => setTutorialIndex(1), 500);
          }
        }
      } catch (_) {}
    }, 200);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, initialCapturesCount, setTutorialIndex]);

  // ── Task Guide: auto-advance effects
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'task-add-click') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-create-task-input');
      if (el) {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, tutorialIndex, setTutorialIndex]);

  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'task-add-input') return;
    const iv = setInterval(() => {
      const allTasks = useTaskStore.getState().tasks;
      const newCreated = allTasks.find(t => !initialTaskIds.includes(t.id));
      if (newCreated) {
        setCreatedTaskId(newCreated.id);
        const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 500);
        return () => clearTimeout(t);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, initialTaskIds, tutorialIndex, setTutorialIndex]);

  const timers = useTaskTimerStore((s) => s.timers);
  const isAnyTimerRunning = Object.values(timers).some((t) => t.isRunning);

  useEffect(() => {
    if (isTutorialActive && currentStep?.id === 'task-guide' && isAnyTimerRunning) {
      const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [isAnyTimerRunning, tutorialIndex, isTutorialActive, currentStep, setTutorialIndex]);

  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'task-edit-click') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-task-editor-modal');
      if (el) {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, tutorialIndex, setTutorialIndex]);

  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'task-edit-modal') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-task-editor-modal');
      if (!el) {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, tutorialIndex, setTutorialIndex]);

  // ── Note Guide (Slash Command): poll for slash list menu
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'note-slash') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-slash-command-list');
      if (el && slashPhase === 'wait-slash') {
        setSlashPhase('wait-select');
      } else if (!el && slashPhase === 'wait-select') {
        setSlashPhase('done');
      }
    }, 150);
    return () => clearInterval(iv);
  }, [slashPhase, currentStep, isTutorialActive]);

  // Note Guide (Slash Command): Next button will be enabled after typing a todo title, or auto-advance after 5 seconds
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'note-slash' || slashPhase !== 'done') return;

    const t = setTimeout(() => {
      setTutorialIndex(tutorialIndex + 1);
    }, 5000);

    return () => clearTimeout(t);
  }, [isTutorialActive, currentStep, slashPhase, tutorialIndex, setTutorialIndex]);

  // ── Note Minimize: auto-advance 5 seconds after Daily Notes editor is minimized
  const noteMinimizeTriggeredRef = useRef(false);
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'note-minimize') {
      noteMinimizeTriggeredRef.current = false;
      return;
    }
    const iv = setInterval(() => {
      if (noteMinimizeTriggeredRef.current) return;
      const activePane = useUiStore.getState().panes.find(p => p.id === useUiStore.getState().activePaneId);
      if (activePane?.activeTabId === 'section-daily-notes') {
        noteMinimizeTriggeredRef.current = true;
        setTimeout(() => {
          setTutorialIndex(tutorialIndex + 1);
        }, 5000);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Search Open: watch for command palette in DOM
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'search-open') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-command-palette');
      if (el) {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Search Tasks: watch for Tasks section active tab
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'search-tasks') return;
    const iv = setInterval(() => {
      const activePane = useUiStore.getState().panes.find(p => p.id === useUiStore.getState().activePaneId);
      if (activePane?.activeTabId === 'section-tasks') {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Task Edit Modal notes: poll for notes content typed in task editor and transition phase
  const taskEditorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'task-edit-modal' || !createdTaskId) return;

    const iv = setInterval(() => {
      if (taskEditorPhase !== 'write') return;
      const doc = useDocumentStore.getState().documents[`task-${createdTaskId}`];
      if (doc && doc.content) {
        const textContent = doc.content.replace(/<[^>]*>/g, '').trim();
        if (textContent.length > 0) {
          if (!taskEditorTimerRef.current) {
            taskEditorTimerRef.current = setTimeout(() => {
              setTaskEditorPhase('done');
            }, 5000);
          }
        }
      }
    }, 200);

    return () => {
      clearInterval(iv);
      if (taskEditorTimerRef.current) {
        clearTimeout(taskEditorTimerRef.current);
        taskEditorTimerRef.current = null;
      }
    };
  }, [currentStep, isTutorialActive, createdTaskId, taskEditorPhase]);

  // ── Sidebar Open: watch for isSidebarOpen to become true
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'sidebar-open') return;
    const iv = setInterval(() => {
      const isSidebarOpen = useUiStore.getState().isSidebarOpen;
      if (isSidebarOpen) {
        setTutorialIndex(tutorialIndex + 1);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Pane Split: watch pane count
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'pane-split') return;
    if (splitPhase === 'wait-split' && panes.length > 1) {
      setSplitPhase('wait-move');
      const firstPaneId = panes[0]?.id || 'pane-main';
      useUiStore.setState({ activePaneId: firstPaneId });
    }
  }, [panes.length, splitPhase, currentStep, isTutorialActive]);

  useEffect(() => {
    if (isTutorialActive && currentStep?.id === 'pane-split' && splitPhase === 'wait-move') {
      const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [splitPhase, tutorialIndex, isTutorialActive, currentStep, setTutorialIndex]);

  // ── Pane Switch Focus: watch activePaneId change
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'pane-switch' || !initialActivePaneId) return;
    if (activePaneId !== initialActivePaneId) {
      const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [activePaneId, initialActivePaneId, currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Pane Close: watch pane count reduce to 1
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'pane-close') return;
    if (panes.length === 1) {
      const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [panes.length, currentStep, isTutorialActive, setTutorialIndex, tutorialIndex]);

  // ── Folder Create: poll for new folder creation
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'folder-create') return;
    const iv = setInterval(() => {
      const allFolders = useDocumentStore.getState().folders;
      const newCreated = allFolders.find(f => f && !f.isDeleted && !initialFolderIds.includes(f.id));
      if (newCreated) {
        setCreatedFolderId(newCreated.id);
        const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 500);
        return () => clearTimeout(t);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, initialFolderIds, tutorialIndex, setTutorialIndex]);

  // ── Folder Open: poll activeTabId matching folder dashboard
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'folder-open' || !createdFolderId) return;
    const iv = setInterval(() => {
      const activePane = useUiStore.getState().panes.find(p => p.id === useUiStore.getState().activePaneId);
      if (activePane?.activeTabId === `section-folder-${createdFolderId}`) {
        const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 500);
        return () => clearTimeout(t);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, createdFolderId, tutorialIndex, setTutorialIndex]);

  // ── Folder Create Doc: poll activeTabId matching new doc in folder
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'folder-create-doc' || !createdFolderId) return;
    const iv = setInterval(() => {
      const activePane = useUiStore.getState().panes.find(p => p.id === useUiStore.getState().activePaneId);
      const activeTabId = activePane?.activeTabId;
      if (activeTabId && activeTabId.startsWith('doc-')) {
        const doc = useDocumentStore.getState().documents[activeTabId];
        if (doc && doc.folderId === createdFolderId) {
          setCreatedDocId(activeTabId);
          const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 500);
          return () => clearTimeout(t);
        }
      }
    }, 150);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, createdFolderId, tutorialIndex, setTutorialIndex]);

  // ── Doc Title: poll for document title type input
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'doc-title' || !createdDocId) return;
    const iv = setInterval(() => {
      const doc = useDocumentStore.getState().documents[createdDocId];
      if (doc && doc.title && doc.title.trim().length > 0) {
        const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
        return () => clearTimeout(t);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [currentStep, isTutorialActive, createdDocId, tutorialIndex, setTutorialIndex]);

  // ── Doc Mention: poll for mention list popup open/close
  useEffect(() => {
    if (!isTutorialActive || currentStep?.id !== 'doc-mention') return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-mention-list');
      if (el && mentionPhase === 'wait-at') {
        setMentionPhase('wait-select');
      } else if (!el && mentionPhase === 'wait-select') {
        setMentionPhase('done');
      }
    }, 150);
    return () => clearInterval(iv);
  }, [mentionPhase, currentStep, isTutorialActive]);

  useEffect(() => {
    if (isTutorialActive && currentStep?.id === 'doc-mention' && mentionPhase === 'done') {
      const t = setTimeout(() => setTutorialIndex(tutorialIndex + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [mentionPhase, tutorialIndex, isTutorialActive, currentStep, setTutorialIndex]);

  // ── Close command palette when tutorial finishes
  useEffect(() => {
    if (!isTutorialActive) closePalette();
  }, [isTutorialActive]);

  // ── Restore focus on unmount
  useEffect(() => {
    return () => { setTimeout(() => document.body.focus(), 50); };
  }, []);

  // ── Spotlight rectangle updater
  const updateRect = useCallback(() => {
    if (!isTutorialActive || !currentStep) { setSpotlightRect(null); return; }

    let targetId = currentStep.targetId;
    let customEl: HTMLElement | null = null;

    if (currentStep.id === 'glance') {
      const textarea = document.querySelector('#onboarding-quick-capture textarea') as HTMLTextAreaElement;
      const hasTyped = textarea && textarea.value.trim().length > 0;
      const notePill = document.getElementById('onboarding-quick-capture-note-pill');
      const isNoteSelected = notePill && notePill.getAttribute('data-selected') === 'true';
      const isHighlighted = notePill && notePill.getAttribute('data-highlighted') === 'true';

      if (hasTyped && !isNoteSelected && isHighlighted) {
        customEl = notePill;
      } else if (hasTyped && isNoteSelected) {
        customEl = document.getElementById('onboarding-quick-capture-submit-button');
      } else {
        customEl = document.getElementById('onboarding-quick-capture');
      }
    } else if (currentStep.id === 'pane-switch') {
      customEl = document.querySelector(`[data-pane-id="${activePaneId}"]`) as HTMLElement;
    } else if (currentStep.id === 'daily-notes-page') {
      if (activePaneId) {
        customEl = document.querySelector(`[data-pane-id="${activePaneId}"]`) as HTMLElement;
      }
    } else if (currentStep.id === 'task-guide') {
      const selector = createdTaskId ? `[data-onboarding-timer-play="${createdTaskId}"]` : '[data-onboarding-timer-play]';
      customEl = document.querySelector(selector) as HTMLElement;
    } else if (currentStep.id === 'task-edit-click') {
      const selector = createdTaskId ? `[data-onboarding-task-edit="${createdTaskId}"]` : '[data-onboarding-task-edit]';
      customEl = document.querySelector(selector) as HTMLElement;
    } else if (currentStep.id === 'task-edit-modal') {
      if (taskEditorPhase === 'write') {
        customEl = document.querySelector('#onboarding-task-editor-modal #onboarding-editor') as HTMLElement;
      } else {
        customEl = document.getElementById('onboarding-task-editor-close');
      }
    } else if (currentStep.id === 'sidebar-open') {
      if (activePaneId) {
        customEl = document.querySelector(`[data-pane-id="${activePaneId}"]`) as HTMLElement;
      }
    } else if (currentStep.id === 'folder-open') {
      const selector = createdFolderId ? `[data-onboarding-folder-item="${createdFolderId}"]` : '[data-onboarding-folder-item]';
      customEl = document.querySelector(selector) as HTMLElement;
    } else if (currentStep.id === 'doc-mention') {
      const mentionEl = document.getElementById('onboarding-mention-list');
      if (mentionEl) {
        customEl = mentionEl;
      } else {
        if (activePaneId) {
          customEl = document.querySelector(`[data-onboarding-editor="${activePaneId}"]`) as HTMLElement;
        }
      }
    }

    if (!customEl && activePaneId) {
      if (targetId === 'onboarding-tab-bar') {
        customEl = document.querySelector(`[data-onboarding-tab-bar="${activePaneId}"]`) as HTMLElement;
      } else if (targetId === 'onboarding-editor') {
        customEl = document.querySelector(`[data-onboarding-editor="${activePaneId}"]`) as HTMLElement;
      } else if (targetId === 'onboarding-daily-note-minimize') {
        customEl = document.querySelector(`[data-onboarding-daily-note-minimize="${activePaneId}"]`) as HTMLElement;
      }
    }

    const el = customEl || document.getElementById(targetId);
    setSpotlightRect(el ? el.getBoundingClientRect() : null);
  }, [tutorialIndex, isTutorialActive, activePaneId, currentStep, createdTaskId, createdFolderId, taskEditorPhase]);

  useEffect(() => {
    updateRect();
    const iv = setInterval(updateRect, 200);
    window.addEventListener('resize', updateRect);
    return () => { clearInterval(iv); window.removeEventListener('resize', updateRect); };
  }, [updateRect]);

  // ─────────────────────────────────────────────────────────────────────────

  if (!isTutorialActive || !currentStep) return null;

  const taskItems = document.querySelectorAll('[data-type="taskItem"]');
  const hasFiveCharsTask = Array.from(taskItems).some(item => (item.textContent?.trim() || "").length >= 5);

  const isInteractive = currentStep.interactive === true;

  const skipStep = () => {
    if (tutorialIndex < steps.length - 1) setTutorialIndex(tutorialIndex + 1);
    else setIsTutorialActive(false);
  };
  
  const handleBack = () => {
    if (tutorialIndex > 0) setTutorialIndex(tutorialIndex - 1);
  };
  
  const nextTutorial = () => {
    if (tutorialIndex < steps.length - 1) setTutorialIndex(tutorialIndex + 1);
    else setIsTutorialActive(false);
  };

  const interactiveStepIds = [
    'glance', 'note-slash', 'note-minimize',
    'pane-split', 'pane-switch',
    'search-open', 'search-tasks',
    'task-add-click', 'task-add-input', 'task-guide', 'task-edit-click', 'task-edit-modal',
    'pane-close', 'sidebar-open',
    'folder-create', 'folder-open', 'folder-create-doc', 'doc-title', 'doc-mention'
  ];
  let showNext = !interactiveStepIds.includes(currentStep.id);
  if (currentStep.id === 'note-slash' && slashPhase === 'done' && hasFiveCharsTask) {
    showNext = true;
  }

  // ── Dynamic description for interactive steps
  const description = (() => {
    if (currentStep.id === 'glance') {
      return 'Type a note in the quick capture box below, select the Note pill, and press Enter to submit.';
    }
    if (currentStep.id === 'note-slash') {
      if (slashPhase === 'wait-slash') {
        return 'Type / in the editor to open the slash commands menu, then select Todo List to create a todo item.';
      }
      if (slashPhase === 'wait-select') {
        return 'Menu open! Scroll down or type to select the Todo List option, and press Enter.';
      }
      // Check if they typed a title yet
      if (!hasFiveCharsTask) {
        return 'Type at least 5 characters for your todo title, click Next, or wait 5 seconds to move to the next step.';
      }
      return '🎉 Title entered! Click Next to move to the next step.';
    }
    if (currentStep.id === 'note-minimize') {
      return 'Click the Daily Notes button to minimize the editor and return to the dashboard.';
    }
    if (currentStep.id === 'daily-notes-page') {
      return 'This is your Daily Notes page. Here you can see your notes, tasks, and history for the day. Click Next to continue.';
    }
    if (currentStep.id === 'pane-split') {
      if (splitPhase === 'wait-split') return null;
      return '🎉 Pane split! Moving to the next step…';
    }
    if (currentStep.id === 'pane-switch') {
      return 'Press Ctrl+Alt+J or Ctrl+Alt+H (or ⌘⌥J/H) to move focus to the other pane.';
    }
    if (currentStep.id === 'search-open') {
      return 'Press Ctrl+K (or ⌘K) to open the document search palette.';
    }
    if (currentStep.id === 'search-tasks') {
      return 'Type "Tasks" and press Enter to open the Tasks board.';
    }
    if (currentStep.id === 'task-add-click') {
      return 'Click the purple button to open the task creator.';
    }
    if (currentStep.id === 'task-add-input') {
      return 'Type your task title and click Create Task or press Enter.';
    }
    if (currentStep.id === 'task-guide') {
      return 'Click the Play button next to the newly created task to start the stopwatch and track your time.';
    }
    if (currentStep.id === 'task-edit-click') {
      return 'Click the edit arrow button next to the task to open the editor window.';
    }
    if (currentStep.id === 'task-edit-modal') {
      if (taskEditorPhase === 'write') {
        return 'Type some notes/thoughts about your task in the editor.';
      }
      return '🎉 Done writing! Click the X button to close the task editor.';
    }
    if (currentStep.id === 'pane-close') {
      return 'Press Ctrl+Alt+Q (or ⌘⌥Q) to close the active pane.';
    }
    if (currentStep.id === 'sidebar-open') {
      return 'Press Ctrl+Alt+L (or ⌘⌥L) to open the sidebar.';
    }
    if (currentStep.id === 'folder-create') {
      return 'Open the sidebar and click the + button next to Folders to create a new folder.';
    }
    if (currentStep.id === 'folder-open') {
      return 'Click on the newly created folder in the sidebar to open its dashboard view.';
    }
    if (currentStep.id === 'folder-create-doc') {
      return 'Click the plus button in the folder view to create a new document inside this folder.';
    }
    if (currentStep.id === 'doc-title') {
      return 'Type a title for your new document and press Enter.';
    }
    if (currentStep.id === 'doc-mention') {
      if (mentionPhase === 'wait-at') {
        return 'Type @ in the editor to open the mentions menu.';
      }
      if (mentionPhase === 'wait-select') {
        return 'Mentions popup open! Select a task to reference it inside your document.';
      }
      return '🎉 Task referenced!';
    }
    return currentStep.description;
  })();

  // ── Tooltip position
  const pad = 16;
  const cardW = 340;
  let cardStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  if (spotlightRect) {
    const spaceBelow = window.innerHeight - spotlightRect.bottom;
    const spaceAbove = spotlightRect.top;
    const centreX = spotlightRect.left + spotlightRect.width / 2;
    const clampedLeft = Math.max(pad, Math.min(window.innerWidth - cardW - pad, centreX - cardW / 2));
    cardStyle = {
      left: clampedLeft,
      ...(spaceBelow > 240
        ? { top: spotlightRect.bottom + 16 }
        : spaceAbove > 240
        ? { bottom: window.innerHeight - spotlightRect.top + 16 }
        : { top: pad }),
    };
  }

  const PAD = 10;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Dark overlay with cutout — non-blocking during interactive steps */}
      <svg
        className="fixed inset-0 w-full h-full z-[9998]"
        style={{
          pointerEvents: isInteractive ? 'none' : 'auto',
          transition: 'opacity 0.3s ease',
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                 x={spotlightRect.x - PAD}
                 y={spotlightRect.y - PAD}
                 width={spotlightRect.width + PAD * 2}
                 height={spotlightRect.height + PAD * 2}
                 rx={10}
                 fill="black"
                 style={{ transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)' }}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(5,5,5,0.78)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Glowing pastel border ring around target element */}
      {spotlightRect && (
        <div
          className="absolute rounded-xl pointer-events-none z-[9999]"
          style={{
            top: spotlightRect.y - PAD,
            left: spotlightRect.x - PAD,
            width: spotlightRect.width + PAD * 2,
            height: spotlightRect.height + PAD * 2,
            border: `1.5px solid ${currentStep.color}70`,
            boxShadow: `0 0 18px ${currentStep.color}28, inset 0 0 8px ${currentStep.color}08`,
            transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      )}

      {/* ── Tooltip card ─────────────────────────────────────────────── */}
      <div
        className="fixed pointer-events-auto z-[9999] flex flex-col gap-3.5"
        style={{
          width: cardW,
          background: 'rgba(9,9,11,0.97)',
          border: `1px solid ${currentStep.color}28`,
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: `0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`,
          backdropFilter: 'blur(12px)',
          transition: 'border-color 0.3s ease',
          ...cardStyle,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold tracking-[0.12em] uppercase font-mono"
            style={{ color: currentStep.color }}
          >
            Step {tutorialIndex + 1} / {steps.length}
          </span>
          <ProgressPips total={steps.length} current={tutorialIndex} color={currentStep.color} />
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-bold text-white leading-snug -mt-1">
          {currentStep.title}
        </h3>

        {/* ── Contextual body for interactive steps ── */}

        {/* Step 1 — Glance Quick Capture */}
        {currentStep.id === 'glance' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type some text, select <strong className="text-zinc-200">Note</strong>, and press Enter to see it sync.
            </p>
          </div>
        )}

        {/* Task Guide: Add Task Click */}
        {currentStep.id === 'task-add-click' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-zinc-200">purple button</strong> to open the task creator.
            </p>
          </div>
        )}

        {/* Task Guide: Add Task Input */}
        {currentStep.id === 'task-add-input' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type your task title and click <strong className="text-zinc-200">Create Task</strong> or press Enter.
            </p>
          </div>
        )}

        {/* Task Guide: Timer */}
        {currentStep.id === 'task-guide' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-green-400">Play button</strong> next to your task to start tracking time.
            </p>
            <div className="flex items-center gap-1">
              <Kbd>Play</Kbd>
            </div>
          </div>
        )}

        {/* Task Guide: Edit Task Click */}
        {currentStep.id === 'task-edit-click' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-zinc-200">edit button</strong> (arrow circle) next to your task to open details.
            </p>
          </div>
        )}

        {/* Task Guide: Edit Task Modal */}
        {currentStep.id === 'task-edit-modal' && taskEditorPhase === 'write' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type some notes/thoughts about your task in the editor.
            </p>
          </div>
        )}
        {currentStep.id === 'task-edit-modal' && taskEditorPhase === 'done' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              🎉 Notes recorded! Click the <strong className="text-zinc-200">X button</strong> to close the task editor.
            </p>
          </div>
        )}

        {/* Note Guide: Slash Commands */}
        {currentStep.id === 'note-slash' && slashPhase === 'wait-slash' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type <strong className="text-zinc-200">/</strong> in the editor to open the slash commands menu, then select <strong className="text-zinc-200">Todo List</strong>.
            </p>
            <div className="flex items-center gap-1.5">
              <Kbd>/</Kbd>
            </div>
          </div>
        )}
        {currentStep.id === 'note-slash' && slashPhase === 'wait-select' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed" style={{ color: currentStep.color }}>
              ✓ Menu open! Now scroll down or type to select the <strong className="text-zinc-200">Todo List</strong> option, and press Enter.
            </p>
          </div>
        )}
        {currentStep.id === 'note-slash' && slashPhase === 'done' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {hasFiveCharsTask 
                ? '🎉 Title entered! Click Next to move to the next step.'
                : 'Type at least 5 characters for your todo title, click Next, or wait 5 seconds to move to the next step.'
              }
            </p>
          </div>
        )}

        {/* Note Guide: Minimize button */}
        {currentStep.id === 'note-minimize' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-zinc-200">Daily Notes</strong> button to minimize the editor and return to the dashboard.
            </p>
          </div>
        )}

        {/* Pane split */}
        {currentStep.id === 'pane-split' && splitPhase === 'wait-split' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the shortcut to <strong className="text-zinc-200">split</strong> the workspace into two panes.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>N</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>⌥</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>N</Kbd></span>
            </div>
          </div>
        )}
        {currentStep.id === 'pane-split' && splitPhase === 'wait-move' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Pane split! Moving to the next step…
          </p>
        )}

        {/* Pane focus switch */}
        {currentStep.id === 'pane-switch' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the shortcut to switch your active focus to the other pane.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>J</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">or</span>
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>H</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘⌥J</Kbd> or <Kbd>⌘⌥H</Kbd></span>
            </div>
          </div>
        )}

        {/* Search Open */}
        {currentStep.id === 'search-open' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the shortcut to open the document search palette.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>K</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>K</Kbd></span>
            </div>
          </div>
        )}

        {/* Search Tasks */}
        {currentStep.id === 'search-tasks' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type <strong className="text-zinc-200">Tasks</strong> and press Enter to open the Tasks board.
            </p>
          </div>
        )}

        {/* Pane close */}
        {currentStep.id === 'pane-close' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the shortcut to <strong className="text-zinc-200">close / quit</strong> the active pane.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Q</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>⌥</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>Q</Kbd></span>
            </div>
          </div>
        )}

        {/* Sidebar Open */}
        {currentStep.id === 'sidebar-open' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the shortcut to open the sidebar.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>L</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>⌥</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>L</Kbd></span>
            </div>
          </div>
        )}

        {/* Folder Create */}
        {currentStep.id === 'folder-create' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-zinc-200">plus button</strong> next to Folders in the sidebar to create a new folder.
            </p>
          </div>
        )}

        {/* Folder Open */}
        {currentStep.id === 'folder-open' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click on the newly created <strong className="text-zinc-200">New Folder</strong> item in the sidebar list to open its view.
            </p>
          </div>
        )}

        {/* Folder Create Doc */}
        {currentStep.id === 'folder-create-doc' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click the <strong className="text-zinc-200">plus circle button</strong> in the folder view header to create a new document inside this folder.
            </p>
          </div>
        )}

        {/* Doc Title */}
        {currentStep.id === 'doc-title' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type a title for your document in the input field above and press Enter.
            </p>
          </div>
        )}

        {/* Doc Mention */}
        {currentStep.id === 'doc-mention' && mentionPhase === 'wait-at' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type <strong className="text-zinc-200">@</strong> in the editor to open the task mentions menu.
            </p>
            <div className="flex items-center gap-1.5">
              <Kbd>@</Kbd>
            </div>
          </div>
        )}
        {currentStep.id === 'doc-mention' && mentionPhase === 'wait-select' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed" style={{ color: currentStep.color }}>
              ✓ Mentions menu open! Now select your task from the list and press <strong className="text-zinc-200">Enter</strong> (or click) to mention it.
            </p>
          </div>
        )}
        {currentStep.id === 'doc-mention' && mentionPhase === 'done' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Task mentioned successfully!
          </p>
        )}

        {/* All other steps */}
        {showNext && description && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">{description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            onClick={skipStep}
            className="text-[11px] text-zinc-600 hover:text-zinc-300 font-medium transition-colors cursor-pointer bg-transparent border-none"
          >
            Skip Step
          </button>

          <div className="flex items-center gap-2">
            {tutorialIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-md border transition-all cursor-pointer active:scale-95"
                style={{
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.45)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
              >
                Back
              </button>
            )}
            {showNext && (
              <button
                onClick={nextTutorial}
                className="px-3.5 py-1.5 text-zinc-950 text-[11px] font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 hover:brightness-110"
                style={{ backgroundColor: currentStep.color }}
              >
                {tutorialIndex === steps.length - 1 ? 'Get Started' : 'Next'}
                <CaretRight size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
