import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '../store/uiStore';
import { useDocumentStore } from '../store/documentStore';
import { useShallow } from 'zustand/react/shallow';
import {
  X,
  Calendar,
  Clock,
  User,
  Check,
  PaintBrush,
  ArrowCounterClockwise,
  Drop,
  Image,
  CaretDown
} from '@phosphor-icons/react';
import { cn } from '../lib/utils';

export const RightSidebar = () => {
  const { isRightSidebarOpen, toggleRightSidebar } = useUiStore();
  const [activeTab, setActiveTab] = useState('Style');

  const tabs = ['Style', 'Info'];

  return (
    <AnimatePresence>
      {isRightSidebarOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="h-full border-l border-border bg-background shrink-0 flex flex-col overflow-hidden z-20 shadow-2xl"
        >
          {/* Header */}
          <div className="h-12 border-b border-border flex items-center px-4 shrink-0 justify-between gap-1 bg-black/20">
            <div className="flex gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap",
                    activeTab === tab
                      ? "text-accent bg-white/5 border border-white/10"
                      : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={toggleRightSidebar}
              className="p-1 px-1.5 rounded-md text-muted-foreground/80 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20 border border-transparent transition-all duration-200 shrink-0 shadow-sm"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden no-scrollbar bg-black/10">
            {activeTab === 'Style' && <StyleTab />}
            {activeTab === 'Info' && <InfoTab />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StyleTab = () => {
  const { panes, activePaneId } = useUiStore();
  const updateDocument = useDocumentStore(state => state.updateDocument);

  // Custom picker expand collapse to prevent glitches and keep selection stable
  const [showColorPickerInline, setShowColorPickerInline] = useState(false);
  const [showPaperColorPickerInline, setShowPaperColorPickerInline] = useState(false);

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeDocId = activePane?.activeTabId;

  // Retrieve ONLY the active document using a targeted selector to prevent re-renders when other documents are edited
  const documentSelector = useCallback(
    state => {
      if (!activeDocId || activeDocId.startsWith('section-') || activeDocId === 'new-note') return null;
      return state.documents[activeDocId] || null;
    },
    [activeDocId]
  );
  const document = useDocumentStore(useShallow(documentSelector));

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <PaintBrush size={32} className="text-muted-foreground mb-3 opacity-30" />
        <p className="text-xs text-muted-foreground font-mono">No active document selected.</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">Open a document from the sidebar to customize its theme.</p>
      </div>
    );
  }

  // Preset configuration
  const solidPresets = [
    '#050505', // Deep Black Focus
    '#1c1c1c', // Midnight Mode
    '#0e1726', // Nocturnal Blue
    '#18181b', // Slate Charcoal
    '#27272a', // Grey Focus
    '#1f2937', // Steel Blue
    '#064e3b', // Deep Teal Focus
    '#312e81', // Midnight Indigo
    '#fafafa', // Minimal White
    '#f4f1ea', // Warm Sand Paper
  ];

  const gradientPresets = [
    { start: '#0f172a', end: '#3b0764', dir: 'linear-gradient(135deg, #0f172a, #3b0764)', name: 'Midnight Aurora' },
    { start: '#09090b', end: '#064e3b', dir: 'linear-gradient(135deg, #09090b, #064e3b)', name: 'Deep Forest' },
    { start: '#1e1b4b', end: '#4c1d95', dir: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', name: 'Cosmic Royal' },
    { start: '#38bdf8', end: '#3b82f6', dir: 'linear-gradient(135deg, #38bdf8, #3b82f6)', name: 'Ocean Mist' },
    { start: '#fdf4ff', end: '#fbcfe8', dir: 'linear-gradient(135deg, #fdf4ff, #fbcfe8)', name: 'Pastel Orchid (Bright)' },
    { start: '#f0fdf4', end: '#bbf7d0', dir: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)', name: 'Faded Matcha (Bright)' },
    { start: '#020617', end: '#475569', dir: 'linear-gradient(180deg, #020617, #475569)', name: 'Cinematic Slate' },
    { start: '#2e1065', end: '#9f1239', dir: 'linear-gradient(135deg, #2e1065, #9f1239)', name: 'Blood Moon' },
  ];

  const paperPresets = [
    { name: 'Float (None)', value: undefined },
    { name: 'Minimal White', value: '#ffffff' },
    { name: 'Onyx Black', value: '#111827' },
    { name: 'Warm Ivory', value: '#faf8f5' },
    { name: 'Soft Sand', value: '#f4f1ea' },
    { name: 'Midnight Blue', value: '#0f172a' },
    { name: 'Deep Focus', value: '#09090b' },
  ];

  const textPresets = [
    { name: 'Auto', value: undefined },
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Soft Silver', value: '#e2e8f0' },
    { name: 'Charcoal Black', value: '#111827' },
    { name: 'Slate Gray', value: '#475569' },
    { name: 'Muted Taupe', value: '#78716c' },
  ];

  const currentType = document.backdropType || 'none';
  const currentStyle = document.backdropStyle || 'immersive';
  const currentStart = document.backdropGradientStart || '#a3f4c5';
  const currentEnd = document.backdropGradientEnd || '#ffbbbb';
  const currentDir = document.backdropGradientDirection || '180deg';

  // Master style update that ensures background, helper start/end, and type sync properly
  const setBackdropType = (type: 'none' | 'solid' | 'gradient') => {
    if (type === 'none') {
      updateDocument(document.id, {
        backdropType: 'none',
        backdropColor: undefined,
      });
    } else if (type === 'solid') {
      // Pick first solid of presets if not present
      const initialSolid = document.backdropColor && !document.backdropColor.includes('gradient')
        ? document.backdropColor
        : solidPresets[0];
      updateDocument(document.id, {
        backdropType: 'solid',
        backdropColor: initialSolid,
      });
    } else if (type === 'gradient') {
      // Assemble CSS linear gradient based on cached values or defaults
      const start = document.backdropGradientStart || '#a3f4c5';
      const end = document.backdropGradientEnd || '#ffbbbb';
      const dir = document.backdropGradientDirection || '180deg';
      const cssSpec = `linear-gradient(${dir}, ${start}, ${end})`;
      updateDocument(document.id, {
        backdropType: 'gradient',
        backdropGradientStart: start,
        backdropGradientEnd: end,
        backdropGradientDirection: dir,
        backdropColor: cssSpec,
      });
    }
  };

  const setBackdropStyleMode = (styleMode: 'immersive' | 'faded') => {
    updateDocument(document.id, { backdropStyle: styleMode });
  };

  const handleSolidColorSelect = (color: string) => {
    updateDocument(document.id, {
      backdropType: 'solid',
      backdropColor: color,
    });
  };

  const handleGradientPresetSelect = (preset: typeof gradientPresets[0]) => {
    updateDocument(document.id, {
      backdropType: 'gradient',
      backdropGradientStart: preset.start,
      backdropGradientEnd: preset.end,
      backdropGradientDirection: '180deg',
      backdropColor: `linear-gradient(180deg, ${preset.start}, ${preset.end})`,
    });
  };

  const handleGradientCustomUpdate = (updates: { start?: string; end?: string; dir?: string }) => {
    const nextStart = updates.start !== undefined ? updates.start : currentStart;
    const nextEnd = updates.end !== undefined ? updates.end : currentEnd;
    const nextDir = updates.dir !== undefined ? updates.dir : currentDir;

    // Fallback radial gradient syntax support
    const cssSpec = nextDir === 'radial'
      ? `radial-gradient(circle, ${nextStart}, ${nextEnd})`
      : `linear-gradient(${nextDir}, ${nextStart}, ${nextEnd})`;

    updateDocument(document.id, {
      backdropGradientStart: nextStart,
      backdropGradientEnd: nextEnd,
      backdropGradientDirection: nextDir,
      backdropColor: cssSpec,
      backdropType: 'gradient'
    });
  };

  const handleResetAll = () => {
    updateDocument(document.id, {
      backdropType: 'none',
      backdropStyle: 'immersive',
      backdropColor: undefined,
      backdropGradientStart: undefined,
      backdropGradientEnd: undefined,
      backdropGradientDirection: undefined,
      documentColor: undefined,
      textColor: undefined
    });
    setShowColorPickerInline(false);
    setShowPaperColorPickerInline(false);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5 font-mono">
          <PaintBrush size={14} className="text-accent" />
          Page Theme
        </span>
        <button
          onClick={handleResetAll}
          className="text-[10px] font-mono text-muted-foreground hover:text-white flex items-center gap-1 hover:bg-white/5 border border-white/10 px-2 py-0.5 rounded transition-colors"
          title="Reset Style"
        >
          <ArrowCounterClockwise size={10} />
          Reset
        </button>
      </div>

      {/* Backdrop Module */}
      <div className="space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Backdrop</span>

        {/* Segmented Control Selector for Types - Matches mockup precisely */}
        <div className="grid grid-cols-4 bg-black/40 border border-white/5 p-1 rounded-xl">
          {/* None/Disabled */}
          <button
            onClick={() => setBackdropType('none')}
            className={cn(
              "py-2 flex items-center justify-center rounded-lg transition-all text-xs relative group-hover:bg-white/5",
              currentType === 'none'
                ? "bg-white/10 text-white shadow-sm border border-white/5 font-semibold"
                : "text-muted-foreground hover:text-white"
            )}
            title="No Backdrop"
          >
            <div className="w-5 h-5 flex items-center justify-center relative">
              <div className="border border-current w-3.5 h-3.5 rounded-sm relative">
                <div className="absolute top-1/2 left-0 right-0 border-t border-current -rotate-45 transform origin-center" />
              </div>
            </div>
          </button>

          {/* Solid */}
          <button
            onClick={() => setBackdropType('solid')}
            className={cn(
              "py-2 flex items-center justify-center rounded-lg transition-all text-xs",
              currentType === 'solid'
                ? "bg-white/10 text-white shadow-sm border border-white/5 font-semibold"
                : "text-muted-foreground hover:text-white"
            )}
            title="Solid Backdrop"
          >
            <div className="w-3.5 h-3.5 bg-current rounded-sm border border-current" />
          </button>

          {/* Gradient */}
          <button
            onClick={() => setBackdropType('gradient')}
            className={cn(
              "py-2 flex items-center justify-center rounded-lg transition-all text-xs",
              currentType === 'gradient'
                ? "bg-white/10 text-white shadow-sm border border-white/5 font-semibold"
                : "text-muted-foreground hover:text-white"
            )}
            title="Gradient Backdrop"
          >
            <div className="w-3.5 h-3.5 rounded-sm border border-current bg-gradient-to-tr from-muted-foreground to-foreground opacity-90" />
          </button>

          {/* Image (Mock representation) */}
          <button
            className="py-2 flex items-center justify-center rounded-lg transition-all text-xs text-muted-foreground/30 cursor-not-allowed"
            title="Image Backdrop"
            disabled
          >
            <Image size={15} />
          </button>
        </div>

        {/* Faded vs Immersive styling toggles - Matches mockup */}
        {currentType !== 'none' && (
          <div className="grid grid-cols-2 bg-black/25 border border-white/5 p-0.5 rounded-lg text-xs gap-1">
            <button
              onClick={() => setBackdropStyleMode('immersive')}
              className={cn(
                "py-1 rounded-md transition-all font-mono text-[11px]",
                currentStyle === 'immersive'
                  ? "bg-white/5 text-white shadow-sm border border-white/5 font-semibold"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              Immersive
            </button>
            <button
              onClick={() => setBackdropStyleMode('faded')}
              className={cn(
                "py-1 rounded-md transition-all font-mono text-[11px]",
                currentStyle === 'faded'
                  ? "bg-white/5 text-white shadow-sm border border-white/5 font-semibold"
                  : "text-white/90 bg-black/10 hover:text-white"
              )}
            >
              Faded
            </button>
          </div>
        )}

        {/* Type Dependent Swatches Grid */}
        {currentType === 'solid' && (
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2 pt-1">
              {solidPresets.map((color, idx) => {
                const isSelected = document.backdropColor === color;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSolidColorSelect(color);
                      setShowColorPickerInline(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center shadow-md",
                      isSelected ? "border-accent ring-2 ring-accent/30 scale-105" : "border-white/10 hover:border-white/35"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check size={12} className="text-white drop-shadow font-bold" />}
                  </button>
                );
              })}

              {/* Rainbow selector matches image mockup */}
              <button
                onClick={() => setShowColorPickerInline(!showColorPickerInline)}
                className={cn(
                  "w-8 h-8 rounded-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group shadow-lg justify-self-center",
                  showColorPickerInline ? "border-accent ring-2 ring-accent/30 scale-105" : "border-white/10 hover:border-white/30"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow" />
              </button>
            </div>

            {/* Stable inline picker - absolutely non-glitchy, won't disappear */}
            {showColorPickerInline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2.5 overflow-hidden font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Select Custom Color:</span>
                  <span className="text-accent text-[10px] uppercase font-bold">{document.backdropColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-white/10 relative overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: document.backdropColor || '#ffffff' }} />
                  <input
                    type="color"
                    value={document.backdropColor || '#ffffff'}
                    onChange={(e) => handleSolidColorSelect(e.target.value)}
                    className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded overflow-hidden"
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Gradient Selection Panel - Image 3 Design */}
        {currentType === 'gradient' && (
          <div className="space-y-4 pt-1">
            {/* Swatch circle gradient presets */}
            <div className="grid grid-cols-6 gap-2">
              {gradientPresets.map((preset, idx) => {
                // Determine if preset matches (via start/end matching)
                const isSelected = currentStart.toLowerCase() === preset.start.toLowerCase() &&
                  currentEnd.toLowerCase() === preset.end.toLowerCase();

                return (
                  <button
                    key={idx}
                    onClick={() => handleGradientPresetSelect(preset)}
                    className={cn(
                      "w-8 h-8 rounded-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center shadow-md",
                      isSelected ? "border-accent ring-2 ring-accent/30 scale-105" : "border-white/10 hover:border-white/35"
                    )}
                    style={{ background: preset.dir }}
                    title={preset.name}
                  >
                    {isSelected && <Check size={12} className="text-white drop-shadow font-bold" />}
                  </button>
                );
              })}

              {/* Rainbow arrow circle inline picker toggle */}
              <button
                onClick={() => setShowColorPickerInline(!showColorPickerInline)}
                className={cn(
                  "w-8 h-8 rounded-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group shadow-lg justify-self-center",
                  showColorPickerInline ? "border-accent ring-2 ring-accent/30 scale-105" : "border-white/10 hover:border-white/30"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow" />
              </button>
            </div>

            {/* Custom inputs from Mockup 3 for Start/End color styling */}
            {showColorPickerInline && (
              <div className="space-y-4 p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[11px] transition-all">
                {/* Start Color picker */}
                <div className="space-y-2 pb-2.5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      Start Color
                    </span>
                    <span className="text-accent text-[10px] uppercase font-bold">{currentStart}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-white/10 relative overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: currentStart }} />
                    <input
                      type="color"
                      value={currentStart}
                      onChange={(e) => handleGradientCustomUpdate({ start: e.target.value })}
                      className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded overflow-hidden"
                    />
                  </div>
                </div>

                {/* End Color picker */}
                <div className="space-y-2 pb-2.5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-pink-400" />
                      End Color
                    </span>
                    <span className="text-pink-400 text-[10px] uppercase font-bold">{currentEnd}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-white/10 relative overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: currentEnd }} />
                    <input
                      type="color"
                      value={currentEnd}
                      onChange={(e) => handleGradientCustomUpdate({ end: e.target.value })}
                      className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded overflow-hidden"
                    />
                  </div>
                </div>

                {/* Direction dropdown picker */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Direction</span>
                  <select
                    value={currentDir}
                    onChange={(e) => handleGradientCustomUpdate({ dir: e.target.value })}
                    className="flex-1 max-w-[124px] bg-black/40 border border-white/10 rounded-lg text-white/95 px-2.5 py-1 text-[11px] outline-none hover:border-white/20 transition-all font-mono"
                  >
                    <option className="bg-neutral-900" value="180deg">Top to Bottom</option>
                    <option className="bg-neutral-900" value="90deg">Left to Right</option>
                    <option className="bg-neutral-900" value="45deg">Diagonal Up</option>
                    <option className="bg-neutral-900" value="135deg">Diagonal Down</option>
                    <option className="bg-neutral-900" value="radial">Radial Circle</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paper and text parameters */}
      <div className="space-y-4 pt-1 border-t border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Paper & Text</span>
        <div className="space-y-3.5">
          {/* Paper Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">Document Color</span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {paperPresets.map((swatch, idx) => {
                const isSelected = document.documentColor === swatch.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      updateDocument(document.id, { documentColor: swatch.value });
                      if (swatch.value === undefined) {
                        setShowPaperColorPickerInline(false);
                      }
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5",
                      isSelected ? "border-accent ring-2 ring-accent/20 scale-105" : "border-white/15 hover:border-white/30"
                    )}
                    style={swatch.value ? { backgroundColor: swatch.value } : undefined}
                    title={swatch.name}
                  >
                    {!swatch.value && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[18px] h-[1px] bg-red-500 rotate-45 transform origin-center" />
                      </div>
                    )}
                    {isSelected && (
                      <Check
                        size={10}
                        className={cn(
                          "font-bold drop-shadow z-10",
                          !swatch.value || swatch.value === '#ffffff'
                            ? "text-slate-850"
                            : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}

              {/* Rainbow selector for custom document color */}
              <button
                onClick={() => setShowPaperColorPickerInline(!showPaperColorPickerInline)}
                className={cn(
                  "w-6 h-6 rounded-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group shadow-lg",
                  showPaperColorPickerInline ? "border-accent ring-2 ring-accent/20 scale-105" : "border-white/15 hover:border-white/30"
                )}
                title="Custom Paper Color"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={10} className="text-white relative z-10 font-bold drop-shadow" />
              </button>
            </div>

            {/* Custom inline paper color picker panel */}
            {showPaperColorPickerInline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2.5 overflow-hidden font-mono text-[11px] mt-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Custom Paper Color:</span>
                  <span className="text-accent text-[10px] uppercase font-bold">{document.documentColor || '#ffffff'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-white/10 relative overflow-hidden shrink-0 shadow-lg" style={{ backgroundColor: document.documentColor || '#ffffff' }} />
                  <input
                    type="color"
                    value={document.documentColor || '#ffffff'}
                    onChange={(e) => updateDocument(document.id, { documentColor: e.target.value })}
                    className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded overflow-hidden"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Text Color presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">Text Color</span>
            <div className="flex flex-wrap gap-1.5">
              {textPresets.map((swatch, idx) => {
                const isSelected = document.textColor === swatch.value;
                return (
                  <button
                    key={idx}
                    onClick={() => updateDocument(document.id, { textColor: swatch.value })}
                    className={cn(
                      "w-6 h-6 rounded-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5",
                      isSelected ? "border-accent ring-2 ring-accent/20 scale-105" : "border-white/15 hover:border-white/30"
                    )}
                    style={swatch.value ? { backgroundColor: swatch.value } : undefined}
                    title={swatch.name}
                  >
                    {!swatch.value && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[18px] h-[1px] bg-red-500 rotate-45 transform origin-center" />
                      </div>
                    )}
                    {isSelected && (
                      <Check
                        size={10}
                        className={cn(
                          "font-bold drop-shadow z-10",
                          !swatch.value || swatch.value === '#ffffff'
                            ? "text-slate-850"
                            : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-mono">
          <strong>Tip:</strong> Immersive mode outputs beautiful high-vibrancy backdrops. Use faded mode for sweet, low-contrast pastel visual layouts.
        </p>
      </div>
    </div>
  );
};

const InfoTab = () => {
  const { panes, activePaneId } = useUiStore();
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const [subTab, setSubTab] = useState('Page Info');

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeDocId = activePane?.activeTabId;

  // Retrieve ONLY the active document using a targeted selector to prevent re-renders when other documents are edited
  const documentSelector = useCallback(
    state => {
      if (!activeDocId || activeDocId.startsWith('section-') || activeDocId === 'new-note') return null;
      return state.documents[activeDocId] || null;
    },
    [activeDocId]
  );
  const document = useDocumentStore(useShallow(documentSelector));

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <Clock size={32} className="text-muted-foreground mb-3 opacity-30" />
        <p className="text-xs text-muted-foreground font-mono">No active document selected.</p>
      </div>
    );
  }

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex bg-white/5 border border-white/10 p-1 rounded-md gap-1">
        {['Page Info', 'Actions'].map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded transition-all font-mono",
              subTab === tab
                ? "bg-white/10 text-white shadow-sm border border-white/5"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTab === 'Page Info' ? (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-white tracking-tight font-mono">Page Info</h3>

          <div className="space-y-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Properties</span>

            <div className="space-y-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
              {/* Created */}
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">Created:</span>
                  <span className="text-foreground/90 font-medium font-sans">
                    {formatRelativeTime(document.createdAt)}
                  </span>
                </div>
              </div>

              {/* Updated */}
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">Updated:</span>
                  <span className="text-foreground/90 font-medium font-sans">
                    {formatRelativeTime(document.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <User size={16} className="text-muted-foreground shrink-0" />
                <div className="flex items-center gap-1.5 text-xs flex-1">
                  <span className="text-muted-foreground font-mono">Author:</span>
                  <input
                    value={document.author || 'new user'}
                    onChange={(e) => updateDocument(document.id, { author: e.target.value })}
                    className="bg-transparent border-b border-white/5 hover:border-white/20 focus:border-accent text-foreground/90 font-medium font-sans outline-none flex-1 px-1 py-0.5 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 font-mono">
          <h3 className="text-sm font-semibold text-white tracking-tight">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                const downloadLink = window.document.createElement("a");
                const file = new Blob([document.content || ""], { type: 'text/html' });
                downloadLink.href = URL.createObjectURL(file);
                downloadLink.download = `${document.title || 'untitled'}.html`;
                window.document.body.appendChild(downloadLink);
                downloadLink.click();
                window.document.body.removeChild(downloadLink);
              }}
              className="w-full py-2 hover:bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white flex items-center justify-center gap-2 transition-all rounded"
            >
              Export as HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
