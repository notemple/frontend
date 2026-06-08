import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { getRelativeTimeString } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { formatInTimeZone } from 'date-fns-tz';
import {
	ArrowCounterClockwise,
	Calendar,
	CaretDown,
	Check,
	Clock,
	PaintBrush,
	TextT,
	User,
	X
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCallback,useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const RightSidebar = () => {
  const { isRightSidebarOpen, toggleRightSidebar } = useUiStore(
    useShallow((state) => ({
      isRightSidebarOpen: state.isRightSidebarOpen,
      toggleRightSidebar: state.toggleRightSidebar,
    }))
  );
  const [activeTab, setActiveTab] = useState('Formatting');

  const tabs = ['Formatting', 'Style', 'Info'];

  return (
    <motion.div
      className="templnote-sidebar-right h-full border-l border-border bg-background absolute right-0 top-0 bottom-0 flex flex-col overflow-hidden z-30 shadow-md"
      animate={{
        width: isRightSidebarOpen ? 320 : 0,
        opacity: isRightSidebarOpen ? 1 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        mass: 0.8
      }}
      style={{
        pointerEvents: isRightSidebarOpen ? "auto" : "none"
      }}
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
            {activeTab === 'Formatting' && <FormattingTab />}
            {activeTab === 'Style' && <StyleTab />}
            {activeTab === 'Info' && <InfoTab />}
          </div>
    </motion.div>
  );
};

const StyleTab = () => {
  const { panes, activePaneId, selectedDailyNoteDate } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      selectedDailyNoteDate: state.selectedDailyNoteDate,
    }))
  );
  const timezone = useSettingsStore(state => state.timezone);
  const updateDocument = useDocumentStore(state => state.updateDocument);

  // Custom picker expand collapse to prevent glitches and keep selection stable
  const [showColorPickerInline, setShowColorPickerInline] = useState(false);
  const [showPaperColorPickerInline, setShowPaperColorPickerInline] = useState(false);
  const [showPaperGradientPickerInline, setShowPaperGradientPickerInline] = useState(false);
  const [showTopSectionColorPickerInline, setShowTopSectionColorPickerInline] = useState(false);
  const [showTopSectionGradientPickerInline, setShowTopSectionGradientPickerInline] = useState(false);
  const [showTopSectionTextColorPickerInline, setShowTopSectionTextColorPickerInline] = useState(false);

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeDocId = activePane?.activeTabId;

  // Retrieve ONLY the active document using a targeted selector to prevent re-renders when other documents are edited
  const documentSelector = useCallback(
    state => {
      if (!activeDocId || activeDocId === 'new-note') return null;
      if (activeDocId.startsWith('section-')) {
        if (activeDocId === 'section-daily-notes') {
          const dailyNoteDocId = `daily-note-${formatInTimeZone(selectedDailyNoteDate, timezone, "yyyy-MM-dd")}`;
          return state.documents[dailyNoteDocId] || null;
        }
        return null;
      }
      return state.documents[activeDocId] || null;
    },
    [activeDocId, selectedDailyNoteDate, timezone]
  );
  const document = useDocumentStore(useShallow(documentSelector));
  const topSectionPresets = [
    { name: 'None (Transparent)', value: undefined },
    { name: 'Ember Rose', value: '#f8eae6' },
    { name: 'Dusty Sage', value: '#e4ede4' },
    { name: 'Plum Velvet', value: '#150e1c' },
    { name: 'Deep Forest', value: '#071713' },
  ];
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
    '#faf6f0', // Warm Alabaster (Light complementary 1)
    '#edf2ed', // Sage Mist (Light complementary 2)
    '#150e1c', // Plum Velvet (Dark complementary 1)
    '#071713', // Deep Forest (Dark complementary 2)
  ];

  const gradientPresets = [
    { start: '#faf6f0', end: '#f3e8d9', dir: 'linear-gradient(135deg, #faf6f0, #f3e8d9)', name: 'Alabaster Glow' },
    { start: '#edf2ed', end: '#d4e1d4', dir: 'linear-gradient(135deg, #edf2ed, #d4e1d4)', name: 'Sage Meadow' },
    { start: '#150e1c', end: '#09050d', dir: 'linear-gradient(135deg, #150e1c, #09050d)', name: 'Velvet Night' },
    { start: '#071713', end: '#020a08', dir: 'linear-gradient(135deg, #071713, #020a08)', name: 'Forest Shadow' },
  ];

  const paperPresets = [
    { name: 'Float (None)', value: undefined },
    { name: 'Warm Cream', value: '#faf7f2' },
    { name: 'Rose Quartz', value: '#faf2f0' },
    { name: 'Obsidian Black', value: '#121214' },
    { name: 'Slate Shadow', value: '#1e293b' },
  ];

  const paperGradientPresets = [
    { start: '#faf7f2', end: '#f3ede1', dir: 'linear-gradient(135deg, #faf7f2, #f3ede1)', name: 'Warm Silk' },
    { start: '#faf2f0', end: '#f2e1dd', dir: 'linear-gradient(135deg, #faf2f0, #f2e1dd)', name: 'Rose Clay' },
    { start: '#18181b', end: '#09090b', dir: 'linear-gradient(135deg, #18181b, #09090b)', name: 'Obsidian Silk' },
    { start: '#1e293b', end: '#0f172a', dir: 'linear-gradient(135deg, #1e293b, #0f172a)', name: 'Deep Slate Silk' },
  ];

  const textPresets = [
    { name: 'Auto', value: undefined },
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Charcoal Black', value: '#000000' },
  ];

  const topSectionGradientPresets = [
    { start: '#f8eae6', end: '#eddcd7', dir: 'linear-gradient(135deg, #f8eae6, #eddcd7)', name: 'Ember Rose Silk' },
    { start: '#e4ede4', end: '#cadbc9', dir: 'linear-gradient(135deg, #e4ede4, #cadbc9)', name: 'Sage Garden Silk' },
    { start: '#150e1c', end: '#09050d', dir: 'linear-gradient(135deg, #150e1c, #09050d)', name: 'Velvet Night' },
    { start: '#071713', end: '#020a08', dir: 'linear-gradient(135deg, #071713, #020a08)', name: 'Forest Shadow' },
  ];

  const topSectionTextPresets = [
    { name: 'Auto', value: undefined },
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
  ];

  const currentType = document.backdropType || 'none';
  const currentStart = document.backdropGradientStart || '#a3f4c5';
  const currentEnd = document.backdropGradientEnd || '#ffbbbb';
  const currentDir = document.backdropGradientDirection || '180deg';

  const paperType = document.documentColorType || 'solid';
  const paperStart = document.documentGradientStart || '#ffffff';
  const paperEnd = document.documentGradientEnd || '#f1f5f9';
  const paperDir = document.documentGradientDirection || '135deg';

  const topSectionType = document.topSectionColorType || 'solid';
  const topSectionStart = document.topSectionGradientStart || '#ffffff';
  const topSectionEnd = document.topSectionGradientEnd || '#f1f5f9';
  const topSectionDir = document.topSectionGradientDirection || '135deg';

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

  const handleTopSectionGradientPresetSelect = (preset: typeof topSectionGradientPresets[0]) => {
    updateDocument(document.id, {
      topSectionColorType: 'gradient',
      topSectionGradientStart: preset.start,
      topSectionGradientEnd: preset.end,
      topSectionGradientDirection: '135deg',
      topSectionColor: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
    });
  };

  const handleTopSectionGradientCustomUpdate = (updates: { start?: string; end?: string; dir?: string }) => {
    const nextStart = updates.start !== undefined ? updates.start : topSectionStart;
    const nextEnd = updates.end !== undefined ? updates.end : topSectionEnd;
    const nextDir = updates.dir !== undefined ? updates.dir : topSectionDir;

    const cssSpec = nextDir === 'radial'
      ? `radial-gradient(circle, ${nextStart}, ${nextEnd})`
      : `linear-gradient(${nextDir}, ${nextStart}, ${nextEnd})`;

    updateDocument(document.id, {
      topSectionGradientStart: nextStart,
      topSectionGradientEnd: nextEnd,
      topSectionGradientDirection: nextDir,
      topSectionColor: cssSpec,
      topSectionColorType: 'gradient'
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
      textColor: undefined,
      topSectionColor: undefined,
      topSectionColorType: 'solid',
      topSectionGradientStart: undefined,
      topSectionGradientEnd: undefined,
      topSectionGradientDirection: undefined,
      topSectionTextColor: undefined,
      fontFamily: undefined
    });
    setShowColorPickerInline(false);
    setShowPaperColorPickerInline(false);
    setShowPaperGradientPickerInline(false);
    setShowTopSectionColorPickerInline(false);
    setShowTopSectionGradientPickerInline(false);
    setShowTopSectionTextColorPickerInline(false);
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
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Backdrop</span>
          {/* Link with Editor Cover Checkbox/Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer group select-none">
            <div className="relative w-3.5 h-3.5 rounded-sm border border-black/30 dark:border-white/20 bg-black/5 dark:bg-white/5 transition-all flex items-center justify-center shadow-sm-sm group-hover:border-sky-500/50">
              <input
                type="checkbox"
                checked={!!document.linkBackdropToCover}
                onChange={(e) => updateDocument(document.id, { linkBackdropToCover: e.target.checked })}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "absolute inset-0 rounded-sm bg-sky-500 border border-sky-500 transition-opacity flex items-center justify-center",
                document.linkBackdropToCover ? "opacity-100" : "opacity-0"
              )}>
                <Check
                  size={9}
                  weight="bold"
                  className="text-white"
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              Link to Cover
            </span>
          </label>
        </div>

        {document.linkBackdropToCover && (
          <div className="text-[10px] text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/5 border border-sky-500/20 p-2.5 rounded-sm-sm font-mono flex flex-col gap-0.5">
            <span className="font-semibold">Linked to Editor Cover Color</span>
            <span className="text-muted-foreground text-[9px] leading-tight">Theme changes to the banner/cover above will sync here automatically.</span>
          </div>
        )}

        <div className={cn("space-y-4", document.linkBackdropToCover && "opacity-40 pointer-events-none")}>
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
                        "w-8 h-8 rounded-sm-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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
                    "w-8 h-8 rounded-sm-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group justify-self-center cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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
                        "w-8 h-8 rounded-sm-full border transition-all duration-200 hover:scale-105 shrink-0 flex items-center justify-center cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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
                    "w-8 h-8 rounded-sm-full border transition-all duration-200 shrink-0 flex items-center justify-center relative overflow-hidden group justify-self-center cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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

          {/* Text Color presets - Moved here from Paper & Text */}
          <div className="space-y-1.5 pt-2.5 border-t border-black/10 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground font-mono">Text Color</span>
            <div className="flex flex-wrap gap-3.5">
              {textPresets.map((swatch, idx) => {
                const isSelected = document.textColor === swatch.value;
                return (
                  <button
                    key={idx}
                    onClick={() => updateDocument(document.id, { textColor: swatch.value })}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5 cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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

      {/* Header Banner Color Module */}
      <div className="space-y-4 pt-1 border-t border-black/10 dark:border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Header Banner</span>
        
        {/* Segmented Control Selector for Banner Color Type */}
        <div className="grid grid-cols-2 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          {/* Solid */}
          <button
            onClick={() => updateDocument(document.id, { topSectionColorType: 'solid', topSectionColor: document.topSectionGradientStart || '#ffffff' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer font-mono",
              topSectionType === 'solid'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Solid
          </button>

          {/* Gradient */}
          <button
            onClick={() => updateDocument(document.id, { topSectionColorType: 'gradient', topSectionColor: `linear-gradient(135deg, ${topSectionStart}, ${topSectionEnd})` })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm-sm transition-all text-xs cursor-pointer font-mono",
              topSectionType === 'gradient'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Gradient
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">Banner Background Color</span>
            
            {topSectionType === 'solid' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3.5 items-center pt-1">
                  {topSectionPresets.map((swatch, idx) => {
                    const isSelected = document.topSectionColor === swatch.value;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          updateDocument(document.id, { topSectionColor: swatch.value, topSectionColorType: 'solid' });
                          if (swatch.value === undefined) {
                            setShowTopSectionColorPickerInline(false);
                          }
                        }}
                        className={cn(
                          "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5 cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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

                  {/* Rainbow selector for custom top section solid color */}
                  <button
                    onClick={() => setShowTopSectionColorPickerInline(!showTopSectionColorPickerInline)}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
                      showTopSectionColorPickerInline ? "scale-105" : ""
                    )}
                    style={{
                      boxShadow: showTopSectionColorPickerInline 
                        ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                        : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                    }}
                    title="Custom Header Color"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                    <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
                  </button>
                </div>

                {/* Custom inline top section color picker panel */}
                {showTopSectionColorPickerInline && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm space-y-2.5 overflow-hidden font-mono text-[11px] mt-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Custom Header Color:</span>
                      <span className="text-accent text-[10px] uppercase font-bold">{document.topSectionColor || 'Default'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ background: document.topSectionColor || 'var(--background)' }} />
                      <input
                        type="color"
                        value={document.topSectionColor || '#050505'}
                        onChange={(e) => updateDocument(document.id, { topSectionColor: e.target.value, topSectionColorType: 'solid' })}
                        className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {topSectionType === 'gradient' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3.5 items-center pt-1">
                  {topSectionGradientPresets.map((swatch, idx) => {
                    const isSelected = topSectionStart.toLowerCase() === swatch.start.toLowerCase() &&
                      topSectionEnd.toLowerCase() === swatch.end.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          handleTopSectionGradientPresetSelect(swatch);
                        }}
                        className={cn(
                          "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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
                    onClick={() => setShowTopSectionGradientPickerInline(!showTopSectionGradientPickerInline)}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
                      showTopSectionGradientPickerInline ? "scale-105" : ""
                    )}
                    style={{
                      boxShadow: showTopSectionGradientPickerInline 
                        ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                        : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                    }}
                    title="Custom Banner Gradient"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                    <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
                  </button>
                </div>

                {/* Custom top section gradient picker inputs */}
                {showTopSectionGradientPickerInline && (
                  <div className="space-y-4 p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm font-mono text-[11px] transition-all">
                    {/* Start Color picker */}
                    <div className="space-y-2 pb-2.5 border-b border-black/10 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-sm-full bg-accent" />
                          Start Color
                        </span>
                        <span className="text-accent text-[10px] uppercase font-bold">{topSectionStart}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: topSectionStart }} />
                        <input
                          type="color"
                          value={topSectionStart}
                          onChange={(e) => handleTopSectionGradientCustomUpdate({ start: e.target.value })}
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
                        <span className="text-pink-400 text-[10px] uppercase font-bold">{topSectionEnd}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ backgroundColor: topSectionEnd }} />
                        <input
                          type="color"
                          value={topSectionEnd}
                          onChange={(e) => handleTopSectionGradientCustomUpdate({ end: e.target.value })}
                          className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                        />
                      </div>
                    </div>

                    {/* Direction picker */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">Direction</span>
                      <select
                        value={topSectionDir}
                        onChange={(e) => handleTopSectionGradientCustomUpdate({ dir: e.target.value })}
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

          {/* Banner Text Color presets */}
          <div className="space-y-1.5 pt-2 border-t border-black/10 dark:border-white/5">
            <span className="text-[10px] text-muted-foreground font-mono">Banner Text Color</span>
            <div className="flex flex-wrap gap-3.5 font-sans">
              {topSectionTextPresets.map((swatch, idx) => {
                const isSelected = document.topSectionTextColor === swatch.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      updateDocument(document.id, { topSectionTextColor: swatch.value });
                      if (swatch.value === undefined) {
                        setShowTopSectionTextColorPickerInline(false);
                      }
                    }}
                    className={cn(
                      "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden bg-white/5 cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
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

              {/* Rainbow selector for custom top section text color */}
              <button
                onClick={() => setShowTopSectionTextColorPickerInline(!showTopSectionTextColorPickerInline)}
                className={cn(
                  "w-7 h-7 rounded-sm-full border transition-all shrink-0 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm-sm border-black/80 dark:border-white/50",
                  showTopSectionTextColorPickerInline ? "scale-105" : ""
                )}
                style={{
                  boxShadow: showTopSectionTextColorPickerInline 
                    ? '0 0 0 2px var(--background), 0 0 0 4px #3b82f6' 
                    : '0 0 0 2px var(--background), 0 0 0 4px var(--foreground)'
                }}
                title="Custom Banner Text Color"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-yellow-400 to-indigo-500 opacity-90 group-hover:opacity-100" />
                <CaretDown size={11} className="text-white relative z-10 font-bold drop-shadow-sm" />
              </button>
            </div>

            {/* Custom inline top section text color picker panel */}
            {showTopSectionTextColorPickerInline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-sm-sm space-y-2.5 overflow-hidden font-mono text-[11px] mt-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Custom Banner Text Color:</span>
                  <span className="text-accent text-[10px] uppercase font-bold">{document.topSectionTextColor || '#ffffff'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm-sm border border-black dark:border-white relative overflow-hidden shrink-0" style={{ background: document.topSectionTextColor || '#ffffff' }} />
                  <input
                    type="color"
                    value={document.topSectionTextColor || '#ffffff'}
                    onChange={(e) => updateDocument(document.id, { topSectionTextColor: e.target.value })}
                    className="flex-1 h-9 bg-transparent border-none outline-none cursor-pointer rounded-sm overflow-hidden"
                  />
                </div>
              </motion.div>
            )}
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

const FormattingTab = () => {
  const { panes, activePaneId, selectedDailyNoteDate } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      selectedDailyNoteDate: state.selectedDailyNoteDate,
    }))
  );
  const timezone = useSettingsStore(state => state.timezone);
  const updateDocument = useDocumentStore(state => state.updateDocument);

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeDocId = activePane?.activeTabId;

  const documentSelector = useCallback(
    state => {
      if (!activeDocId || activeDocId === 'new-note') return null;
      if (activeDocId.startsWith('section-')) {
        if (activeDocId === 'section-daily-notes') {
          const dailyNoteDocId = `daily-note-${formatInTimeZone(selectedDailyNoteDate, timezone, "yyyy-MM-dd")}`;
          return state.documents[dailyNoteDocId] || null;
        }
        return null;
      }
      return state.documents[activeDocId] || null;
    },
    [activeDocId, selectedDailyNoteDate, timezone]
  );
  const document = useDocumentStore(useShallow(documentSelector));

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <TextT size={32} className="text-muted-foreground mb-3 opacity-30" />
        <p className="text-xs text-muted-foreground font-mono">No active document selected.</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">Open a document from the sidebar to customize its formatting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Font Family Selection */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Font Family</span>
        <div className="grid grid-cols-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          <button
            onClick={() => updateDocument(document.id, { fontFamily: 'sans' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              (!document.fontFamily || document.fontFamily === 'sans')
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Sans
          </button>
          <button
            onClick={() => updateDocument(document.id, { fontFamily: 'sans-serif' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.fontFamily === 'sans-serif'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            style={{ fontFamily: '"Geist", sans-serif' }}
          >
            Sans-Serif
          </button>
          <button
            onClick={() => updateDocument(document.id, { fontFamily: 'monospace' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.fontFamily === 'monospace'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Mono
          </button>
        </div>
      </div>

      {/* Font Size Selection */}
      <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Font Size</span>
        <div className="grid grid-cols-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          <button
            onClick={() => updateDocument(document.id, { fontSize: 'small' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.fontSize === 'small'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Small
          </button>
          <button
            onClick={() => updateDocument(document.id, { fontSize: 'normal' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              (!document.fontSize || document.fontSize === 'normal')
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Normal
          </button>
          <button
            onClick={() => updateDocument(document.id, { fontSize: 'large' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.fontSize === 'large'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Large
          </button>
        </div>
      </div>

      {/* Line Height Selection */}
      <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Line Spacing</span>
        <div className="grid grid-cols-3 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          <button
            onClick={() => updateDocument(document.id, { lineHeight: 'compact' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.lineHeight === 'compact'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Compact
          </button>
          <button
            onClick={() => updateDocument(document.id, { lineHeight: 'normal' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              (!document.lineHeight || document.lineHeight === 'normal')
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Normal
          </button>
          <button
            onClick={() => updateDocument(document.id, { lineHeight: 'loose' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.lineHeight === 'loose'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Loose
          </button>
        </div>
      </div>

      {/* Page Width Selection */}
      <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">Page Width</span>
        <div className="grid grid-cols-2 bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 p-1 rounded-sm-sm">
          <button
            onClick={() => updateDocument(document.id, { pageWidth: 'narrow' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              (!document.pageWidth || document.pageWidth === 'narrow')
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Readable (Narrow)
          </button>
          <button
            onClick={() => updateDocument(document.id, { pageWidth: 'wide' })}
            className={cn(
              "py-1.5 flex items-center justify-center rounded-sm transition-all text-xs cursor-pointer",
              document.pageWidth === 'wide'
                ? "bg-white dark:bg-muted/40 text-foreground dark:text-white shadow-sm-sm border border-black/10 dark:border-white/5 font-semibold"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
            )}
          >
            Full Width (Wide)
          </button>
        </div>
      </div>

      <div className="p-3 bg-black/5 dark:bg-white/[0.02] border border-black/10 dark:border-white/5 rounded-sm-sm">
        <p className="text-[10px] text-muted-foreground leading-relaxed font-mono">
          <strong>Tip:</strong> Formatting preferences apply per document. Toggle full width for tables or code blocks, and customize font sizing/spacing to fit your reading preferences.
        </p>
      </div>
    </div>
  );
};

const InfoTab = () => {
  const userName = useSettingsStore(state => state.userName);
  const { panes, activePaneId, selectedDailyNoteDate } = useUiStore(
    useShallow((state) => ({
      panes: state.panes,
      activePaneId: state.activePaneId,
      selectedDailyNoteDate: state.selectedDailyNoteDate,
    }))
  );
  const timezone = useSettingsStore(state => state.timezone);
  const [subTab, setSubTab] = useState('Page Info');

  const activePane = panes.find(p => p?.id === activePaneId) || panes[0];
  const activeDocId = activePane?.activeTabId;

  // Retrieve ONLY the active document using a targeted selector to prevent re-renders when other documents are edited
  const documentSelector = useCallback(
    state => {
      if (!activeDocId || activeDocId === 'new-note') return null;
      if (activeDocId.startsWith('section-')) {
        if (activeDocId === 'section-daily-notes') {
          const dailyNoteDocId = `daily-note-${formatInTimeZone(selectedDailyNoteDate, timezone, "yyyy-MM-dd")}`;
          return state.documents[dailyNoteDocId] || null;
        }
        return null;
      }
      return state.documents[activeDocId] || null;
    },
    [activeDocId, selectedDailyNoteDate, timezone]
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
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">Author:</span>
                  <span className="text-foreground/90 font-medium font-sans">
                    {userName}
                  </span>
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
