import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';

interface NameStepProps {
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  nextStep: () => void;
}

export const NameStep: React.FC<NameStepProps> = ({
  nameInputRef,
  workspaceName,
  setWorkspaceName,
  nextStep
}) => {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-sm flex flex-col items-center space-y-8 text-center"
    >
      <div className="space-y-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BDE0FE]">Step 2 of 3</span>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
          What should we call your workspace?
        </h1>
      </div>

      <div className="w-full relative max-w-sm pt-4">
        <input
          ref={nameInputRef}
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. Personal Space, Startup Lab"
          className="w-full bg-transparent border-b border-[#BDE0FE]/30 focus:border-[#BDE0FE] outline-none text-lg text-center pb-2 text-zinc-100 placeholder-zinc-700 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && workspaceName.trim()) {
              e.preventDefault();
              e.stopPropagation();
              nextStep();
            }
          }}
        />

        {workspaceName.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center text-[10px] text-[#BDE0FE]/70 font-mono"
          >
            press Enter ↵
          </motion.div>
        )}
      </div>

      <button
        disabled={!workspaceName.trim()}
        onClick={nextStep}
        className="px-6 py-2 bg-[#BDE0FE] hover:bg-[#aed0ed] disabled:opacity-40 disabled:pointer-events-none text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        Continue
        <ArrowRight size={14} weight="bold" />
      </button>
    </motion.div>
  );
};
