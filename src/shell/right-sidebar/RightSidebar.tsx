import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
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
import { cn } from '@/shared/lib/utils';
import { getRelativeTimeString } from '@/shared/lib/time';

export const RightSidebar = () => {
  const { isRightSidebarOpen, toggleRightSidebar } = useUiStore(
    useShallow((state) => ({
      isRightSidebarOpen: state.isRightSidebarOpen,
      toggleRightSidebar: state.toggleRightSidebar,
    }))
  );
  const [activeTab, setActiveTab] = useState('Style');

  const tabs = ['Style', 'Info'];

  return (
    <div
      className={cn(
        "h-full border-l border-border bg-background shrink-0 flex flex-col overflow-hidden z-20 shadow-sm-none transition-[width,opacity] duration-250 ease-out will-change-[width,opacity]",
        isRightSidebarOpen ? "w-[320px] opacity-100" : "w-0 opacity-0 pointer-events-none"
      )}
    >
          {/* Header */}
          <div className="h-12 border-b border-border flex items-center px-4 shrink-0 justify-between gap-1 bg-muted">
            <div className="flex gap-1.5">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-sm-sm transition-all whitespace-nowrap",
                    activeTab === tab
                      ? "text-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:text-white dark:hover:bg-white/5 border border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={toggleRightSidebar}
              className="p-1 px-1.5 rounded-sm-sm text-muted-foreground/80 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20 border border-transparent transition-all duration-200 shrink-0 shadow-sm-sm"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden no-scrollbar bg-background">
            {activeTab === 'Style' && <StyleTab />}
            {activeTab === 'Info' && <InfoTab />}
          </div>
    </div>
  );
};

const StyleTab = () => {
  const { panes, activePaneId } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
    }))
  );
  const updateDocument = useDocumentStore(state => state.updateDocument);

  // Custom picker expand collapse to prevent glitches and keep selection stable
  const [showColorPickerInline, setShowColorPickerInline] = useState(false);
  const [showPaperColorPickerInline, setShowPaperColorPickerInline] = useState(false);
  const [showPaperGradientPickerInline, setShowPaperGradientPickerInline] = useState(false);

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
    '#f8fafc', // Slate-50 (Morning Slate)
    '#f0fdf4', // Emerald-50 (Spring Garden)
    '#f0f9ff', // Sky-50 (Ocean Air)
    '#09090b', // Zinc-950 (Absolute Dark)
    '#0f172a', // Slate-900 (Deep Slate)
  ];

  const gradientPresets = [
    { start: '#f8fafc', end: '#e2e8f0', dir: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', name: 'Morning Mist' },
    { start: '#f0fdf4', end: '#dcfce7', dir: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', name: 'Spring Garden' },
    { start: '#f0f9ff', end: '#e0f2fe', dir: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', name: 'Ocean Air' },
    { start: '#09090b', end: '#18181b', dir: 'linear-gradient(135deg, #09090b, #18181b)', name: 'Absolute Dark' },
    { start: '#0f172a', end: '#1e293b', dir: 'linear-gradient(135deg, #0f172a, #1e293b)', name: 'Deep Slate' },
  ];

  const paperPresets = [
    { name: 'Float (None)', value: undefined },
    { name: 'Pure White', value: '#ffffff' },
    
    // Complementary Dark Solids
    { name: 'Obsidian Black', value: '#121214' },
    { name: 'Slate Shadow', value: '#1e293b' },
    { name: 'Midnight Indigo', value: '#1a1740' },
    { name: 'Deep Forest', value: '#07241c' },
  ];

  const paperGradientPresets = [
    { start: '#ffffff', end: '#fafaf6', dir: 'linear-gradient(135deg, #ffffff, #fafaf6)', name: 'Silk Cream' },
    { start: '#ffffff', end: '#edf7f2', dir: 'linear-gradient(135deg, #ffffff, #edf7f2)', name: 'Spring Garden Silk' },
    { start: '#ffffff', end: '#ebf5fc', dir: 'linear-gradient(135deg, #ffffff, #ebf5fc)', name: 'Ocean Air Silk' },
    
    // Complementary Dark Gradients
    { start: '#18181b', end: '#09090b', dir: 'linear-gradient(135deg, #18181b, #09090b)', name: 'Absolute Dark Silk' },
    { start: '#1e293b', end: '#0f172a', dir: 'linear-gradient(135deg, #1e293b, #0f172a)', name: 'Deep Slate Silk' },
    { start: '#1f1b40', end: '#100e26', dir: 'linear-gradient(135deg, #1f1b40, #100e26)', name: 'Cosmic Indigo Silk' },
  ];

  const textPresets = [
    { name: 'Auto', value: undefined },
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Charcoal Black', value: '#000000' },
  ];

  const currentType = document.backdropType || 'none';
  const currentStyle = document.backdropStyle || 'immersive';
  const currentStart = document.backdropGradientStart || '#a3f4c5';
  const currentEnd = document.backdropGradientEnd || '#ffbbbb';
  const currentDir = document.backdropGradientDirection || '180deg';

  const paperType = document.documentColorType || 'solid';
  const paperStart = document.documentGradientStart || '#ffffff';
  const paperEnd = document.documentGradientEnd || '#f1f5f9';
  const paperDir = document.documentGradientDirection || '135deg';

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

  const setPaperType = (type: 'solid' | 'gradient') => {
    if (type === 'solid') {
      const initialSolid = document.documentColor && !document.documentColor.includes('gradient')
        ? document.documentColor
        : '#ffffff';
      updateDocument(document.id, {
        documentColorType: 'solid',
        documentColor: initialSolid,
      });
    } else if (type === 'gradient') {
      const start = document.documentGradientStart || '#ffffff';
      const end = document.documentGradientEnd || '#f1f5f9';
      const dir = document.documentGradientDirection || '135deg';
      const cssSpec = `linear-gradient(${dir}, ${start}, ${end})`;
      updateDocument(document.id, {
        documentColorType: 'gradient',
        documentGradientStart: start,
        documentGradientEnd: end,
        documentGradientDirection: dir,
        documentColor: cssSpec,
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

  const handlePaperGradientPresetSelect = (preset: typeof paperGradientPresets[0]) => {
    updateDocument(document.id, {
      documentColorType: 'gradient',
      documentGradientStart: preset.start,
      documentGradientEnd: preset.end,
      documentGradientDirection: '135deg',
      documentColor: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
    });
  };

  const handlePaperGradientCustomUpdate = (updates: { start?: string; end?: string; dir?: string }) => {
    const nextStart = updates.start !== undefined ? updates.start : paperStart;
    const nextEnd = updates.end !== undefined ? updates.end : paperEnd;
    const nextDir = updates.dir !== undefined ? updates.dir : paperDir;

    const cssSpec = nextDir === 'radial'
      ? `radial-gradient(circle, ${nextStart}, ${nextEnd})`
      : `linear-gradient(${nextDir}, ${nextStart}, ${nextEnd})`;

    updateDocument(document.id, {
      documentGradientStart: nextStart,
      documentGradientEnd: nextEnd,
      documentGradientDirection: nextDir,
      documentColor: cssSpec,
      documentColorType: 'gradient'
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
      documentColorType: 'solid',
      documentGradientStart: undefined,
      documentGradientEnd: undefined,
      documentGradientDirection: undefined,
      textColor: undefined
    });
    setShowColorPickerInline(false);
    setShowPaperColorPickerInline(false);
    setShowPaperGradientPickerInline(false);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/5 pb-3">
        <span className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5 font-mono">
          <PaintBrush size={14} className="text-accent" />
          Page Theme
        </span>
        <button
          onClick={handleResetAll}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground dark:hover:text-white flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-sm transition-colors cursor-pointer"
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
        <div className="grid grid-cols-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          {/* None/Disabled */}
          <button
            onClick={() => setBackdropType('none')}
            className={cn(
              "py-2 flex items-center justify-center rounded-sm-sm transition-all text-xs relative group-hover:bg-black/5 dark:group-hover:bg-white/5 cursor-pointer",
              currentType === 'none'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            title="No Backdrop"
          >
            <div className="w-5 h-5 flex items-center justify-center relative">
              <div className="border border-current w-3.5 h-3.5 rounded-sm-sm relative">
                <div className="absolute top-1/2 left-0 right-0 border-t border-current -rotate-45 transform origin-center" />
              </div>
            </div>
          </button>

          {/* Solid */}
          <button
            onClick={() => setBackdropType('solid')}
            className={cn(
              "py-2 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer",
              currentType === 'solid'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            title="Solid Backdrop"
          >
            <div className="w-3.5 h-3.5 bg-current rounded-sm-sm border border-current" />
          </button>

          {/* Gradient */}
          <button
            onClick={() => setBackdropType('gradient')}
            className={cn(
              "py-2 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer",
              currentType === 'gradient'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            title="Gradient Backdrop"
          >
            <div className="w-3.5 h-3.5 rounded-sm-sm border border-current bg-gradient-to-tr from-muted-foreground to-foreground opacity-90" />
          </button>
        </div>



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
                      "w-8 h-8 rounded-sm-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                      isSelected ? "scale-105" : ""
                    )}
                    style={{ 
                      backgroundColor: color,
                      boxShadow: isSelected 
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${color}` 
                        : `0 0 0 2px var(--background), 0 0 0 4px var(--foreground)`
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        className={cn(
                          "font-bold drop-shadow-sm z-10",
                          color === '#fafafa' || color === '#f4f1ea'
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}

              {/* Rainbow selector matches image mockup */}
              <button
                onClick={() => setShowColorPickerInline(!showColorPickerInline)}
                className={cn(
                  "w-8 h-8 rounded-sm-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group justify-self-center cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                  showColorPickerInline ? "scale-105" : ""
                )}
                style={{
                  boxShadow: showColorPickerInline 
                    ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                    : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
              </button>
            </div>

            {/* Stable inline picker - absolutely non-glitchy, won't disappear */}
            {showColorPickerInline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-3 bg-black/20 border border-white/5 rounded-sm-sm space-y-2.5 overflow-hidden font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Select Custom Color:</span>
                  <span className="text-accent text-[10px] uppercase font-bold">{document.backdropColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: document.backdropColor || '#ffffff' }} />
                  <input
                    type="color"
                    value={document.backdropColor || '#ffffff'}
                    onChange={(e) => handleSolidColorSelect(e.target.value)}
                    className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
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
                      "w-8 h-8 rounded-sm-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                      isSelected ? "scale-105" : ""
                    )}
                    style={{ 
                      background: preset.dir,
                      boxShadow: isSelected 
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${preset.start}` 
                        : `0 0 0 2px var(--background), 0 0 0 4px var(--foreground)`
                    }}
                    title={preset.name}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        className={cn(
                          "font-bold drop-shadow-sm z-10",
                          preset.start === '#fdf4ff' || preset.start === '#f0fdf4'
                            ? "text-slate-800 dark:text-slate-200"
                            : "text-white"
                        )}
                      />
                    )}
                  </button>
                );
              })}

              {/* Rainbow arrow circle inline picker toggle */}
              <button
                onClick={() => setShowColorPickerInline(!showColorPickerInline)}
                className={cn(
                  "w-8 h-8 rounded-sm-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group justify-self-center cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                  showColorPickerInline ? "scale-105" : ""
                )}
                style={{
                  boxShadow: showColorPickerInline 
                    ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                    : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
              </button>
            </div>

            {/* Custom inputs from Mockup 3 for Start/End color styling */}
            {showColorPickerInline && (
              <div className="space-y-4 p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm font-mono text-[11px] transition-all">
                {/* Start Color picker */}
                <div className="space-y-2 pb-2.5 border-b border-black/10 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm-full bg-accent" />
                      Start Color
                    </span>
                    <span className="text-accent text-[10px] uppercase font-bold">{currentStart}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: currentStart }} />
                    <input
                      type="color"
                      value={currentStart}
                      onChange={(e) => handleGradientCustomUpdate({ start: e.target.value })}
                      className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                    />
                  </div>
                </div>

                {/* End Color picker */}
                <div className="space-y-2 pb-2.5 border-b border-black/10 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm-full bg-pink-400" />
                      End Color
                    </span>
                    <span className="text-pink-400 text-[10px] uppercase font-bold">{currentEnd}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: currentEnd }} />
                    <input
                      type="color"
                      value={currentEnd}
                      onChange={(e) => handleGradientCustomUpdate({ end: e.target.value })}
                      className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                    />
                  </div>
                </div>

                {/* Direction dropdown picker */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Direction</span>
                  <select
                    value={currentDir}
                    onChange={(e) => handleGradientCustomUpdate({ dir: e.target.value })}
                    className="flex-1 max-w-[124px] bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-sm-sm text-foreground dark:text-white/95 px-2.5 py-1 text-[11px] outline-none hover:border-black/20 dark:hover:border-white/20 transition-all font-mono"
                  >
                    <option className="bg-neutral-100 dark:bg-neutral-900" value="180deg">Top to Bottom</option>
                    <option className="bg-neutral-100 dark:bg-neutral-900" value="90deg">Left to Right</option>
                    <option className="bg-neutral-100 dark:bg-neutral-900" value="45deg">Diagonal Up</option>
                    <option className="bg-neutral-100 dark:bg-neutral-900" value="135deg">Diagonal Down</option>
                    <option className="bg-neutral-100 dark:bg-neutral-900" value="radial">Radial Circle</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paper and text parameters */}
      <div className="space-y-4 pt-1 border-t border-black/10 dark:border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Paper & Text</span>
        
        {/* Segmented Control Selector for Document Color Type */}
        <div className="grid grid-cols-2 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          {/* Solid */}
          <button
            onClick={() => setPaperType('solid')}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer font-mono",
              paperType === 'solid'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Solid
          </button>

          {/* Gradient */}
          <button
            onClick={() => setPaperType('gradient')}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer font-mono",
              paperType === 'gradient'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Gradient
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Paper Solid vs Gradient Swatches Panel */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">Document Color</span>
            
            {paperType === 'solid' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3.5 items-center pt-1">
                  {paperPresets.map((swatch, idx) => {
                    const isSelected = document.documentColor === swatch.value;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          updateDocument(document.id, { documentColor: swatch.value, documentColorType: 'solid' });
                          if (swatch.value === undefined) {
                            setShowPaperColorPickerInline(false);
                          }
                        }}
                        className={cn(
                          "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5 cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                          isSelected ? "scale-105" : ""
                        )}
                        style={{
                          background: swatch.value || undefined,
                          boxShadow: isSelected 
                            ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch.value || '#94a3b8'}` 
                            : `0 0 0 2px var(--background), 0 0 0 4px var(--foreground)`
                        }}
                        title={swatch.name}
                      >
                        {!swatch.value && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[20px] h-[1px] bg-red-500 rotate-45 transform origin-center" />
                          </div>
                        )}
                        {isSelected && (
                          <Check
                            size={11}
                            className={cn(
                              "font-bold drop-shadow-sm z-10",
                              !swatch.value || swatch.value === '#ffffff' || swatch.value === '#fcfaf7' || swatch.value === '#f1f5f9'
                                ? "text-slate-800 dark:text-slate-200"
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
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                      showPaperColorPickerInline ? "scale-105" : ""
                    )}
                    style={{
                      boxShadow: showPaperColorPickerInline 
                        ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                        : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                    }}
                    title="Custom Paper Color"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                    <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
                  </button>
                </div>

                {/* Custom inline paper color picker panel */}
                {showPaperColorPickerInline && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm space-y-2.5 overflow-hidden font-mono text-[11px] mt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Custom Paper Color:</span>
                      <span className="text-accent text-[10px] uppercase font-bold">{document.documentColor || '#ffffff'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ background: document.documentColor || '#ffffff' }} />
                      <input
                        type="color"
                        value={document.documentColor || '#ffffff'}
                        onChange={(e) => updateDocument(document.id, { documentColor: e.target.value, documentColorType: 'solid' })}
                        className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {paperType === 'gradient' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3.5 items-center pt-1">
                  {paperGradientPresets.map((swatch, idx) => {
                    const isSelected = paperStart.toLowerCase() === swatch.start.toLowerCase() &&
                      paperEnd.toLowerCase() === swatch.end.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          handlePaperGradientPresetSelect(swatch);
                        }}
                        className={cn(
                          "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                          isSelected ? "scale-105" : ""
                        )}
                        style={{ 
                          background: swatch.dir,
                          boxShadow: isSelected 
                            ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch.start}` 
                            : `0 0 0 2px var(--background), 0 0 0 4px var(--foreground)`
                        }}
                        title={swatch.name}
                      >
                        {isSelected && (
                          <Check
                            size={11}
                            className={cn(
                              "font-bold drop-shadow-sm z-10",
                              swatch.start === '#ffffff'
                                ? "text-slate-800 dark:text-slate-200"
                                : "text-white"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}

                  {/* Rainbow arrow circle inline picker toggle for gradient */}
                  <button
                    onClick={() => setShowPaperGradientPickerInline(!showPaperGradientPickerInline)}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                      showPaperGradientPickerInline ? "scale-105" : ""
                    )}
                    style={{
                      boxShadow: showPaperGradientPickerInline 
                        ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                        : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                    }}
                    title="Custom Paper Gradient"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                    <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
                  </button>
                </div>

                {/* Custom paper gradient picker inputs */}
                {showPaperGradientPickerInline && (
                  <div className="space-y-4 p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm font-mono text-[11px] transition-all">
                    {/* Start Color picker */}
                    <div className="space-y-2 pb-2.5 border-b border-black/10 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm-full bg-accent" />
                          Start Color
                        </span>
                        <span className="text-accent text-[10px] uppercase font-bold">{paperStart}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: paperStart }} />
                        <input
                          type="color"
                          value={paperStart}
                          onChange={(e) => handlePaperGradientCustomUpdate({ start: e.target.value })}
                          className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                        />
                      </div>
                    </div>

                    {/* End Color picker */}
                    <div className="space-y-2 pb-2.5 border-b border-black/10 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm-full bg-pink-400" />
                          End Color
                        </span>
                        <span className="text-pink-400 text-[10px] uppercase font-bold">{paperEnd}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: paperEnd }} />
                        <input
                          type="color"
                          value={paperEnd}
                          onChange={(e) => handlePaperGradientCustomUpdate({ end: e.target.value })}
                          className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                        />
                      </div>
                    </div>

                    {/* Direction picker */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">Direction</span>
                      <select
                        value={paperDir}
                        onChange={(e) => handlePaperGradientCustomUpdate({ dir: e.target.value })}
                        className="flex-1 max-w-[124px] bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-sm-sm text-foreground dark:text-white/95 px-2.5 py-1 text-[11px] outline-none hover:border-black/20 dark:hover:border-white/20 transition-all font-mono"
                      >
                        <option value="180deg">Top to Bottom</option>
                        <option value="90deg">Left to Right</option>
                        <option value="45deg">Diagonal Up</option>
                        <option value="135deg">Diagonal Down</option>
                        <option value="radial">Radial Circle</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Color presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">Text Color</span>
            <div className="flex flex-wrap gap-3.5">
              {textPresets.map((swatch, idx) => {
                const isSelected = document.textColor === swatch.value;
                return (
                  <button
                    key={idx}
                    onClick={() => updateDocument(document.id, { textColor: swatch.value })}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5 cursor-pointer shadow-sm-sm border-black/80 dark:border-black/80",
                      isSelected ? "scale-105" : ""
                    )}
                    style={{
                      backgroundColor: swatch.value || undefined,
                      boxShadow: isSelected 
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch.value || '#94a3b8'}` 
                        : `0 0 0 2px var(--background), 0 0 0 4px var(--foreground)`
                    }}
                    title={swatch.name}
                  >
                    {!swatch.value && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[20px] h-[1px] bg-red-500 rotate-45 transform origin-center" />
                      </div>
                    )}
                    {isSelected && (
                      <Check
                        size={11}
                        className={cn(
                          "font-bold drop-shadow-sm z-10",
                          !swatch.value || swatch.value === '#ffffff'
                            ? "text-slate-800 dark:text-slate-200"
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

      <div className="p-3 bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/5 rounded-sm-sm">
        <p className="text-[10px] text-muted-foreground leading-relaxed font-mono">
          <strong>Tip:</strong> Create sophisticated document styles. Combine gradients for backdrops and documents to achieve stunning custom visual templates.
        </p>
      </div>
    </div>
  );
};

const InfoTab = () => {
  const { panes, activePaneId } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
    }))
  );
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
    return getRelativeTimeString(dateString);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex bg-white/5 border border-white/10 p-1 rounded-sm-sm gap-1">
        {['Page Info', 'Actions'].map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all font-mono",
              subTab === tab
                ? "bg-muted/40 text-white shadow-sm-sm border border-white/5"
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

            <div className="space-y-3 bg-white/[0.02] border border-white/5 p-3 rounded-sm-sm">
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
              className="w-full py-2 hover:bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white flex items-center justify-center gap-2 transition-all rounded-sm"
            >
              Export as HTML
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
