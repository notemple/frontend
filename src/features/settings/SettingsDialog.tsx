import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '@/features/settings/store';
import { formatDisplayDateTime, useIsMounted } from '@/shared/lib/time';
import { cn } from '@/shared/lib/utils';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { 
    timezone, 
    timeFormat, 
    weekStartDay, 
    roundness,
    spaceName,
    spaceIcon,
    autoHideNavbar,
    setTimezone, 
    setTimeFormat, 
    setWeekStartDay,
    setRoundness,
    setSpaceName,
    setSpaceIcon,
    setAutoHideNavbar
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
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  // Dynamically ensure the active timezone is in the select options
  const timezones = timezonesPreset.includes(timezone)
    ? timezonesPreset
    : [...timezonesPreset, timezone].sort();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-sm w-full max-w-md shadow-sm overflow-hidden font-sans"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <h2 className="font-bold text-lg text-foreground">Preferences</h2>
                <button onClick={onClose} className="p-1 hover:bg-muted/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {/* Space Name & Icon */}
                <div className="flex gap-4 items-end">
                  <div className="flex flex-col gap-2 flex-[2_2_0%]">
                    <label className="text-sm font-semibold text-foreground">Space Name</label>
                    <input
                      type="text"
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      placeholder="e.g. Personal Space"
                      className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-semibold text-foreground">Icon</label>
                    <div className="flex gap-2 items-center">
                      <div className="w-9 h-9 bg-muted flex items-center justify-center text-foreground font-bold text-sm shrink-0 rounded-sm-sm border border-border shadow-sm-sm select-none">
                        {spaceIcon || "N"}
                      </div>
                      <input
                        type="text"
                        maxLength={2}
                        value={spaceIcon}
                        onChange={(e) => setSpaceIcon(e.target.value)}
                        placeholder="N"
                        className="bg-background border border-border rounded-sm px-2 py-2 text-center text-sm text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40 transition-colors w-full cursor-pointer focus:ring-1 focus:ring-accent font-sans"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz} className="bg-card text-foreground">{tz}</option>
                    ))}
                  </select>
                  {mounted && (
                    <p className="text-xs text-muted-foreground mt-1">Current local time: {formatDisplayDateTime(new Date().toISOString())}</p>
                  )}
                </div>

                {/* Time Format */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Time Format</label>
                  <div className="flex bg-muted/40 p-1 rounded-sm border border-border">
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border ${timeFormat === '12h' ? 'bg-card text-foreground border-border/80 shadow-sm' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                      onClick={() => setTimeFormat('12h')}
                    >
                      12-Hour
                    </button>
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border ${timeFormat === '24h' ? 'bg-card text-foreground border-border/80 shadow-sm' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                      onClick={() => setTimeFormat('24h')}
                    >
                      24-Hour
                    </button>
                  </div>
                </div>

                {/* Week Start Day */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Week Start Day</label>
                  <select
                    value={weekStartDay.toString()}
                    onChange={(e) => setWeekStartDay(parseInt(e.target.value) as any)}
                    className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40 transition-colors w-full cursor-pointer focus:ring-1 focus:ring-accent font-sans"
                  >
                    <option value="0" className="bg-card text-foreground">Sunday</option>
                    <option value="1" className="bg-card text-foreground">Monday</option>
                    <option value="2" className="bg-card text-foreground">Tuesday</option>
                    <option value="3" className="bg-card text-foreground">Wednesday</option>
                    <option value="4" className="bg-card text-foreground">Thursday</option>
                    <option value="5" className="bg-card text-foreground">Friday</option>
                    <option value="6" className="bg-card text-foreground">Saturday</option>
                  </select>
                </div>

                {/* Border Roundness Settings */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Border Roundness</label>
                  <div className="flex bg-muted/40 p-1 rounded-sm border border-border">
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border ${roundness === 'rounded-none' ? 'bg-card text-foreground border-border/80 shadow-sm font-semibold' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                      onClick={() => setRoundness('rounded-none')}
                    >
                      Sharp (None)
                    </button>
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border ${roundness === 'rounded-md' ? 'bg-card text-foreground border-border/80 shadow-sm font-semibold' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                      onClick={() => setRoundness('rounded-md')}
                    >
                      Medium (MD)
                    </button>
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-sm font-medium transition-all select-none cursor-pointer border ${roundness === 'rounded-lg' ? 'bg-card text-foreground border-border/80 shadow-sm font-semibold' : 'text-muted-foreground border-transparent hover:text-foreground'}`}
                      onClick={() => setRoundness('rounded-lg')}
                    >
                      Large (LG)
                    </button>
                  </div>
                </div>

                {/* Auto Hide Navbar Setting */}
                <div className="flex items-center justify-between py-2.5 border-t border-border/85 mt-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-sm font-semibold text-foreground">Auto-Hide Top Navbar</label>
                    <span className="text-xs text-muted-foreground">Reveal by hover near the top edge</span>
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
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
