import React, { useState, useEffect, useCallback } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';

// ─── Types ─────────────────────────────────────────────────────────────────

interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  color: string;
  sidebarOpen: boolean;
  page?: string;
  /** If true the SVG overlay will not intercept pointer events (user must click / type) */
  interactive?: boolean;
}

type SplitPhase = 'wait-split' | 'wait-quit' | 'done';
type SearchPhase = 'wait-open' | 'wait-arrows' | 'done';

// ─── Step definitions ──────────────────────────────────────────────────────

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'onboarding-quick-capture',
    title: 'Quick Capture Box',
    description: 'Capture thoughts instantly using natural language or slash commands.',
    color: '#BDE0FE',
    sidebarOpen: false,
    page: 'section-glance',
  },
  {
    targetId: 'onboarding-editor',
    title: 'The Document Editor',
    description: '', // driven dynamically by slashPhase
    color: '#FFC8DD',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,
  },
  {
    targetId: 'onboarding-editor',
    title: 'AI Companion Block',
    description: 'Press "Tab" inside the editor to open the AI companion input box.',
    color: '#B5EAD7',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,
  },
  {
    targetId: 'onboarding-tab-bar',
    title: 'Splitting Workspaces',
    description: 'Press Ctrl+Alt+N (or ⌘⌥N) to split the workspace into two panes.',
    color: '#FFDAC1',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,
  },
  {
    targetId: 'onboarding-tab-bar',
    title: 'Switching Pane Focus',
    description: 'Press Ctrl+Alt+J or Ctrl+Alt+H (or ⌘⌥J/H) to move focus to the other pane.',
    color: '#E8C5E5',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,
  },
  {
    targetId: 'onboarding-command-palette',
    title: 'Document Search in New Pane',
    description: '', // driven dynamically by searchPhase
    color: '#BDE0FE',
    sidebarOpen: false,
    interactive: true,
  },
  {
    targetId: 'onboarding-tab-bar',
    title: 'Closing a Pane',
    description: 'Press Ctrl+Alt+Q (or ⌘⌥Q) to close the active pane and return to a single view.',
    color: '#FFB7B2',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,
  },
  {
    targetId: 'onboarding-tasks-tab',
    title: 'Tasks Management',
    description: 'Access the unified Tasks page from the sidebar to keep track of your to-dos across the workspace.',
    color: '#FFB7B2',
    sidebarOpen: true,
  },
  {
    targetId: 'onboarding-add-task-button',
    title: 'Creating Tasks',
    description: 'Click the add button to create a new task. Tasks can be tagged, prioritized, and linked to other notes.',
    color: '#C7CEEA',
    sidebarOpen: false,
    page: 'section-tasks',
  },
  {
    targetId: 'onboarding-settings-tab',
    title: 'Settings & Customization',
    description: 'Open the Settings page from the bottom of the sidebar to customize your workspace preferences.',
    color: '#FFF5C3',
    sidebarOpen: true,
  },
  {
    targetId: 'onboarding-color-presets',
    title: 'Pane Highlight Colors',
    description: 'Choose from solid or gradient preset colors to personalize the active pane indicator below the tab bar.',
    color: '#BDE0FE',
    sidebarOpen: false,
    page: 'section-settings',
  },
  {
    targetId: 'onboarding-autohide-toggle',
    title: 'Auto-Hide Sidebars',
    description: 'Toggle these switches to auto-collapse the top navbar and sidebars. They slide open when you hover near the screen edges.',
    color: '#FFDAC1',
    sidebarOpen: false,
    page: 'section-settings',
  },
];

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

  // Interactive step sub-states
  const [slashPhase, setSlashPhase] = useState<'wait-slash' | 'wait-select' | 'done'>('wait-slash');
  const [splitPhase, setSplitPhase] = useState<'wait-split' | 'wait-move' | 'done'>('wait-split');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('wait-open');
  const [arrowCount, setArrowCount] = useState(0);
  const [initialActivePaneId, setInitialActivePaneId] = useState<string | null>(null);

  // ── Reset sub-states when entering interactive steps
  useEffect(() => {
    if (tutorialIndex === 1) setSlashPhase('wait-slash');
    if (tutorialIndex === 3) setSplitPhase('wait-split');
    if (tutorialIndex === 4) setInitialActivePaneId(useUiStore.getState().activePaneId);
    if (tutorialIndex === 5) { setSearchPhase('wait-open'); setArrowCount(0); }
  }, [tutorialIndex]);

  // ── Stage sync: open page + sidebar per step
  useEffect(() => {
    if (!isTutorialActive) return;
    const step = TUTORIAL_STEPS[tutorialIndex];
    if (!step) return;
    if (step.page) useUiStore.getState().openDocument(step.page);
    useUiStore.setState({ isSidebarOpen: step.sidebarOpen });
  }, [tutorialIndex, isTutorialActive]);

  // ── Settings page scroll: top for color presets (step 10), bottom for autohide (step 11)
  useEffect(() => {
    if (!isTutorialActive) return;
    const scroller = document.getElementById('settings-scroll-container');
    if (!scroller) return;

    if (tutorialIndex === 10) {
      // Scroll to top so color presets card is visible
      const t = setTimeout(() => scroller.scrollTo({ top: 0, behavior: 'smooth' }), 450);
      return () => clearTimeout(t);
    }

    if (tutorialIndex === 11) {
      // Scroll the autohide toggle section to the bottom of the container
      const t = setTimeout(() => {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
      }, 450);
      return () => clearTimeout(t);
    }
  }, [tutorialIndex, isTutorialActive]);

  // ── Step 2: poll for slash command list
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 1) return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-slash-command-list');
      if (el && slashPhase === 'wait-slash') {
        setSlashPhase('wait-select');
      } else if (!el && slashPhase === 'wait-select') {
        setSlashPhase('done');
      }
    }, 150);
    return () => clearInterval(iv);
  }, [slashPhase, tutorialIndex, isTutorialActive]);

  useEffect(() => {
    if (isTutorialActive && tutorialIndex === 1 && slashPhase === 'done') {
      const t = setTimeout(() => setTutorialIndex(2), 1000);
      return () => clearTimeout(t);
    }
  }, [slashPhase, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 3: poll for AI block in editor and user typing
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 2) return;
    const iv = setInterval(() => {
      const inputEl = document.getElementById('onboarding-ai-input') as HTMLInputElement;
      if (inputEl && inputEl.value.trim().length > 0) {
        const t = setTimeout(() => setTutorialIndex(3), 1000);
        return () => clearTimeout(t);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 4: watch pane count → split sequence
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 3) return;
    if (splitPhase === 'wait-split' && panes.length > 1) {
      setSplitPhase('wait-move');
    }
  }, [panes.length, splitPhase, tutorialIndex, isTutorialActive]);

  useEffect(() => {
    if (isTutorialActive && tutorialIndex === 3 && splitPhase === 'wait-move') {
      const t = setTimeout(() => setTutorialIndex(4), 1000);
      return () => clearTimeout(t);
    }
  }, [splitPhase, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 5: watch for pane focus switch
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 4 || !initialActivePaneId) return;
    if (activePaneId !== initialActivePaneId) {
      const t = setTimeout(() => setTutorialIndex(5), 1000);
      return () => clearTimeout(t);
    }
  }, [activePaneId, initialActivePaneId, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 6: poll for command palette in the DOM
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 5) return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-command-palette');
      if (el && searchPhase === 'wait-open') setSearchPhase('wait-arrows');
    }, 150);
    return () => clearInterval(iv);
  }, [searchPhase, tutorialIndex, isTutorialActive]);

  // ── Step 6: count arrow key presses once palette is open (pure increment only)
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 5 || searchPhase !== 'wait-arrows') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setArrowCount((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searchPhase, tutorialIndex, isTutorialActive]);

  // ── Step 6: transition to 'done' once enough arrows have been pressed
  useEffect(() => {
    if (tutorialIndex === 5 && searchPhase === 'wait-arrows' && arrowCount >= 3) {
      setSearchPhase('done');
    }
  }, [arrowCount, searchPhase, tutorialIndex]);

  // ── Step 6: auto-advance to step 7 once search sequence is done (close palette first)
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 5 || searchPhase !== 'done') return;
    const t = setTimeout(() => {
      closePalette();
      setTutorialIndex(6);
    }, 900);
    return () => clearTimeout(t);
  }, [searchPhase, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 7: watch for pane close
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 6) return;
    if (panes.length === 1) {
      const t = setTimeout(() => setTutorialIndex(7), 1000);
      return () => clearTimeout(t);
    }
  }, [panes.length, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Close command palette whenever tutorial becomes inactive (prevents blurry frozen UI)
  useEffect(() => {
    if (!isTutorialActive) closePalette();
  }, [isTutorialActive]);

  // ── Restore focus on unmount
  useEffect(() => {
    return () => { setTimeout(() => document.body.focus(), 50); };
  }, []);

  // ── Spotlight rectangle updater
  const updateRect = useCallback(() => {
    if (!isTutorialActive) { setSpotlightRect(null); return; }
    const step = TUTORIAL_STEPS[tutorialIndex];
    if (!step) { setSpotlightRect(null); return; }

    // Spotlight settings dynamically
    let targetId = step.targetId;
    let customEl: HTMLElement | null = null;
    if (tutorialIndex === 4) {
      customEl = document.querySelector(`[data-pane-id="${activePaneId}"]`) as HTMLElement;
    } else if (tutorialIndex === 5) {
      const paletteEl = document.getElementById('onboarding-command-palette');
      targetId = paletteEl ? 'onboarding-command-palette' : 'onboarding-tab-bar';
    } else if (tutorialIndex === 2) {
      const aiBlockEl = document.getElementById('onboarding-ai-block');
      targetId = aiBlockEl ? 'onboarding-ai-block' : 'onboarding-editor';
    }

    const el = customEl || document.getElementById(targetId);
    setSpotlightRect(el ? el.getBoundingClientRect() : null);
  }, [tutorialIndex, isTutorialActive, activePaneId]);

  useEffect(() => {
    updateRect();
    const iv = setInterval(updateRect, 200);
    window.addEventListener('resize', updateRect);
    return () => { clearInterval(iv); window.removeEventListener('resize', updateRect); };
  }, [updateRect]);

  // ─────────────────────────────────────────────────────────────────────────

  if (!isTutorialActive) return null;

  const currentStep = TUTORIAL_STEPS[tutorialIndex];
  if (!currentStep) return null;

  const isInteractive = currentStep.interactive === true;

  const skipStep = () => {
    if (tutorialIndex < TUTORIAL_STEPS.length - 1) setTutorialIndex(tutorialIndex + 1);
    else setIsTutorialActive(false);
  };
  const handleBack = () => { if (tutorialIndex > 0) setTutorialIndex(tutorialIndex - 1); };
  const nextTutorial = () => {
    if (tutorialIndex < TUTORIAL_STEPS.length - 1) setTutorialIndex(tutorialIndex + 1);
    else setIsTutorialActive(false);
  };

  // Whether the Next button is shown (hidden for interactive auto-advance steps)
  const showNext = tutorialIndex !== 1 && tutorialIndex !== 2 && tutorialIndex !== 3 && tutorialIndex !== 4 && tutorialIndex !== 5 && tutorialIndex !== 6;

  // ── Dynamic description for interactive steps
  const description = (() => {
    if (tutorialIndex === 1) {
      if (slashPhase === 'wait-slash') return null;
      if (slashPhase === 'wait-select') return null;
      return 'Great choice! Command executed.';
    }
    if (tutorialIndex === 2) {
      return 'Press "Tab" inside the editor to open the AI input box.';
    }
    if (tutorialIndex === 3) {
      return 'Press the shortcut to split the workspace into two panes.';
    }
    if (tutorialIndex === 4) {
      return 'Press Ctrl+Alt+J or Ctrl+Alt+H (or ⌘⌥J/H) to move focus to the other pane.';
    }
    if (tutorialIndex === 5) {
      if (searchPhase === 'wait-open') return null;
      if (searchPhase === 'wait-arrows') return null;
      return '🎉 Great work! Moving to the next step…';
    }
    if (tutorialIndex === 6) {
      return 'Press Ctrl+Alt+Q (or ⌘⌥Q) to close the active pane.';
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
            Step {tutorialIndex + 1} / {TUTORIAL_STEPS.length}
          </span>
          <ProgressPips total={TUTORIAL_STEPS.length} current={tutorialIndex} color={currentStep.color} />
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-bold text-white leading-snug -mt-1">
          {currentStep.title}
        </h3>

        {/* ── Contextual body for interactive steps ── */}

        {/* Step 2 — Slash Commands */}
        {tutorialIndex === 1 && slashPhase === 'wait-slash' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Type <strong className="text-zinc-200">/</strong> in the editor to open the slash commands menu.
            </p>
            <div className="flex items-center gap-1.5">
              <Kbd>/</Kbd>
            </div>
          </div>
        )}
        {tutorialIndex === 1 && slashPhase === 'wait-select' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed" style={{ color: currentStep.color }}>
              ✓ Menu open! Now use arrow keys and press <strong className="text-zinc-200">Enter</strong> (or click) to execute a command.
            </p>
          </div>
        )}
        {tutorialIndex === 1 && slashPhase === 'done' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Great choice! Moving to the next step…
          </p>
        )}

        {/* Step 3 — Tab for AI */}
        {tutorialIndex === 2 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Press the <strong className="text-zinc-200">Tab</strong> key on a new line in the editor to open the AI companion.
            </p>
            <div className="flex items-center gap-1.5">
              <Kbd>Tab</Kbd>
            </div>
          </div>
        )}

        {/* Step 4 — Pane Split */}
        {tutorialIndex === 3 && splitPhase === 'wait-split' && (
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
        {tutorialIndex === 3 && splitPhase === 'wait-move' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Pane split! Moving to the next step…
          </p>
        )}

        {/* Step 5 — Switch Pane Focus */}
        {tutorialIndex === 4 && (
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

        {/* Step 6 — Command Palette */}
        {tutorialIndex === 5 && searchPhase === 'wait-open' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Open the command palette in the new pane to search documents.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>K</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>K</Kbd></span>
            </div>
          </div>
        )}
        {tutorialIndex === 5 && searchPhase === 'wait-arrows' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed" style={{ color: currentStep.color }}>
              ✓ Palette open! Now navigate the list with the arrow keys.
            </p>
            <div className="flex items-center gap-2">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="text-zinc-500 text-[10px]">to move between items</span>
            </div>
            {/* Arrow progress pips */}
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-200"
                  style={{ background: i < arrowCount ? currentStep.color : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>
          </div>
        )}
        {tutorialIndex === 5 && searchPhase === 'done' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Excellent! Press <Kbd>Esc</Kbd> to close the palette.
          </p>
        )}

        {/* Step 7 — Closing a Pane */}
        {tutorialIndex === 6 && (
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
                {tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <CaretRight size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
