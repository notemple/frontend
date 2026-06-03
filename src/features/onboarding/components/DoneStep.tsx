import React from 'react';
import { motion } from 'motion/react';
import { Check } from '@phosphor-icons/react';

interface DoneStepProps {
  handleFinishOnboarding: () => void;
}

export const DoneStep: React.FC<DoneStepProps> = ({ handleFinishOnboarding }) => {
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex w-full h-full bg-[#050505] z-[9999] select-none text-white overflow-hidden justify-center items-center"
      style={{
        background: 'radial-gradient(circle at center, rgba(189, 224, 254, 0.04) 0%, #050505 85%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm flex flex-col items-center text-center space-y-8 relative z-10"
      >
        <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-zinc-950 border border-[#B5EAD7]/30 shadow-md">
          <div className="absolute inset-0 rounded-full bg-[#B5EAD7]/5 animate-pulse" />
          <Check className="text-[#B5EAD7] relative z-10" size={24} weight="bold" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
            You’re all set.
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto font-sans">
            Welcome to your new intelligent space. Let's start thinking together.
          </p>
        </div>

        <button
          onClick={handleFinishOnboarding}
          className="w-full max-w-xs py-2.5 px-4 bg-[#B5EAD7] hover:bg-[#a3d8c4] text-zinc-950 text-sm font-semibold rounded-lg shadow-sm hover:shadow-green-500/10 active:scale-[0.99] transition-all cursor-pointer"
        >
          Open Workspace
        </button>
      </motion.div>
    </motion.div>
  );
};
