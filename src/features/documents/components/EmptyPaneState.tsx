
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useSettingsStore } from '@/features/settings/store';
import { DailyNotesPage } from '@/features/daily-notes/DailyNotesPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TagsPage } from '@/features/tags/TagsPage';
import { cn, getItemColor, getFolderStyle, getFolderHexColor } from '@/shared/lib/utils';
import { TAG_COLOR_PRESETS } from '@/shared/constants/colors';
import { Columns, Sidebar as SidebarIcon, ShareFat, Bell, ClockCounterClockwise, Layout, CaretDown, FileText, Folder, Sun, Moon, Monitor, Clock, ArrowLeft, PlusCircle, Check, X, Plus, Trash } from '@phosphor-icons/react';
import { useShallow } from 'zustand/react/shallow';
import { SectionGridItem } from './SectionGridItem';
import { ColorPicker } from '@/shared/ui/ColorPicker';

export const EmptyPaneState = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <div className="w-16 h-16 border border-border flex items-center justify-center mb-4 text-border">
        <Columns size={24} />
      </div>
      <p className="text-sm">Select a document to open in this pane.</p>
    </div>
  );
};
