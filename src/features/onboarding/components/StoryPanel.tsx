import { AnimatePresence,motion } from 'motion/react';
import React from 'react';

interface StoryPanelProps {
  step: number;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({ step }) => {
  return (
    <div className="hidden md:flex w-[40%] h-full overflow-hidden border-l border-zinc-900 flex-col justify-between p-12 text-left bg-zinc-950 relative z-10">
      <div className="graffiti-backdrop" />
      <div className="graffiti-ambient-overlay" />

      <div className="relative z-10 flex flex-col h-full justify-between text-left font-sans">
        {/* Brand title: split-line templ + note at the top taking full width */}
        <div className="w-full pt-4">
          <h1 className="text-[16vw] md:text-[6.5vw] font-black leading-[0.8] tracking-tighter bg-gradient-to-br from-[#BDE0FE] via-[#FFC8DD] to-[#B5EAD7] bg-clip-text text-transparent font-sans lowercase select-none">
            templ<br />
            note
          </h1>
          <h2 className="text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase font-mono mt-4">
            AI-Enhanced Minimal Workspace
          </h2>
        </div>

        {/* Narrative step texts: positioned bottom-left */}
        <div className="mt-auto mb-6 max-w-sm mr-auto text-left w-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="story-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 flex flex-col items-start"
              >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#FFB7B2]">Welcome</h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs font-sans">
                  Templnote is designed to be a friction-free environment for your notes, focus, and tasks. A place to write, plan, and think without clutter.
                </p>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="story-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 flex flex-col items-start"
              >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#BDE0FE]">Our Story</h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs font-sans">
                  Templnote was built from a simple realization: modern productivity tools have too many boxes and templates. We wanted a place that feels like a clean physical notebook, but runs on an intelligent local-first sync engine.
                </p>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="story-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 flex flex-col items-start"
              >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#B5EAD7]">How It's Better</h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs font-sans">
                  By aligning folders, default templates, and daily notes with your selected workspace style, Templnote adapts to you from the start. No complex configurations, no empty space. Just write.
                </p>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div
                key="story-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2.5 flex flex-col items-start"
              >
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#FFDAC1]">Workspace Seeding</h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs font-sans">
                  We are seeding your database with folders and daily note templates tailored to your profile. This will take only a second.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer copyright */}
        <div className="text-[9px] text-zinc-600 font-mono tracking-wider text-left w-full">
          © 2026 Templnote Inc.
        </div>
      </div>
    </div>
  );
};
