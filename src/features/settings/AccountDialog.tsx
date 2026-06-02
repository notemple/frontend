import React, { useState } from 'react';
import { X, Eye, EyeSlash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '@/features/settings/store';

export const AccountDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    userName,
    userEmail,
    userPassword,
    userProfileIcon,
    setUserName,
    setUserEmail,
    setUserPassword,
    setUserProfileIcon,
  } = useSettingsStore();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-transparent pointer-events-auto"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed top-20 right-6 w-full max-w-sm bg-card border border-border rounded-sm shadow-sm-sm z-50 overflow-hidden font-sans"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-muted flex items-center justify-center text-foreground font-bold text-[10px] shrink-0 rounded-sm-sm border border-border shadow-sm-sm">
                  {userProfileIcon || "N"}
                </div>
                <h2 className="font-bold text-sm text-foreground">Account</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted/50 rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4.5">
              {/* Profile Icon and Name Row */}
              <div className="flex gap-3 items-end">
                <div className="flex flex-col gap-1.5 flex-[2_2_0%]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter name"
                    className="bg-background border border-border rounded-sm px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Icon</label>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-8 h-8 bg-muted flex items-center justify-center text-foreground font-bold text-xs shrink-0 rounded-sm-sm border border-border shadow-sm-sm select-none">
                      {userProfileIcon || "N"}
                    </div>
                    <input
                      type="text"
                      maxLength={2}
                      value={userProfileIcon}
                      onChange={(e) => setUserProfileIcon(e.target.value)}
                      placeholder="N"
                      className="bg-background border border-border rounded-sm px-1.5 py-1.5 text-center text-xs text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-background border border-border rounded-sm px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-background border border-border rounded-sm pl-3 pr-9 py-1.5 text-xs text-foreground outline-none focus:border-accent/40 transition-colors w-full focus:ring-1 focus:ring-accent font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-1 rounded-sm cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
