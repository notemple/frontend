import React from 'react';
import { useUiStore } from '@/shared/store/uiStore';
import { useDocumentStore } from '@/features/documents/store';
import { useShallow } from 'zustand/react/shallow';
import { 
  Columns, PlusCircle, X, CalendarBlank, CheckSquare, Tag, Eye, Folder 
} from '@phosphor-icons/react';

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
      visible: true,
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
  ];

  const activeOptions = options.filter(opt => opt.visible !== false);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto no-scrollbar select-none bg-workspace">
      <div className="max-w-3xl w-full flex flex-col items-center gap-12 text-center">
        {/* Shadowy Neumorphic templ Card */}
        <div className="w-full neu-card py-20 px-8 flex flex-col items-center justify-center relative overflow-hidden group select-none hover:scale-[1.01] active:scale-[0.99] duration-300">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <h1 className="font-sans text-8xl md:text-9xl font-black tracking-widest uppercase select-none transition-all duration-300 text-[#ebe8e4] [text-shadow:4px_4px_8px_#c3c0ba,-4px_-4px_8px_#ffffff] dark:text-[#161616] dark:[text-shadow:4px_4px_8px_#000000,-4px_-4px_8px_rgba(255,255,255,0.03)] cursor-default">
            templ
          </h1>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground/40 mt-4 font-semibold select-none group-hover:text-muted-foreground/60 transition-colors duration-300">
            Minimalist workspace
          </p>
        </div>

        {/* Wrapping Horizontal Row of Options */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-4 w-full px-4 mt-2">
          {activeOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={opt.action}
              className="neu-btn select-none hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-sm"
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
