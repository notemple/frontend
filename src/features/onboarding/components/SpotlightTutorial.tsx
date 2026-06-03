import React, { useState, useEffect } from 'react';
import { CaretRight, X } from '@phosphor-icons/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  color: string;
  sidebarOpen: boolean;
  page?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'onboarding-quick-capture',
    title: 'Quick Capture Box',
    description: 'Capture thoughts instantly using natural language or slash commands.',
    color: '#BDE0FE',
    sidebarOpen: false,
    page: 'section-glance'
  },
  {
    targetId: 'onboarding-editor',
    title: 'The Document Editor',
    description: 'Use / commands to add tables, tasks, quotes, toggles, and more.',
    color: '#FFC8DD',
    sidebarOpen: false,
    page: 'welcome-doc'
  },
  {
    targetId: 'onboarding-ask-ai',
    title: 'Mentions & AI Companion',
    description: 'Use @ to reference documents, tasks, tags, and ask AI to organize your workspace.',
    color: '#B5EAD7',
    sidebarOpen: true
  },
  {
    targetId: 'onboarding-tab-bar',
    title: 'Splitting & Quitting Workspaces',
    description: 'Split your workspace using Ctrl + Alt + N (Cmd + Alt + N on Mac) and close panes with Ctrl + Alt + Q (Cmd + Alt + Q on Mac).',
    color: '#FFDAC1',
    sidebarOpen: false,
    page: 'welcome-doc'
  },
  {
    targetId: 'onboarding-command-palette',
    title: 'Document Search & Navigation',
    description: 'Bring up the search bar and command palette by pressing Ctrl + K (or Cmd + K on Mac).',
    color: '#E8C5E5',
    sidebarOpen: false
  },
  {
    targetId: 'onboarding-tasks-tab',
    title: 'Tasks Management',
    description: 'Access the unified Tasks page from the sidebar to keep track of your to-dos across the workspace.',
    color: '#FFB7B2',
    sidebarOpen: true
  },
  {
    targetId: 'onboarding-add-task-button',
    title: 'Creating Tasks',
    description: 'Click the add button to create a new task. Tasks can be tagged, prioritized, and linked to other notes.',
    color: '#C7CEEA',
    sidebarOpen: false,
    page: 'section-tasks'
  },
  {
    targetId: 'onboarding-settings-tab',
    title: 'Settings & Customization',
    description: 'Open the Settings page from the bottom of the sidebar to customize your workspace preferences.',
    color: '#FFF5C3',
    sidebarOpen: true
  },
  {
    targetId: 'onboarding-color-presets',
    title: 'Highlight Colors Selection',
    description: 'Choose from solid or gradient preset colors to personalize the active window highlights.',
    color: '#BDE0FE',
    sidebarOpen: false,
    page: 'section-settings'
  },
  {
    targetId: 'onboarding-autohide-toggle',
    title: 'Auto-Hide Sidebars Switch',
    description: 'Toggle this switch to auto-collapse the sidebars, sliding them open only when you hover near the screen edges.',
    color: '#FFDAC1',
    sidebarOpen: false,
    page: 'section-settings'
  }
];

export const SpotlightTutorial = () => {
  const {
    isTutorialActive,
    setIsTutorialActive,
    tutorialIndex,
    setTutorialIndex,
    panes
  } = useUiStore(useShallow(state => ({
    isTutorialActive: state.isTutorialActive,
    setIsTutorialActive: state.setIsTutorialActive,
    tutorialIndex: state.tutorialIndex,
    setTutorialIndex: state.setTutorialIndex,
    panes: state.panes
  })));

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  // States for interactive keyboard steps
  const [splitState, setSplitState] = useState<'wait-split' | 'wait-quit' | 'done'>('wait-split');
  const [searchState, setSearchState] = useState<'wait-open' | 'wait-arrows' | 'done'>('wait-open');
  const [arrowPressCount, setArrowPressCount] = useState(0);

  // Reset interactive sub-states on step changes
  useEffect(() => {
    if (tutorialIndex === 3) {
      setSplitState('wait-split');
    } else if (tutorialIndex === 4) {
      setSearchState('wait-open');
      setArrowPressCount(0);
    }
  }, [tutorialIndex]);

  // Sync index stage adjustments (opening sections or expanding sidebar)
  useEffect(() => {
    if (!isTutorialActive) return;

    const step = TUTORIAL_STEPS[tutorialIndex];
    if (step) {
      if (step.page) {
        useUiStore.getState().openDocument(step.page);
      }
      useUiStore.setState({ isSidebarOpen: step.sidebarOpen });
    }
  }, [tutorialIndex, isTutorialActive]);

  // Watch pane length changes to drive workspace split/quit step progression
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 3) return;

    if (splitState === 'wait-split' && panes.length > 1) {
      setSplitState('wait-quit');
    } else if (splitState === 'wait-quit' && panes.length === 1) {
      setSplitState('done');
      // Auto-advance to the search step after a short delay
      const timer = setTimeout(() => {
        setTutorialIndex(4);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [panes.length, splitState, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // Detect when Command Palette overlay becomes open
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 4) return;

    const checkPalette = () => {
      const palette = document.getElementById('onboarding-command-palette');
      if (palette && searchState === 'wait-open') {
        setSearchState('wait-arrows');
      }
    };

    const interval = setInterval(checkPalette, 150);
    return () => clearInterval(interval);
  }, [searchState, tutorialIndex, isTutorialActive]);

  // Intercept Arrow keys in Command Palette step to drive completion
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 4 || searchState !== 'wait-arrows') return;

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setArrowPressCount(prev => {
          const nextCount = prev + 1;
          if (nextCount >= 2) {
            setSearchState('done');
          }
          return nextCount;
        });
      }
    };

    window.addEventListener('keydown', handleArrowKeys, true);
    return () => window.removeEventListener('keydown', handleArrowKeys, true);
  }, [searchState, tutorialIndex, isTutorialActive]);

  // Focus body when tutorial completes or is skipped to restore keyboard focus
  useEffect(() => {
    return () => {
      setTimeout(() => {
        document.body.focus();
      }, 50);
    };
  }, []);

  // Handle Spotlight coordinates updating dynamically
  useEffect(() => {
    if (!isTutorialActive) {
      setSpotlightRect(null);
      return;
    }

    const updateRect = () => {
      const step = TUTORIAL_STEPS[tutorialIndex];
      if (!step) {
        setSpotlightRect(null);
        return;
      }

      const el = document.getElementById(step.targetId);
      if (el) {
        setSpotlightRect(el.getBoundingClientRect());
      } else {
        setSpotlightRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const interval = setInterval(updateRect, 300);

    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [tutorialIndex, isTutorialActive]);

  if (!isTutorialActive) return null;

  const currentStep = TUTORIAL_STEPS[tutorialIndex];
  if (!currentStep) return null;

  const handleBack = () => {
    if (tutorialIndex > 0) {
      setTutorialIndex(tutorialIndex - 1);
    }
  };

  const nextTutorial = () => {
    if (tutorialIndex < TUTORIAL_STEPS.length - 1) {
      setTutorialIndex(tutorialIndex + 1);
    } else {
      setIsTutorialActive(false);
    }
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
  };

  const getStepDescription = () => {
    if (tutorialIndex === 3) {
      if (splitState === 'wait-split') {
        return 'Split your workspace now by pressing Ctrl + Alt + N (or Cmd + Alt + N on Mac).';
      }
      if (splitState === 'wait-quit') {
        return 'Perfect! Now close/quit the split pane by pressing Ctrl + Alt + Q (or Cmd + Alt + Q on Mac).';
      }
      return 'Great job! Workspace split and close shortcuts completed.';
    }
    if (tutorialIndex === 4) {
      if (searchState === 'wait-open') {
        return 'Bring up the search bar and command palette by pressing Ctrl + K (or Cmd + K on Mac).';
      }
      if (searchState === 'wait-arrows') {
        return 'Awesome! Use the Up and Down Arrow keys to navigate through the commands and documents.';
      }
      return 'Nice! Press Esc to close the command palette, or click Next to continue.';
    }
    return currentStep.description;
  };

  const showNextButton = (() => {
    if (tutorialIndex === 3) return false; // Split/quit is automated
    if (tutorialIndex === 4 && searchState !== 'done') return false; // Must open and navigate first
    return true;
  })();

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      <svg className="fixed inset-0 w-full h-full pointer-events-auto z-[9998]" style={{ transition: 'opacity 0.3s ease' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.x - 8}
                y={spotlightRect.y - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx={8}
                fill="black"
                style={{ transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(5, 5, 5, 0.76)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Spotlight borders utilizing soft pastel colors */}
      {spotlightRect && (
        <div
          className="absolute border rounded-lg pointer-events-none z-[9999]"
          style={{
            top: spotlightRect.y - 8,
            left: spotlightRect.x - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
            borderColor: `${currentStep.color}80`,
            boxShadow: `0 0 15px ${currentStep.color}20`,
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="fixed w-[320px] bg-zinc-950/95 border rounded-xl p-5 shadow-lg pointer-events-auto z-[9999] flex flex-col space-y-4 font-sans text-white"
        style={{
          transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          borderColor: `${currentStep.color}30`,
          ...(spotlightRect ? {
            top: (window.innerHeight - spotlightRect.bottom > 220) ? spotlightRect.bottom + 16 : undefined,
            bottom: (window.innerHeight - spotlightRect.bottom <= 220 && spotlightRect.top > 220) ? (window.innerHeight - spotlightRect.top) + 16 : undefined,
            left: Math.max(16, Math.min(window.innerWidth - 336, spotlightRect.left + spotlightRect.width / 2 - 160)),
          } : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          })
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold tracking-wider uppercase font-mono transition-colors"
            style={{ color: currentStep.color }}
          >
            Tutorial {tutorialIndex + 1} of {TUTORIAL_STEPS.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: TUTORIAL_STEPS.length }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: i === tutorialIndex ? currentStep.color : '#27272a'
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-zinc-100">
            {currentStep.title}
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {getStepDescription()}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={skipTutorial}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors cursor-pointer bg-transparent border-none"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {tutorialIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-2.5 py-1.5 bg-zinc-950 text-zinc-400 hover:text-white text-[11px] font-semibold rounded-md border border-zinc-900 hover:border-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                Back
              </button>
            )}
            {showNextButton && (
              <button
                onClick={nextTutorial}
                className="px-3.5 py-1.5 text-zinc-950 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: currentStep.color
                }}
              >
                {tutorialIndex === TUTORIAL_STEPS.length - 1 ? "Get Started" : "Next"}
                <CaretRight size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

