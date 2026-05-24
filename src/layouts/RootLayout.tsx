import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MainWorkspace } from './MainWorkspace';
import { RightSidebar } from './RightSidebar';
import { CommandPalette } from "../components/ui/CommandPalete";
import { useUiStore } from '../store/uiStore';

export const RootLayout = () => {
  const { openDocument, appearance } = useUiStore();

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      let isDark = true;
      if (appearance === 'light') {
        isDark = false;
      } else if (appearance === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        root.classList.remove('light');
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (appearance === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [appearance]);

  useEffect(() => {
    // openDocument('new-note');
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground relative">
      <Sidebar />
      <MainWorkspace />
      <RightSidebar />
      <CommandPalette />
    </div>
  );
};


