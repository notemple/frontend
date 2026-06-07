import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import {
	CalendarBlank,CheckSquare,
	Columns,
	Eye,Folder,Gear,
	PlusCircle,
	Tag,
	X
} from '@phosphor-icons/react';
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { TnLogo } from '@/shared/ui/TnLogo';

export const EmptyPaneState = ({ paneId }: { paneId: string }) => {
  const { addPane, openDocument, removePane, panes } = useUiStore(
    useShallow((state) => ({
      addPane: state.addPane,
      openDocument: state.openDocument,
      removePane: state.removePane,
      panes: state.panes,
    }))
  );

  const addDocument = useDocumentStore(state => state.addDocument);

  const handleNewPage = () => {
    const newId = `doc-${crypto.randomUUID()}`;
    addDocument({
      id: newId,
      title: '',
      content: '',
      type: 'page',
      tags: [],
      updatedAt: new Date().toISOString()
    });
    openDocument(newId, paneId);
  };

  const handleSplitWorkspace = () => {
    addPane(`pane-${Date.now()}`);
  };

  const handleClosePane = () => {
    removePane(paneId);
  };

  const handleOpenDailyNotes = () => {
    openDocument('section-daily-notes', paneId);
  };

  const handleOpenTasks = () => {
    openDocument('section-tasks', paneId);
  };

  const handleOpenTags = () => {
    openDocument('section-tags', paneId);
  };

  const handleOpenGlance = () => {
    openDocument('section-glance', paneId);
  };

  const handleOpenFolders = () => {
    openDocument('section-folders', paneId);
  };

  interface OptionItem {
    label: string;
    icon: React.ReactNode;
    action: () => void;
    visible?: boolean;
  }

  const options: OptionItem[] = [
    {
      label: 'New Page',
      icon: <PlusCircle size={16} className="text-emerald-500 shrink-0" />,
      action: handleNewPage,
      visible: panes.length > 1,
    },
    {
      label: 'Split Workspace',
      icon: <Columns size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />,
      action: handleSplitWorkspace,
      visible: true,
    },
    {
      label: 'Close Current Pane',
      icon: <X size={16} className="text-rose-500 shrink-0" />,
      action: handleClosePane,
      visible: panes.length > 1,
    },
    {
      label: 'Daily Notes',
      icon: <CalendarBlank size={16} className="text-emerald-500 shrink-0" />,
      action: handleOpenDailyNotes,
      visible: true,
    },
    {
      label: 'Tasks',
      icon: <CheckSquare size={16} className="text-blue-500 shrink-0" />,
      action: handleOpenTasks,
      visible: true,
    },
    {
      label: 'Tags',
      icon: <Tag size={16} className="text-purple-500 shrink-0" />,
      action: handleOpenTags,
      visible: true,
    },
    {
      label: 'Glance',
      icon: <Eye size={16} className="text-amber-500 shrink-0" />,
      action: handleOpenGlance,
      visible: true,
    },
    {
      label: 'Folders',
      icon: <Folder size={16} className="text-pink-500 shrink-0" />,
      action: handleOpenFolders,
      visible: true,
    },
    {
      label: 'Settings',
      icon: <Gear size={16} className="text-slate-500 shrink-0" />,
      action: () => openDocument('section-settings', paneId),
      visible: true,
    },
  ];

  const activeOptions = options.filter(opt => opt.visible !== false);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto no-scrollbar select-none bg-workspace">
      <div className="w-full max-w-[95vw] flex flex-col items-center gap-12 text-center">
        {/* Full-width "templ" text with Newsreader font */}
        <div className="w-full flex flex-col items-center justify-center select-none">
          <TnLogo className="w-16 h-16 sm:w-20 sm:h-20 mb-6" />
          <h1 className="w-full text-center font-content text-[15vw] sm:text-[16vw] font-bold tracking-tight lowercase leading-none select-none bg-gradient-to-br from-[#BDE0FE] via-[#FFC8DD] to-[#B5EAD7] bg-clip-text text-transparent">
            templ
          </h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground/40 mt-2 font-semibold select-none">
            Minimalist workspace
          </p>
        </div>

        {/* Wrapping Horizontal Row of Options */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-4 w-full px-4 max-w-4xl mt-2">
          {activeOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={opt.action}
              className="neu-btn select-none hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              {opt.icon}
              <span className="font-semibold text-xs md:text-sm tracking-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
