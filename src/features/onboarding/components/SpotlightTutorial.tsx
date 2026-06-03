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
    description: 'Use / commands to add tables, tasks, quotes, toggles, and more.',
    color: '#FFC8DD',
    sidebarOpen: false,
    page: 'welcome-doc',
  },
  {
    targetId: 'onboarding-ask-ai',
    title: 'Mentions & AI Companion',
    description: 'Use @ to reference documents, tasks, tags, and ask AI to organize your workspace.',
    color: '#B5EAD7',
    sidebarOpen: true,
  },
  {
    targetId: 'onboarding-tab-bar',
    title: 'Splitting & Quitting Workspaces',
    description: '',         // driven dynamically by splitPhase
    color: '#FFDAC1',
    sidebarOpen: false,
    page: 'welcome-doc',
    interactive: true,       // user must press keys — overlay must not block
  },
  {
    targetId: 'onboarding-command-palette',
    title: 'Document Search & Navigation',
    description: '',         // driven dynamically by searchPhase
    color: '#E8C5E5',
    sidebarOpen: false,
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
  } = useUiStore(
    useShallow((state) => ({
      isTutorialActive: state.isTutorialActive,
      setIsTutorialActive: state.setIsTutorialActive,
      tutorialIndex: state.tutorialIndex,
      setTutorialIndex: state.setTutorialIndex,
      panes: state.panes,
    }))
  );

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  // Interactive step sub-states
  const [splitPhase, setSplitPhase] = useState<SplitPhase>('wait-split');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('wait-open');
  const [arrowCount, setArrowCount] = useState(0);

  // ── Reset sub-states when entering interactive steps
  useEffect(() => {
    if (tutorialIndex === 3) setSplitPhase('wait-split');
    if (tutorialIndex === 4) { setSearchPhase('wait-open'); setArrowCount(0); }
  }, [tutorialIndex]);

  // ── Stage sync: open page + sidebar per step
  useEffect(() => {
    if (!isTutorialActive) return;
    const step = TUTORIAL_STEPS[tutorialIndex];
    if (!step) return;
    if (step.page) useUiStore.getState().openDocument(step.page);
    useUiStore.setState({ isSidebarOpen: step.sidebarOpen });
  }, [tutorialIndex, isTutorialActive]);

  // ── Step 3: watch pane count → drive split/quit sequence
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 3) return;
    if (splitPhase === 'wait-split' && panes.length > 1) {
      setSplitPhase('wait-quit');
    } else if (splitPhase === 'wait-quit' && panes.length === 1) {
      setSplitPhase('done');
      const t = setTimeout(() => setTutorialIndex(4), 800);
      return () => clearTimeout(t);
    }
  }, [panes.length, splitPhase, tutorialIndex, isTutorialActive, setTutorialIndex]);

  // ── Step 4: poll for command palette in the DOM
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 4) return;
    const iv = setInterval(() => {
      const el = document.getElementById('onboarding-command-palette');
      if (el && searchPhase === 'wait-open') setSearchPhase('wait-arrows');
    }, 150);
    return () => clearInterval(iv);
  }, [searchPhase, tutorialIndex, isTutorialActive]);

  // ── Step 4: count arrow key presses once palette is open
  useEffect(() => {
    if (!isTutorialActive || tutorialIndex !== 4 || searchPhase !== 'wait-arrows') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setArrowCount((n) => {
          const next = n + 1;
          if (next >= 3) setSearchPhase('done');
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searchPhase, tutorialIndex, isTutorialActive]);

  // ── Restore focus on unmount
  useEffect(() => {
    return () => { setTimeout(() => document.body.focus(), 50); };
  }, []);

  // ── Spotlight rectangle updater
  const updateRect = useCallback(() => {
    if (!isTutorialActive) { setSpotlightRect(null); return; }
    const step = TUTORIAL_STEPS[tutorialIndex];
    if (!step) { setSpotlightRect(null); return; }
    const el = document.getElementById(step.targetId);
    setSpotlightRect(el ? el.getBoundingClientRect() : null);
  }, [tutorialIndex, isTutorialActive]);

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

  const skipTutorial = () => setIsTutorialActive(false);
  const handleBack = () => { if (tutorialIndex > 0) setTutorialIndex(tutorialIndex - 1); };
  const nextTutorial = () => {
    if (tutorialIndex < TUTORIAL_STEPS.length - 1) setTutorialIndex(tutorialIndex + 1);
    else setIsTutorialActive(false);
  };

  // Whether the Next button is shown
  const showNext =
    tutorialIndex !== 3 &&                                   // split step: auto-advance
    !(tutorialIndex === 4 && searchPhase !== 'done');         // search step: must complete

  // ── Dynamic description for interactive steps
  const description = (() => {
    if (tutorialIndex === 3) {
      if (splitPhase === 'wait-split') return null;   // replaced by kbd block below
      if (splitPhase === 'wait-quit') return null;
      return 'Great job! Moving on…';
    }
    if (tutorialIndex === 4) {
      if (searchPhase === 'wait-open') return null;
      if (searchPhase === 'wait-arrows') return null;
      return 'Nice work! Press Esc to close the palette, then click Next.';
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

        {/* Step 3 — Split / Quit */}
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
            <div
              className="h-1 rounded-full mt-0.5 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="h-full rounded-full animate-pulse" style={{ width: '40%', background: currentStep.color + '60' }} />
            </div>
          </div>
        )}

        {tutorialIndex === 3 && splitPhase === 'wait-quit' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed" style={{ color: currentStep.color }}>
              ✓ Pane split! Now <strong>quit / close</strong> the new pane.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Alt</Kbd><span className="text-zinc-600 text-xs">+</span>
              <Kbd>Q</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>⌥</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>Q</Kbd></span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: '70%', background: currentStep.color }} />
            </div>
          </div>
        )}

        {tutorialIndex === 3 && splitPhase === 'done' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Perfect! Moving to the next step…
          </p>
        )}

        {/* Step 4 — Command Palette */}
        {tutorialIndex === 4 && searchPhase === 'wait-open' && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Open the command palette to search documents and run commands.
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Kbd>Ctrl</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>K</Kbd>
              <span className="text-zinc-500 text-[10px] ml-1">/ Mac: <Kbd>⌘</Kbd><span className="text-zinc-600 text-xs">+</span><Kbd>K</Kbd></span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full animate-pulse" style={{ width: '25%', background: currentStep.color + '60' }} />
            </div>
          </div>
        )}

        {tutorialIndex === 4 && searchPhase === 'wait-arrows' && (
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
            <p className="text-[10px] text-zinc-600">
              {arrowCount >= 2 ? 'Almost there…' : `${3 - arrowCount} more press${3 - arrowCount !== 1 ? 'es' : ''}`}
            </p>
          </div>
        )}

        {tutorialIndex === 4 && searchPhase === 'done' && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            🎉 Excellent! Press <Kbd>Esc</Kbd> to close the palette, then click Next.
          </p>
        )}

        {/* All other steps */}
        {tutorialIndex !== 3 && tutorialIndex !== 4 && description && (
          <p className="text-[11px] text-zinc-400 leading-relaxed">{description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            onClick={skipTutorial}
            className="text-[11px] text-zinc-600 hover:text-zinc-300 font-medium transition-colors cursor-pointer bg-transparent border-none"
          >
            Skip Tutorial
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
