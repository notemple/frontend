import { cn } from '@/shared/lib/utils';
import {
	ArrowRight,
	FileText,
	GraduationCap,
	Microscope,
	Palette,
	RocketLaunch,
	Terminal,
	User,
	X
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import React from 'react';

export type PresetStyle = 'Developer' | 'Student' | 'Creator' | 'Researcher' | 'Startup' | 'Personal';

export const STYLE_PRESETS = [
  { id: 'Developer', title: 'Developer', description: 'Build projects, write documentation, and capture code snippets.', icon: <Terminal size={22} className="text-[#BDE0FE]" />, activeColor: '#BDE0FE' },
  { id: 'Student', title: 'Student', description: 'Track assignments, organize class lectures, and manage study guides.', icon: <GraduationCap size={22} className="text-[#B5EAD7]" />, activeColor: '#B5EAD7' },
  { id: 'Creator', title: 'Creator', description: 'Draft scripts, outline content ideas, and structure creative assets.', icon: <Palette size={22} className="text-[#FFC8DD]" />, activeColor: '#FFC8DD' },
  { id: 'Researcher', title: 'Researcher', description: 'Compile references, document experiments, and analyze findings.', icon: <Microscope size={22} className="text-[#95E1D3]" />, activeColor: '#95E1D3' },
  { id: 'Startup', title: 'Startup', description: 'Organize team syncs, write product requirements, and track roadmap.', icon: <RocketLaunch size={22} className="text-[#FFDAC1]" />, activeColor: '#FFDAC1' },
  { id: 'Personal', title: 'Personal', description: 'Journal daily thoughts, set life goals, and coordinate daily tasks.', icon: <User size={22} className="text-[#FFF5C3]" />, activeColor: '#FFF5C3' }
];

interface StyleStepProps {
  selectedStyle: PresetStyle;
  setSelectedStyle: (style: PresetStyle) => void;
  nextStep: () => void;
  activeTags: string[];
  handleRemoveTag: (tag: string) => void;
  activePages: { id: string; title: string }[];
  handleRemovePage: (id: string) => void;
  resetSeedingDefaults: () => void;
}

export const StyleStep: React.FC<StyleStepProps> = ({
  selectedStyle,
  setSelectedStyle,
  nextStep,
  activeTags,
  handleRemoveTag,
  activePages,
  handleRemovePage,
  resetSeedingDefaults
}) => {
  const currentPreset = STYLE_PRESETS.find(p => p.id === selectedStyle) || STYLE_PRESETS[5];

  return (
    <>
      <motion.div
        key="step3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl flex flex-col items-center space-y-4 text-center"
      >
        <div className="space-y-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider transition-colors"
            style={{ color: currentPreset.activeColor }}
          >
            Step 3 of 3
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-sans">
            Choose your style
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            This personalizes folders, default templates, and sample layouts.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full grid grid-cols-2 gap-3 pt-2">
          {STYLE_PRESETS.map((preset) => {
            const isSelected = selectedStyle === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedStyle(preset.id as PresetStyle)}
                className={cn(
                  "flex flex-col items-start text-left p-4 rounded-xl border bg-zinc-950/60 hover:bg-zinc-900/30 transition-all duration-200 cursor-pointer group active:scale-[0.98]",
                  isSelected
                    ? ""
                    : "border-zinc-900 hover:border-zinc-800"
                )}
                style={isSelected ? { borderColor: preset.activeColor, backgroundColor: `${preset.activeColor}08` } : undefined}
              >
                <span className="mb-3 block">{preset.icon}</span>
                <span
                  className={cn(
                    "text-xs font-semibold mb-1 transition-colors",
                    isSelected ? "" : "text-zinc-300 group-hover:text-zinc-200"
                  )}
                  style={isSelected ? { color: preset.activeColor } : undefined}
                >
                  {preset.title}
                </span>
                <span className="text-[11px] leading-relaxed text-zinc-500 font-sans">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={nextStep}
          className="px-6 py-2.5 text-zinc-950 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
          style={{
            backgroundColor: currentPreset.activeColor
          }}
        >
          Create Workspace
          <ArrowRight size={14} weight="bold" />
        </button>
      </motion.div>

      {/* Seeding Customizer: Outside of style options div, horizontal single rows, all visible */}
      <div className="w-full max-w-2xl flex flex-col space-y-3 pt-5 border-t border-zinc-900/40 mt-6 mx-auto">
        {/* Tags Row */}
        <div className="flex flex-row items-center gap-4 py-1.5">
          <span
            className="text-xs font-bold font-mono tracking-wider w-16 shrink-0 transition-colors text-left"
            style={{ color: currentPreset.activeColor }}
          >
            TAGS
          </span>
          <div className="flex flex-row flex-wrap gap-1.5 flex-1 items-center">
            {activeTags.length === 0 ? (
              <span className="text-[11px] text-zinc-600 italic">No tags will be created</span>
            ) : (
              activeTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-zinc-950/60 border border-zinc-900 text-zinc-400 hover:text-zinc-300 hover:border-zinc-800 py-1 px-3 rounded-full transition-all whitespace-nowrap"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors cursor-pointer flex items-center justify-center animate-none border-none bg-transparent"
                  >
                    <X size={9} weight="bold" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Pages Row */}
        <div className="flex flex-row items-center gap-4 py-1.5 pt-2.5 border-t border-zinc-900/10">
          <span
            className="text-xs font-bold font-mono tracking-wider w-16 shrink-0 transition-colors text-left"
            style={{ color: currentPreset.activeColor }}
          >
            PAGES
          </span>
          <div className="flex flex-row flex-wrap gap-1.5 flex-1 items-center">
            {activePages.length === 0 ? (
              <span className="text-[11px] text-zinc-600 italic">No pages will be created</span>
            ) : (
              activePages.map((page) => (
                <span
                  key={page.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-sans bg-zinc-950/60 border border-zinc-900 text-zinc-300 hover:text-zinc-200 hover:border-zinc-800 py-1 px-3 rounded-full transition-all whitespace-nowrap"
                  title={page.title}
                >
                  <FileText size={11} className="text-zinc-500 flex-shrink-0" />
                  <span>{page.title}</span>
                  <button
                    onClick={() => handleRemovePage(page.id)}
                    className="text-zinc-600 hover:text-red-400 p-0.5 transition-colors cursor-pointer flex items-center justify-center animate-none border-none bg-transparent"
                  >
                    <X size={9} weight="bold" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Reset Button */}
        {(activeTags.length < 5 || activePages.length < 5) && (
          <div className="pt-2 text-center">
            <button
              onClick={resetSeedingDefaults}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer uppercase tracking-wider underline active:scale-95 border-none bg-transparent"
            >
              Reset Seeding Defaults
            </button>
          </div>
        )}
      </div>
    </>
  );
};
