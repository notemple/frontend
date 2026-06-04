import { cn } from '@/shared/lib/utils';
import { Envelope,GithubLogo,GoogleLogo } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import React from 'react';

interface LoginStepProps {
  selectedLoginIndex: number;
  setSelectedLoginIndex: (index: number) => void;
  nextStep: () => void;
}

export const LoginStep: React.FC<LoginStepProps> = ({
  selectedLoginIndex,
  setSelectedLoginIndex,
  nextStep
}) => {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xs flex flex-col space-y-3"
    >
      <button
        onClick={nextStep}
        onMouseEnter={() => setSelectedLoginIndex(0)}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
          selectedLoginIndex === 0
            ? "bg-[#FFB7B2]/10 border-[#FFB7B2]/50 text-white"
            : "border-[#FFB7B2]/20 text-[#FFB7B2] hover:bg-[#FFB7B2]/10 hover:border-[#FFB7B2]/50 hover:text-white"
        )}
      >
        <GoogleLogo size={18} className="text-[#FFB7B2]/80" />
        Continue with Google
      </button>

      <button
        onClick={nextStep}
        onMouseEnter={() => setSelectedLoginIndex(1)}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
          selectedLoginIndex === 1
            ? "bg-[#BDE0FE]/10 border-[#BDE0FE]/50 text-white"
            : "border-[#BDE0FE]/20 text-[#BDE0FE] hover:bg-[#BDE0FE]/10 hover:border-[#BDE0FE]/50 hover:text-white"
        )}
      >
        <GithubLogo size={18} className="text-[#BDE0FE]/80" />
        Continue with GitHub
      </button>

      <button
        onClick={nextStep}
        onMouseEnter={() => setSelectedLoginIndex(2)}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-zinc-950/70 border rounded-lg text-sm transition-all duration-200 cursor-pointer active:scale-[0.99] font-medium",
          selectedLoginIndex === 2
            ? "bg-[#B5EAD7]/10 border-[#B5EAD7]/50 text-white"
            : "border-[#B5EAD7]/20 text-[#B5EAD7] hover:bg-[#B5EAD7]/10 hover:border-[#B5EAD7]/50 hover:text-white"
        )}
      >
        <Envelope size={18} className="text-[#B5EAD7]/80" />
        Continue with Email
      </button>
    </motion.div>
  );
};
