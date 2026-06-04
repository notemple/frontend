import { Check,CircleNotch } from '@phosphor-icons/react';
import { AnimatePresence,motion } from 'motion/react';
import React from 'react';
import type { PresetStyle } from './StyleStep';
import { STYLE_PRESETS } from './StyleStep';

interface SeedingStepProps {
  creationComplete: boolean;
  creationProgress: number;
  selectedStyle: PresetStyle;
}

export const SeedingStep: React.FC<SeedingStepProps> = ({
  creationComplete,
  creationProgress,
  selectedStyle
}) => {
  const currentPreset = STYLE_PRESETS.find(p => p.id === selectedStyle) || STYLE_PRESETS[5];

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-sm flex flex-col items-center space-y-6 text-center"
    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-950/80 border relative transition-colors duration-300"
        style={{ borderColor: creationComplete ? '#B5EAD7' : currentPreset.activeColor }}
      >
        <AnimatePresence mode="wait">
          {!creationComplete ? (
            <motion.div
              key="loading-spinner"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 1.2, ease: "linear" } }}
              style={{ color: currentPreset.activeColor }}
            >
              <CircleNotch size={20} className="animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="check-icon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[#B5EAD7]"
            >
              <Check size={20} weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium text-zinc-300">
          {!creationComplete ? 'Setting up your workspace…' : 'Workspace ready'}
        </span>
        <p className="text-[10px] text-zinc-500 font-mono">
          Generating templates & configuring stores...
        </p>
      </div>

      <div className="w-48 h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
        <motion.div
          className="h-full bg-[#BDE0FE]"
          initial={{ width: '0%' }}
          animate={{ width: `${creationProgress}%` }}
          transition={{ ease: 'easeOut' }}
          style={{
            background: `linear-gradient(to right, ${currentPreset.activeColor}, #B5EAD7)`
          }}
        />
      </div>
    </motion.div>
  );
};
