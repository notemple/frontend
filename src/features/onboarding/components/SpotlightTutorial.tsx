import React, { useState, useEffect } from 'react';
import { CaretRight, X } from '@phosphor-icons/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';

export const SpotlightTutorial = () => {
  const {
    isTutorialActive,
    setIsTutorialActive,
    tutorialIndex,
    setTutorialIndex
  } = useUiStore(useShallow(state => ({
    isTutorialActive: state.isTutorialActive,
    setIsTutorialActive: state.setIsTutorialActive,
    tutorialIndex: state.tutorialIndex,
    setTutorialIndex: state.setTutorialIndex
  })));

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  // Sync index stage adjustments (opening sections or expanding sidebar)
  useEffect(() => {
    if (!isTutorialActive) return;

    if (tutorialIndex === 0) {
      useUiStore.getState().openDocument('section-glance');
    } else if (tutorialIndex === 1) {
      useUiStore.getState().openDocument('welcome-doc');
    } else if (tutorialIndex === 2) {
      useUiStore.setState({ isSidebarOpen: true });
    }
  }, [tutorialIndex, isTutorialActive]);

  // Handle Spotlight coordinates updating dynamically
  useEffect(() => {
    if (!isTutorialActive) {
      setSpotlightRect(null);
      return;
    }

    const updateRect = () => {
      let targetId = '';
      if (tutorialIndex === 0) targetId = 'onboarding-quick-capture';
      else if (tutorialIndex === 1) targetId = 'onboarding-editor';
      else if (tutorialIndex === 2) targetId = 'onboarding-ask-ai';

      const el = document.getElementById(targetId);
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

  const handleBack = () => {
    if (tutorialIndex > 0) {
      setTutorialIndex(tutorialIndex - 1);
    }
  };

  const nextTutorial = () => {
    if (tutorialIndex < 2) {
      setTutorialIndex(tutorialIndex + 1);
    } else {
      setIsTutorialActive(false);
    }
  };

  const skipTutorial = () => {
    setIsTutorialActive(false);
  };

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
            borderColor: `${['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex]}80`,
            boxShadow: `0 0 15px ${['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex]}20`,
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="fixed w-[320px] bg-zinc-950/95 border rounded-xl p-5 shadow-lg pointer-events-auto z-[9999] flex flex-col space-y-4 font-sans text-white"
        style={{
          transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          borderColor: `${['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex]}30`,
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
            style={{ color: ['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex] }}
          >
            Tutorial {tutorialIndex + 1} of 3
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: i === tutorialIndex ? ['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex] : '#27272a'
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-zinc-100">
            {tutorialIndex === 0 && "Quick Capture Box"}
            {tutorialIndex === 1 && "The Document Editor"}
            {tutorialIndex === 2 && "Mentions & AI Companion"}
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {tutorialIndex === 0 && "Capture thoughts instantly using natural language or slash commands."}
            {tutorialIndex === 1 && "Use / commands to add tables, tasks, quotes, toggles, and more."}
            {tutorialIndex === 2 && "Use @ to reference documents, tasks, tags, and ask AI to organize your workspace."}
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
                className="px-2.5 py-1.5 bg-zinc-950 text-[#BDE0FE]/70 hover:text-white text-[11px] font-semibold rounded-md border border-zinc-900 hover:border-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                Back
              </button>
            )}
            <button
              onClick={nextTutorial}
              className="px-3.5 py-1.5 text-zinc-950 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              style={{
                backgroundColor: ['#BDE0FE', '#FFC8DD', '#B5EAD7'][tutorialIndex]
              }}
            >
              {tutorialIndex === 2 ? "Get Started" : "Next"}
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
