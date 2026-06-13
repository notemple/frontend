import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import {
  CheckSquare,
  CalendarBlank,
  Clock,
  Sparkle,
  BookOpen,
  Target,
  FileText,
  Brain,
  Pencil,
  Notebook,
  ChartLineUp,
  Coffee,
  Lightbulb,
  Gear
} from '@phosphor-icons/react';

interface StoryPanelProps {
  step: number;
}

// Doodle SVG components for hand-drawn style decorations
const CurlyArrow = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-full h-full">
    <path d="M 20 25 C 45 15, 65 55, 30 80 C 15 90, 35 95, 80 75" />
    <path d="M 70 65 L 82 76 L 73 87" />
  </svg>
);

const SparkleDoodle = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M 50 15 L 56 38 L 80 44 L 59 56 L 65 80 L 50 65 L 35 80 L 41 56 L 20 44 L 44 38 Z" />
  </svg>
);

const ProgressWave = () => (
  <svg viewBox="0 0 100 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M 10 30 H 30 L 40 10 L 52 50 L 62 20 L 68 35 L 76 30 H 90" />
  </svg>
);

const SpiralNotebook = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-full h-full">
    <rect x="25" y="30" width="50" height="55" rx="6" />
    <path d="M 30 20 C 30 35, 35 35, 35 20 M 42 20 C 42 35, 47 35, 47 20 M 54 20 C 54 35, 59 35, 59 20 M 66 20 C 66 35, 71 35, 71 20" />
    <line x1="38" y1="45" x2="62" y2="45" />
    <line x1="38" y1="58" x2="62" y2="58" />
    <line x1="38" y1="71" x2="52" y2="71" />
  </svg>
);

const FocusTarget = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-full h-full">
    <circle cx="50" cy="50" r="35" strokeDasharray="6 5" />
    <circle cx="50" cy="50" r="18" />
    <circle cx="50" cy="50" r="5" fill="currentColor" />
    <path d="M 50 5 V 15 M 50 85 V 95 M 5 50 H 15 M 85 50 H 95" />
  </svg>
);

const SuccessCheckbox = () => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="22" y="22" width="56" height="56" rx="10" />
    <path d="M 38 50 L 47 59 L 68 36" strokeWidth="3.5" />
  </svg>
);

interface FloatingItem {
  id: number;
  element: React.ReactNode;
  top: string;
  left: string;
  size: string;
  color: string;
  glowColor: string;
  animationClass: string;
  delay: string;
}

const floatingItems: FloatingItem[] = [
  { id: 1, element: <CheckSquare weight="light" />, top: '12%', left: '8%', size: '36px', color: 'text-[#BDE0FE]/35', glowColor: 'rgba(189,224,254,0.4)', animationClass: 'animate-float-up', delay: '0s' },
  { id: 2, element: <CurlyArrow />, top: '22%', left: '70%', size: '48px', color: 'text-[#FFC8DD]/25', glowColor: 'rgba(255,200,221,0.3)', animationClass: 'animate-float-down', delay: '2s' },
  { id: 3, element: <Clock weight="light" />, top: '48%', left: '80%', size: '32px', color: 'text-[#B5EAD7]/35', glowColor: 'rgba(181,234,215,0.4)', animationClass: 'animate-float-left', delay: '1s' },
  { id: 4, element: <SparkleDoodle />, top: '65%', left: '15%', size: '44px', color: 'text-[#FFDAC1]/30', glowColor: 'rgba(255,218,193,0.35)', animationClass: 'animate-float-right', delay: '3s' },
  { id: 5, element: <FileText weight="light" />, top: '78%', left: '72%', size: '38px', color: 'text-[#BDE0FE]/35', glowColor: 'rgba(189,224,254,0.4)', animationClass: 'animate-float-up', delay: '1.5s' },
  { id: 6, element: <ProgressWave />, top: '38%', left: '15%', size: '52px', color: 'text-[#B5EAD7]/25', glowColor: 'rgba(181,234,215,0.3)', animationClass: 'animate-float-down', delay: '0.5s' },
  { id: 7, element: <Lightbulb weight="light" />, top: '55%', left: '50%', size: '34px', color: 'text-[#FFC8DD]/35', glowColor: 'rgba(255,200,221,0.4)', animationClass: 'animate-float-right', delay: '2.5s' },
  { id: 8, element: <SpiralNotebook />, top: '8%', left: '52%', size: '46px', color: 'text-[#FFDAC1]/25', glowColor: 'rgba(255,218,193,0.3)', animationClass: 'animate-float-left', delay: '4s' },
  { id: 9, element: <Target weight="light" />, top: '85%', left: '42%', size: '40px', color: 'text-[#B5EAD7]/35', glowColor: 'rgba(181,234,215,0.4)', animationClass: 'animate-float-up', delay: '3.2s' },
  { id: 10, element: <SuccessCheckbox />, top: '30%', left: '48%', size: '42px', color: 'text-[#BDE0FE]/25', glowColor: 'rgba(189,224,254,0.3)', animationClass: 'animate-float-down', delay: '0.8s' },
  { id: 11, element: <Coffee weight="light" />, top: '70%', left: '88%', size: '30px', color: 'text-[#FFC8DD]/35', glowColor: 'rgba(255,200,221,0.4)', animationClass: 'animate-float-left', delay: '1.2s' },
  { id: 12, element: <FocusTarget />, top: '20%', left: '32%', size: '46px', color: 'text-[#FFDAC1]/25', glowColor: 'rgba(255,218,193,0.3)', animationClass: 'animate-float-right', delay: '2.2s' },
  { id: 13, element: <Brain weight="light" />, top: '42%', left: '38%', size: '34px', color: 'text-[#BDE0FE]/35', glowColor: 'rgba(189,224,254,0.4)', animationClass: 'animate-float-up', delay: '1.8s' },
  { id: 14, element: <Pencil weight="light" />, top: '5%', left: '82%', size: '28px', color: 'text-[#B5EAD7]/40', glowColor: 'rgba(181,234,215,0.45)', animationClass: 'animate-float-down', delay: '0.2s' },
  { id: 15, element: <Gear weight="light" />, top: '92%', left: '12%', size: '32px', color: 'text-[#FFDAC1]/35', glowColor: 'rgba(255,218,193,0.4)', animationClass: 'animate-float-right', delay: '2.8s' }
];

export const StoryPanel: React.FC<StoryPanelProps> = ({ step }) => {
  return (
    <div className="hidden md:flex w-[40%] h-full overflow-hidden border-l border-zinc-900 flex-col justify-between p-12 text-left bg-zinc-950 relative z-10">
      {/* CSS Animations and custom styles for productivity floating backdrop */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatUp {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(6deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes floatDown {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-6deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes floatLeft {
          0% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          50% { transform: translateX(-15px) translateY(-10px) rotate(4deg); }
          100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
        }
        @keyframes floatRight {
          0% { transform: translateX(0px) translateY(0px) rotate(0deg); }
          50% { transform: translateX(15px) translateY(10px) rotate(-4deg); }
          100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
        }
        .animate-float-up { animation: floatUp 12s ease-in-out infinite; }
        .animate-float-down { animation: floatDown 14s ease-in-out infinite; }
        .animate-float-left { animation: floatLeft 16s ease-in-out infinite; }
        .animate-float-right { animation: floatRight 13s ease-in-out infinite; }
        
        .floating-element {
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .floating-element:hover {
          color: currentColor !important;
          opacity: 0.95 !important;
          filter: drop-shadow(0 0 12px var(--glow-color));
          transform: scale(1.18) rotate(12deg) !important;
          cursor: pointer;
        }
      `}} />

      {/* Soft glowing ambient orbs */}
      <div className="absolute top-[20%] left-[30%] w-72 h-72 rounded-full bg-[#BDE0FE]/10 blur-[100px] pointer-events-none z-0 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[25%] right-[20%] w-80 h-80 rounded-full bg-[#FFC8DD]/10 blur-[110px] pointer-events-none z-0 animate-pulse duration-[10000ms]" />
      <div className="absolute top-[60%] left-[10%] w-64 h-64 rounded-full bg-[#B5EAD7]/5 blur-[90px] pointer-events-none z-0" />

      {/* Floating productivity icons and doodles backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-auto z-1 select-none">
        {floatingItems.map((item) => (
          <div
            key={item.id}
            className={`absolute floating-element ${item.color} ${item.animationClass}`}
            style={{
              top: item.top,
              left: item.left,
              width: item.size,
              height: item.size,
              animationDelay: item.delay,
              // @ts-ignore custom CSS variable for hover glow effect
              '--glow-color': item.glowColor,
            }}
          >
            {item.element}
          </div>
        ))}
      </div>

      {/* Ambient gradient overlay to fade edges and keep content readable */}
      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-transparent to-zinc-950/80 pointer-events-none z-2" />

      <div className="relative z-10 flex flex-col h-full justify-between text-left font-sans pointer-events-none">
        {/* Brand title: templ at the top taking full width */}
        <div className="w-full pt-4 pointer-events-auto">
          <h1 className="text-[16vw] md:text-[6.5vw] font-black leading-[0.8] tracking-tighter bg-gradient-to-br from-[#4A90D9] via-[#D96A9E] to-[#45B88E] bg-clip-text text-transparent font-sans lowercase select-none">
            templ
          </h1>
          <h2 className="text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase font-mono mt-4">
            AI-Enhanced Minimal Workspace
          </h2>
        </div>

        {/* Narrative step texts: positioned bottom-left */}
        <div className="mt-auto mb-6 max-w-sm mr-auto text-left w-full pointer-events-auto">
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
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs select-none">
                  templ is designed to be a friction-free environment for your notes, focus, and tasks. A place to write, plan, and think without clutter.
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
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs select-none">
                  templ was built from a simple realization: modern productivity tools have too many boxes and templates. We wanted a place that feels like a clean physical notebook, but runs on an intelligent local-first sync engine.
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
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs select-none">
                  By aligning folders, default templates, and daily notes with your selected workspace style, templ adapts to you from the start. No complex configurations, no empty space. Just write.
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
                <p className="text-sm md:text-base leading-relaxed text-zinc-400 font-sans max-w-[280px] md:max-w-xs select-none">
                  We are seeding your workspace with folders and daily note templates tailored to your profile. This will take only a second.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer copyright */}
        <div className="text-[9px] text-zinc-600 font-mono tracking-wider text-left w-full select-none">
          © 2026 Templnote Inc.
        </div>
      </div>
    </div>
  );
};

