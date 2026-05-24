import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '@/src/store/settingsStore';

export const SettingsDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { timezone, timeFormat, weekStartDay, setTimezone, setTimeFormat, setWeekStartDay } = useSettingsStore();

  // Simple list of timezones
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#222]">
                <h2 className="font-bold text-lg text-foreground">Preferences</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#f7aae0] transition-colors"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Current local time: {new Date().toLocaleTimeString('en-US', { timeZone: timezone })}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Time Format</label>
                  <div className="flex bg-[#222] p-1 rounded-lg border border-white/10">
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${timeFormat === '12h' ? 'bg-[#333] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setTimeFormat('12h')}
                    >
                      12-Hour
                    </button>
                    <button
                      className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${timeFormat === '24h' ? 'bg-[#333] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setTimeFormat('24h')}
                    >
                      24-Hour
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Week Start Day</label>
                  <select
                    value={weekStartDay.toString()}
                    onChange={(e) => setWeekStartDay(parseInt(e.target.value) as any)}
                    className="bg-[#222] border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#f7aae0] transition-colors"
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
