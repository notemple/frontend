import React from 'react';
import { Gear } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/features/settings/store';
import { formatDisplayDateTime, useIsMounted } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';

function parseGradient(gradientStr: string) {
  if (!gradientStr || gradientStr === 'none' || gradientStr === 'transparent') {
    return { start: '#3b82f6', end: '#8b5cf6' };
  }
  const hexRegex = /#[0-9a-fA-F]{6}/g;
  const matches = gradientStr.match(hexRegex);
  if (matches && matches.length >= 2) {
    return { start: matches[0], end: matches[1] };
  }
  const anyColorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)/g;
  const anyMatches = gradientStr.match(anyColorRegex);
  if (anyMatches) {
    const cleanMatches = anyMatches.filter(m => !['linear-gradient', 'linear', 'to', 'right', 'left', 'bottom', 'top', 'deg'].includes(m.toLowerCase()));
    if (cleanMatches.length >= 2) {
      return { start: cleanMatches[0], end: cleanMatches[1] };
    } else if (cleanMatches.length === 1) {
      return { start: cleanMatches[0], end: cleanMatches[0] };
    }
  }
  return { start: '#3b82f6', end: '#8b5cf6' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SettingsPage = ({ paneId }: { paneId: string }) => {
  const { 
    timezone, 
    timeFormat, 
    weekStartDay, 
    roundness,
    spaceName,
    spaceIcon,
    userName,
    userEmail,
    autoHideNavbar,
    autoHideSidebars,
    grayscaleInactiveTabs,
    
    // Highlight options
    activeHighlightType,
    activeHighlightColor,
    activeHighlightGradient,
    inactiveHighlightType,
    inactiveHighlightColor,
    inactiveHighlightGradient,

    setTimezone, 
    setTimeFormat, 
    setWeekStartDay,
    setRoundness,
    setSpaceName,
    setSpaceIcon,
    setUserName,
    setUserEmail,
    setAutoHideNavbar,
    setAutoHideSidebars,
    setGrayscaleInactiveTabs,

    setActiveHighlightType,
    setActiveHighlightColor,
    setActiveHighlightGradient,
    setInactiveHighlightType,
    setInactiveHighlightColor,
    setInactiveHighlightGradient
  } = useSettingsStore();
  
  const mounted = useIsMounted();

  // Simple list of timezones
  const timezonesPreset = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Tokyo',
    'Asia/Kolkata',
    'Asia/Singapore',
  ];

  const solidPresets = [
    { name: 'Sky Blue', value: '#A2D2FF' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Slate', value: '#64748b' },
  ];

  const gradientPresets = [
    { name: 'Ocean', value: 'linear-gradient(to right, #3b82f6, #0ea5e9)' },
    { name: 'Sunset', value: 'linear-gradient(to right, #f43f5e, #f59e0b)' },
    { name: 'Lavender', value: 'linear-gradient(to right, #8b5cf6, #ec4899)' },
    { name: 'Cyber', value: 'linear-gradient(to right, #06b6d4, #10b981)' },
    { name: 'Gold', value: 'linear-gradient(to right, #f59e0b, #eab308)' },
  ];

  const activeCustomColors = React.useMemo(() => parseGradient(activeHighlightGradient), [activeHighlightGradient]);
  const isActivePreset = gradientPresets.some(g => g.value === activeHighlightGradient);

  const inactiveCustomColors = React.useMemo(() => parseGradient(inactiveHighlightGradient), [inactiveHighlightGradient]);
  const isInactivePreset = gradientPresets.some(g => g.value === inactiveHighlightGradient) || inactiveHighlightGradient === 'none';

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-10 font-sans flex flex-col bg-transparent no-scrollbar select-none relative z-0">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        
        {/* Sleek Page Header */}
        <div className="flex items-center gap-4 border-b border-border/80 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 dark:bg-zinc-400/5 border border-border flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-sm-sm shrink-0">
            <Gear size={24} weight="fill" className="animate-spin-slow" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground text-xs font-medium">Configure preferences and space details for this workspace pane</p>
          </div>
        </div>

        {/* Settings Form Grid */}
        <div className="flex flex-col gap-6">
          
          {/* Card: Space details */}
          <div className="p-5 border border-border/80 bg-card/30 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60 font-mono">Space Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Space Name</label>
                <input 
                  type="text" 
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="w-full bg-muted/40 border border-border text-foreground px-3 py-1.5 text-sm outline-none transition-all focus:border-accent hover:border-border/80 focus:bg-muted/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Space Icon</label>
                <input 
                  type="text" 
                  maxLength={2}
                  value={spaceIcon}
                  onChange={(e) => setSpaceIcon(e.target.value)}
                  className="w-16 bg-muted/40 border border-border text-foreground px-3 py-1.5 text-sm text-center outline-none transition-all focus:border-accent hover:border-border/80 focus:bg-muted/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/25 pt-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">User Name</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-muted/40 border border-border text-foreground px-3 py-1.5 text-sm outline-none transition-all focus:border-accent hover:border-border/80 focus:bg-muted/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <input 
                  type="email" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-muted/40 border border-border text-foreground px-3 py-1.5 text-sm outline-none transition-all focus:border-accent hover:border-border/80 focus:bg-muted/20"
                />
              </div>
            </div>
          </div>

          {/* Card: Pane Highlight Customization */}
          <div id="onboarding-color-presets" className="p-5 border border-border/80 bg-card/30 rounded-xl flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60 font-mono">Pane Highlight Style</h3>
            
            {/* Active Pane Control */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-bold text-foreground">Active Pane Highlight</label>
                  <span className="text-[10px] text-muted-foreground">Appears below the tab bar in the selected pane</span>
                </div>
                <div className="flex bg-muted/40 p-0.5 rounded border border-border/60 shrink-0">
                  <button
                    onClick={() => setActiveHighlightType('solid')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      activeHighlightType === 'solid'
                        ? 'bg-card text-foreground border-border/80 shadow-sm-sm font-semibold'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => setActiveHighlightType('gradient')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      activeHighlightType === 'gradient'
                        ? 'bg-card text-foreground border-border/80 shadow-sm-sm font-semibold'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {activeHighlightType === 'solid' ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {solidPresets.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setActiveHighlightColor(color.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer relative",
                        activeHighlightColor === color.value ? "border-foreground ring-2 ring-accent/30 scale-105" : "border-border"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  {/* Custom Color Input with Picker */}
                  <div className="flex items-center gap-2 ml-2 border-l border-border/60 pl-3">
                    <span className="text-[10px] text-muted-foreground font-mono">Custom</span>
                    <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                      <input
                        type="color"
                        value={activeHighlightColor.startsWith('#') && activeHighlightColor.length === 7 ? activeHighlightColor : '#A2D2FF'}
                        onChange={(e) => setActiveHighlightColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: activeHighlightColor }} />
                    </div>
                    <input
                      type="text"
                      value={activeHighlightColor}
                      onChange={(e) => setActiveHighlightColor(e.target.value)}
                      className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                      placeholder="#A2D2FF"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {gradientPresets.map(grad => (
                      <button
                        key={grad.value}
                        onClick={() => setActiveHighlightGradient(grad.value)}
                        className={cn(
                          "h-8 rounded-sm-md border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center relative px-2.5",
                          activeHighlightGradient === grad.value ? "border-foreground shadow-sm-sm scale-102" : "border-border"
                        )}
                        style={{ background: grad.value }}
                        title={grad.name}
                      >
                        <span className="text-[9px] font-bold text-white tracking-wide mix-blend-difference uppercase font-mono">{grad.name}</span>
                      </button>
                    ))}

                    {/* Custom Gradient Option Button */}
                    <button
                      onClick={() => {
                        if (isActivePreset) {
                          setActiveHighlightGradient(`linear-gradient(to right, ${activeCustomColors.start}, ${activeCustomColors.end})`);
                        }
                      }}
                      className={cn(
                        "h-8 rounded-sm-md border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center relative px-2.5",
                        !isActivePreset ? "border-foreground shadow-sm-sm scale-102" : "border-border"
                      )}
                      style={{ background: `linear-gradient(to right, ${activeCustomColors.start}, ${activeCustomColors.end})` }}
                      title="Custom Gradient"
                    >
                      <span className="text-[9px] font-bold text-white tracking-wide mix-blend-difference uppercase font-mono">Custom</span>
                    </button>
                  </div>

                  {/* Custom Gradient Builder Interface */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/60">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Gradient Preview</span>
                      <div 
                        className="w-24 h-6 rounded border border-border" 
                        style={{ background: `linear-gradient(to right, ${activeCustomColors.start}, ${activeCustomColors.end})` }}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      {/* Start Color */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">Start</span>
                        <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                          <input
                            type="color"
                            value={activeCustomColors.start.startsWith('#') && activeCustomColors.start.length === 7 ? activeCustomColors.start : '#3b82f6'}
                            onChange={(e) => {
                              setActiveHighlightGradient(`linear-gradient(to right, ${e.target.value}, ${activeCustomColors.end})`);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: activeCustomColors.start }} />
                        </div>
                        <input
                          type="text"
                          value={activeCustomColors.start}
                          onChange={(e) => {
                            setActiveHighlightGradient(`linear-gradient(to right, ${e.target.value}, ${activeCustomColors.end})`);
                          }}
                          className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                          placeholder="#3b82f6"
                        />
                      </div>

                      {/* End Color */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">End</span>
                        <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                          <input
                            type="color"
                            value={activeCustomColors.end.startsWith('#') && activeCustomColors.end.length === 7 ? activeCustomColors.end : '#8b5cf6'}
                            onChange={(e) => {
                              setActiveHighlightGradient(`linear-gradient(to right, ${activeCustomColors.start}, ${e.target.value})`);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: activeCustomColors.end }} />
                        </div>
                        <input
                          type="text"
                          value={activeCustomColors.end}
                          onChange={(e) => {
                            setActiveHighlightGradient(`linear-gradient(to right, ${activeCustomColors.start}, ${e.target.value})`);
                          }}
                          className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                          placeholder="#8b5cf6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inactive Pane Control */}
            <div className="flex flex-col gap-3 border-t border-border/25 pt-4 mt-1">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-bold text-foreground">Inactive Pane Highlight</label>
                  <span className="text-[10px] text-muted-foreground">Appears below the tab bar in non-focused panes</span>
                </div>
                <div className="flex bg-muted/40 p-0.5 rounded border border-border/60 shrink-0">
                  <button
                    onClick={() => setInactiveHighlightType('solid')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      inactiveHighlightType === 'solid'
                        ? 'bg-card text-foreground border-border/80 shadow-sm-sm font-semibold'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => setInactiveHighlightType('gradient')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      inactiveHighlightType === 'gradient'
                        ? 'bg-card text-foreground border-border/80 shadow-sm-sm font-semibold'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {inactiveHighlightType === 'solid' ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {/* None/Transparent option */}
                  <button
                    onClick={() => setInactiveHighlightColor('transparent')}
                    className={cn(
                      "h-6 px-2.5 rounded border text-[10px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center border-dashed border-border text-muted-foreground hover:text-foreground",
                      inactiveHighlightColor === 'transparent' ? "border-foreground bg-muted/30 shadow-inner text-foreground" : ""
                    )}
                  >
                    None
                  </button>
                  {solidPresets.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setInactiveHighlightColor(color.value)}
                      className={cn(
                        "w-6 h-6 rounded-full border transition-all hover:scale-110 active:scale-95 cursor-pointer relative",
                        inactiveHighlightColor === color.value ? "border-foreground ring-2 ring-accent/30 scale-105" : "border-border"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  {/* Custom Color Input with Picker */}
                  <div className="flex items-center gap-2 ml-2 border-l border-border/60 pl-3">
                    <span className="text-[10px] text-muted-foreground font-mono">Custom</span>
                    <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                      <input
                        type="color"
                        value={inactiveHighlightColor.startsWith('#') && inactiveHighlightColor.length === 7 ? inactiveHighlightColor : '#64748b'}
                        onChange={(e) => setInactiveHighlightColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: inactiveHighlightColor === 'transparent' ? '#00000000' : inactiveHighlightColor }} />
                    </div>
                    <input
                      type="text"
                      value={inactiveHighlightColor}
                      onChange={(e) => setInactiveHighlightColor(e.target.value)}
                      className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                      placeholder="#64748b"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {/* None/Transparent option */}
                    <button
                      onClick={() => setInactiveHighlightGradient('none')}
                      className={cn(
                        "h-8 rounded-sm-md border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center relative px-2.5 border-dashed border-border text-muted-foreground hover:text-foreground text-[10px] font-bold bg-muted/10",
                        inactiveHighlightGradient === 'none' ? "border-foreground bg-muted/30 shadow-inner text-foreground" : ""
                      )}
                    >
                      NONE
                    </button>
                    {gradientPresets.map(grad => (
                      <button
                        key={grad.value}
                        onClick={() => setInactiveHighlightGradient(grad.value)}
                        className={cn(
                          "h-8 rounded-sm-md border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center relative px-2.5",
                          inactiveHighlightGradient === grad.value ? "border-foreground shadow-sm-sm scale-102" : "border-border"
                        )}
                        style={{ background: grad.value }}
                        title={grad.name}
                      >
                        <span className="text-[9px] font-bold text-white tracking-wide mix-blend-difference uppercase font-mono">{grad.name}</span>
                      </button>
                    ))}

                    {/* Custom Gradient Option Button */}
                    <button
                      onClick={() => {
                        if (isInactivePreset) {
                          setInactiveHighlightGradient(`linear-gradient(to right, ${inactiveCustomColors.start}, ${inactiveCustomColors.end})`);
                        }
                      }}
                      className={cn(
                        "h-8 rounded-sm-md border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center relative px-2.5",
                        (!isInactivePreset && inactiveHighlightGradient !== 'none') ? "border-foreground shadow-sm-sm scale-102" : "border-border"
                      )}
                      style={{ background: `linear-gradient(to right, ${inactiveCustomColors.start}, ${inactiveCustomColors.end})` }}
                      title="Custom Gradient"
                    >
                      <span className="text-[9px] font-bold text-white tracking-wide mix-blend-difference uppercase font-mono">Custom</span>
                    </button>
                  </div>

                  {/* Custom Gradient Builder Interface */}
                  {inactiveHighlightGradient !== 'none' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/60">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Gradient Preview</span>
                        <div 
                          className="w-24 h-6 rounded border border-border" 
                          style={{ background: `linear-gradient(to right, ${inactiveCustomColors.start}, ${inactiveCustomColors.end})` }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-4 items-center">
                        {/* Start Color */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">Start</span>
                          <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                            <input
                              type="color"
                              value={inactiveCustomColors.start.startsWith('#') && inactiveCustomColors.start.length === 7 ? inactiveCustomColors.start : '#3b82f6'}
                              onChange={(e) => {
                                setInactiveHighlightGradient(`linear-gradient(to right, ${e.target.value}, ${inactiveCustomColors.end})`);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: inactiveCustomColors.start }} />
                          </div>
                          <input
                            type="text"
                            value={inactiveCustomColors.start}
                            onChange={(e) => {
                              setInactiveHighlightGradient(`linear-gradient(to right, ${e.target.value}, ${inactiveCustomColors.end})`);
                            }}
                            className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                            placeholder="#3b82f6"
                          />
                        </div>

                        {/* End Color */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">End</span>
                          <div className="relative w-6 h-6 rounded border border-border overflow-hidden cursor-pointer flex items-center justify-center bg-muted/40 hover:border-foreground transition-all">
                            <input
                              type="color"
                              value={inactiveCustomColors.end.startsWith('#') && inactiveCustomColors.end.length === 7 ? inactiveCustomColors.end : '#8b5cf6'}
                              onChange={(e) => {
                                setInactiveHighlightGradient(`linear-gradient(to right, ${inactiveCustomColors.start}, ${e.target.value})`);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: inactiveCustomColors.end }} />
                          </div>
                          <input
                            type="text"
                            value={inactiveCustomColors.end}
                            onChange={(e) => {
                              setInactiveHighlightGradient(`linear-gradient(to right, ${inactiveCustomColors.start}, ${e.target.value})`);
                            }}
                            className="w-20 bg-muted/40 border border-border text-foreground px-1.5 py-0.5 text-[11px] font-mono outline-none rounded"
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card: Time & Date Options */}
          <div className="p-5 border border-border/80 bg-card/30 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60 font-mono">Date & Time</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Timezone</label>
              <select 
                value={timezone} 
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full md:w-80 bg-muted/40 border border-border text-foreground px-3 py-1.5 text-sm outline-none transition-all focus:border-accent hover:border-border/80 focus:bg-muted/20 cursor-pointer"
              >
                {timezonesPreset.map(tz => (
                  <option key={tz} value={tz} className="bg-card text-foreground">{tz}</option>
                ))}
              </select>
              {mounted && (
                <span className="text-[11px] text-muted-foreground font-mono mt-1 select-text">
                  Current Time: {formatDisplayDateTime(new Date().toISOString())}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/25 pt-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Time Format</label>
                <div className="flex bg-muted/50 p-0.5 rounded-sm-sm border border-border/60">
                  <button
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      timeFormat === '12h' 
                        ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                    onClick={() => setTimeFormat('12h')}
                  >
                    12-Hour (AM/PM)
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      timeFormat === '24h' 
                        ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                    onClick={() => setTimeFormat('24h')}
                  >
                    24-Hour (Military)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Week Starts On</label>
                <div className="flex bg-muted/50 p-0.5 rounded-sm-sm border border-border/60">
                  <button
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      weekStartDay === 0 
                        ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                    onClick={() => setWeekStartDay(0)}
                  >
                    Sunday
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                      weekStartDay === 1 
                        ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                    onClick={() => setWeekStartDay(1)}
                  >
                    Monday
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Customization Preferences */}
          <div className="p-5 border border-border/80 bg-card/30 rounded-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60 font-mono">Workspace Preferences</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">App Roundness</label>
              <div className="flex bg-muted/50 p-0.5 rounded-sm-sm border border-border/60">
                <button
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                    roundness === 'rounded-none' 
                      ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  onClick={() => setRoundness('rounded-none')}
                >
                  Sharp (None)
                </button>
                <button
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                    roundness === 'rounded-md' 
                      ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  onClick={() => setRoundness('rounded-md')}
                >
                  Medium (MD)
                </button>
                <button
                  className={cn(
                    "flex-1 text-xs py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border",
                    roundness === 'rounded-lg' 
                      ? 'bg-card text-foreground border-border/85 shadow-sm-sm font-semibold' 
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  onClick={() => setRoundness('rounded-lg')}
                >
                  Large (LG)
                </button>
              </div>
            </div>

            {/* Toggle Navbar + Sidebars Auto-Hide — wrapped for onboarding spotlight */}
            <div id="onboarding-autohide-toggle" className="flex flex-col border-t border-border/25 mt-2">
              <div className="flex items-center justify-between py-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-semibold text-foreground">Auto-Hide Top Navbar</label>
                  <span className="text-xs text-muted-foreground">Slides open when cursor is near the top edge</span>
                </div>
                <button
                  onClick={() => setAutoHideNavbar(!autoHideNavbar)}
                  className={cn(
                    "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shadow-inner relative border border-border/40",
                    autoHideNavbar ? "bg-rose-500/80 dark:bg-rose-500/60 justify-end" : "bg-muted justify-start"
                  )}
                >
                  <motion.div 
                    layout 
                    className={cn("w-4.5 h-4.5 rounded-full shadow-sm-sm", autoHideNavbar ? "bg-white" : "bg-muted-foreground/60")} 
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Toggle Sidebars */}
              <div className="flex items-center justify-between py-3 border-t border-border/25">
                <div className="flex flex-col gap-0.5">
                  <label className="text-sm font-semibold text-foreground">Auto-Hide Sidebars</label>
                  <span className="text-xs text-muted-foreground">Slides open when cursor hovers near left or right screen edges</span>
                </div>
                <button
                  onClick={() => setAutoHideSidebars(!autoHideSidebars)}
                  className={cn(
                    "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shadow-inner relative border border-border/40",
                    autoHideSidebars ? "bg-rose-500/80 dark:bg-rose-500/60 justify-end" : "bg-muted justify-start"
                  )}
                >
                  <motion.div 
                    layout 
                    className={cn("w-4.5 h-4.5 rounded-full shadow-sm-sm", autoHideSidebars ? "bg-white" : "bg-muted-foreground/60")} 
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>{/* end onboarding-autohide-toggle */}

            {/* Toggle Grayscale Inactive Tabs */}
            <div className="flex items-center justify-between py-3 border-t border-border/25 mt-1">
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-semibold text-foreground">Grayscale Inactive Tabs</label>
                <span className="text-xs text-muted-foreground">Desaturate tab items in inactive panes to help visual focus</span>
              </div>
              <button
                onClick={() => setGrayscaleInactiveTabs(!grayscaleInactiveTabs)}
                className={cn(
                  "w-10 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer flex items-center shadow-inner relative border border-border/40",
                  grayscaleInactiveTabs ? "bg-rose-500/80 dark:bg-rose-500/60 justify-end" : "bg-muted justify-start"
                )}
              >
                <motion.div 
                  layout 
                  className={cn("w-4.5 h-4.5 rounded-full shadow-sm-sm", grayscaleInactiveTabs ? "bg-white" : "bg-muted-foreground/60")} 
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
