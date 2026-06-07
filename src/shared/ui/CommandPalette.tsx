import { useDocumentStore } from '@/features/documents/store';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { useTaskStore } from '@/features/tasks/store';
import {
	ArrowLeft,
	ArrowRight,
	CalendarBlank,
	CheckSquare,
	Columns,
	Eye,
	FileText,
	Folder,
	Gear,
	MagnifyingGlass,
	PlusCircle,
	Sparkle,
	Tag,
	X
} from '@phosphor-icons/react';
import { AnimatePresence,motion } from 'motion/react';
import React,{ useEffect,useRef,useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

type MenuState = 
  | { type: 'main' }
  | { type: 'folders' }
  | { type: 'folder_docs'; folderId: string; folderName: string };

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuState, setMenuState] = useState<MenuState>({ type: 'main' });

  const { addPane, openDocument, activePaneId, removePane, panes, closeDocument } = useUiStore(
    useShallow((state) => ({
      addPane: state.addPane,
      openDocument: state.openDocument,
      activePaneId: state.activePaneId,
      removePane: state.removePane,
      panes: state.panes,
      closeDocument: state.closeDocument,
    }))
  );

  const { documents, folders, folderColors } = useDocumentStore(
    useShallow((state: any) => ({
      documents: state.documents || {},
      folders: state.folders || [],
      folderColors: state.folderColors || {},
    }))
  );
  
  const tasks = useTaskStore(
    useShallow((state: any) => state.tasks || [])
  );
  
  const addDocument = useDocumentStore(state => state.addDocument);

  const parentRef = useRef<HTMLDivElement>(null);

  // Filter active documents
  const activeDocs = React.useMemo(() => {
    return Object.values(documents).filter((doc: any) => doc && !doc.isDeleted);
  }, [documents]);

  // Retrieve 3 most recently updated documents
  const recentDocs = React.useMemo(() => {
    return [...activeDocs]
      .sort((a: any, b: any) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 3);
  }, [activeDocs]);

  // Construct dynamic list of items based on state and query
  const allItems = React.useMemo(() => {
    const activePane = panes.find(p => p.id === activePaneId);
    const activeTabId = activePane?.activeTabId || null;

    if (query.trim() !== '') {
      const fuzzyMatch = (target: string, queryStr: string) => {
        const t = target.replace(/\s+/g, '').toLowerCase();
        const q = queryStr.replace(/\s+/g, '').toLowerCase();
        if (!q) return true;
        let qIdx = 0;
        for (let i = 0; i < t.length; i++) {
          if (t[i] === q[qIdx]) {
            qIdx++;
          }
          if (qIdx === q.length) return true;
        }
        return false;
      };

      const navigationItems = [
        { title: 'Ask AI', icon: <Sparkle size={16} style={{ color: '#a855f7' }} />, action: () => { openDocument('section-ask-ai', activePaneId || undefined); setIsOpen(false); } },
        { title: 'Daily Notes', icon: <CalendarBlank size={16} style={{ color: '#10b981' }} />, action: () => { openDocument('section-daily-notes', activePaneId || undefined); setIsOpen(false); } },
        { title: 'Tasks', icon: <CheckSquare size={16} style={{ color: '#3b82f6' }} />, action: () => { openDocument('section-tasks', activePaneId || undefined); setIsOpen(false); } },
        { title: 'Tags', icon: <Tag size={16} style={{ color: '#a855f7' }} />, action: () => { openDocument('section-tags', activePaneId || undefined); setIsOpen(false); } },
        { title: 'Glance', icon: <Eye size={16} style={{ color: '#f59e0b' }} />, action: () => { openDocument('section-glance', activePaneId || undefined); setIsOpen(false); } },
        { title: 'Folders', icon: <Folder size={16} style={{ color: '#ec4899' }} />, action: () => { setMenuState({ type: 'folders' }); } },
        { title: 'Settings', icon: <Gear size={16} style={{ color: '#64748b' }} />, action: () => { openDocument('section-settings', activePaneId || undefined); setIsOpen(false); } }
      ];

      const filteredNavigation = navigationItems.filter(item =>
        fuzzyMatch(item.title, query)
      );

      const filteredDocs = activeDocs.filter((doc: any) =>
        fuzzyMatch(doc.title || 'Untitled', query)
      );

      const filteredFolders = folders.filter((folder: any) =>
        folder && !folder.isDeleted && fuzzyMatch(folder.name || 'Untitled Folder', query)
      );

      const filteredTasks = tasks.filter((task: any) =>
        task && !task.isDeleted && fuzzyMatch(task.title || 'Untitled Task', query)
      );
      
      const items: any[] = [];

      if (filteredNavigation.length > 0) {
        items.push({ type: 'header', title: 'Matching Pages' });
        filteredNavigation.forEach(nav => {
          items.push({
            type: 'navigation',
            title: nav.title,
            icon: nav.icon,
            action: nav.action
          });
        });
      }

      items.push({ type: 'header', title: 'Commands' });
      items.push({ 
        type: 'command', 
        title: 'New Page', 
        icon: <PlusCircle size={16} style={{ color: '#10b981' }} />, 
        action: () => {
          const newId = `doc-${crypto.randomUUID()}`;
          addDocument({
            id: newId,
            title: '',
            content: '',
            type: 'page',
            tags: [],
            updatedAt: new Date().toISOString()
          });
          openDocument(newId, activePaneId || undefined);
          setIsOpen(false);
        }
      });

      // Add Close Current Page if a tab is open in active pane
      if (activeTabId) {
        items.push({
          type: 'command',
          title: 'Close Current Page',
          icon: <X size={16} style={{ color: '#ef4444' }} />,
          action: () => {
            closeDocument(activeTabId, activePaneId || undefined);
            setIsOpen(false);
          }
        });
      }

      // Add Close Current Pane only if multiple panes exist
      if (panes.length > 1) {
        items.push({ 
          type: 'command', 
          title: 'Close Current Pane', 
          icon: <X size={16} />, 
          action: () => { if (activePaneId) removePane(activePaneId); setIsOpen(false); } 
        });
      }

      items.push({ type: 'command', title: 'Split Workspace', icon: <Columns size={16} />, action: () => { addPane(`pane-${Date.now()}`); setIsOpen(false); } });

      if (filteredDocs.length > 0) {
        items.push({ type: 'header', title: 'Matching Documents' });
        filteredDocs.forEach((doc: any) => {
          items.push({
            type: 'document',
            title: doc.title || 'Untitled',
            icon: doc.icon ? (
              <span className="text-[14px] leading-none flex items-center justify-center font-sans shrink-0" style={doc.cardColor ? { color: doc.cardColor } : undefined}>
                {doc.icon}
              </span>
            ) : (
              <FileText size={16} style={doc.cardColor ? { color: doc.cardColor } : undefined} />
            ),
            action: () => { openDocument(doc.id, activePaneId || undefined); setIsOpen(false); }
          });
        });
      }

      if (filteredFolders.length > 0) {
        items.push({ type: 'header', title: 'Matching Folders' });
        filteredFolders.forEach((folder: any) => {
          const folderColor = folderColors[folder.id] || undefined;
          items.push({
            type: 'folder',
            title: folder.name || 'Untitled Folder',
            icon: <Folder size={16} style={folderColor ? { color: folderColor } : undefined} />,
            action: () => { 
              setMenuState({ type: 'folder_docs', folderId: folder.id, folderName: folder.name });
            }
          });
        });
      }

      if (filteredTasks.length > 0) {
        items.push({ type: 'header', title: 'Matching Tasks' });
        filteredTasks.forEach((task: any) => {
          items.push({
            type: 'task',
            title: task.title || 'Untitled Task',
            icon: <CheckSquare size={16} className={task.completed ? "text-green-500" : "text-zinc-500"} />,
            action: () => { 
              openDocument('section-tasks', activePaneId || undefined); 
              setIsOpen(false); 
            }
          });
        });
      }

      return items;
    }

    // Query is empty, show structured menu state
    if (menuState.type === 'main') {
      const items: any[] = [
        { type: 'header', title: 'Commands' },
        { 
          type: 'command', 
          title: 'New Page', 
          icon: <PlusCircle size={16} style={{ color: '#10b981' }} />, 
          action: () => {
            const newId = `doc-${crypto.randomUUID()}`;
            addDocument({
              id: newId,
              title: '',
              content: '',
              type: 'page',
              tags: [],
              updatedAt: new Date().toISOString()
            });
            openDocument(newId, activePaneId || undefined);
            setIsOpen(false);
          }
        }
      ];

      // Add Close Current Page if a tab is open in active pane
      if (activeTabId) {
        items.push({
          type: 'command',
          title: 'Close Current Page',
          icon: <X size={16} style={{ color: '#ef4444' }} />,
          action: () => {
            closeDocument(activeTabId, activePaneId || undefined);
            setIsOpen(false);
          }
        });
      }

      // Add Close Current Pane only if multiple panes exist
      if (panes.length > 1) {
        items.push({ 
          type: 'command', 
          title: 'Close Current Pane', 
          icon: <X size={16} />, 
          action: () => { if (activePaneId) removePane(activePaneId); setIsOpen(false); } 
        });
      }

      items.push({ type: 'command', title: 'Split Workspace', icon: <Columns size={16} />, action: () => { addPane(`pane-${Date.now()}`); setIsOpen(false); } });

      if (recentDocs.length > 0) {
        items.push({ type: 'header', title: 'Recent Documents' });
        recentDocs.forEach((doc: any) => {
          items.push({
            type: 'document',
            title: doc.title || 'Untitled',
            icon: doc.icon ? (
              <span className="text-[14px] leading-none flex items-center justify-center font-sans shrink-0" style={doc.cardColor ? { color: doc.cardColor } : undefined}>
                {doc.icon}
              </span>
            ) : (
              <FileText size={16} style={doc.cardColor ? { color: doc.cardColor } : undefined} />
            ),
            action: () => { openDocument(doc.id, activePaneId || undefined); setIsOpen(false); }
          });
        });
      }

      items.push({ type: 'header', title: 'Navigation' });
      items.push({ type: 'navigation', title: 'Ask AI', icon: <Sparkle size={16} style={{ color: '#a855f7' }} />, action: () => { openDocument('section-ask-ai', activePaneId || undefined); setIsOpen(false); } });
      items.push({ type: 'navigation', title: 'Daily Notes', icon: <CalendarBlank size={16} style={{ color: '#10b981' }} />, action: () => { openDocument('section-daily-notes', activePaneId || undefined); setIsOpen(false); } });
      items.push({ type: 'navigation', title: 'Tasks', icon: <CheckSquare size={16} style={{ color: '#3b82f6' }} />, action: () => { openDocument('section-tasks', activePaneId || undefined); setIsOpen(false); } });
      items.push({ type: 'navigation', title: 'Tags', icon: <Tag size={16} style={{ color: '#a855f7' }} />, action: () => { openDocument('section-tags', activePaneId || undefined); setIsOpen(false); } });
      items.push({ type: 'navigation', title: 'Glance', icon: <Eye size={16} style={{ color: '#f59e0b' }} />, action: () => { openDocument('section-glance', activePaneId || undefined); setIsOpen(false); } });
      items.push({ type: 'navigation', title: 'Folders', icon: <Folder size={16} style={{ color: '#ec4899' }} />, action: () => { setMenuState({ type: 'folders' }); } });
      items.push({ type: 'navigation', title: 'Settings', icon: <Gear size={16} style={{ color: '#64748b' }} />, action: () => { openDocument('section-settings', activePaneId || undefined); setIsOpen(false); } });

      return items;
    }

    if (menuState.type === 'folders') {
      const activeFolders = folders.filter((f: any) => f && !f.isDeleted);
      const items: any[] = [
        { type: 'header', title: 'Folders' },
        { type: 'back', title: '.. (Go Back)', icon: <ArrowLeft size={16} />, action: () => { setMenuState({ type: 'main' }); } }
      ];
      activeFolders.forEach((folder: any) => {
        const folderColor = folderColors[folder.id] || undefined;
        items.push({
          type: 'navigation',
          title: folder.name || 'Untitled Folder',
          icon: <Folder size={16} style={folderColor ? { color: folderColor } : undefined} />,
          action: () => { setMenuState({ type: 'folder_docs', folderId: folder.id, folderName: folder.name }); }
        });
      });
      return items;
    }

    if (menuState.type === 'folder_docs') {
      const { folderId, folderName } = menuState;
      const folderDocs = activeDocs.filter((d: any) => d.folderId === folderId);
      const items: any[] = [
        { type: 'header', title: `Documents in ${folderName}` },
        { type: 'back', title: '.. (Go Back)', icon: <ArrowLeft size={16} />, action: () => { setMenuState({ type: 'folders' }); } }
      ];
      folderDocs.forEach((doc: any) => {
        items.push({
          type: 'document',
          title: doc.title || 'Untitled',
          icon: doc.icon ? (
            <span className="text-[14px] leading-none flex items-center justify-center font-sans shrink-0" style={doc.cardColor ? { color: doc.cardColor } : undefined}>
              {doc.icon}
            </span>
          ) : (
            <FileText size={16} style={doc.cardColor ? { color: doc.cardColor } : undefined} />
          ),
          action: () => { openDocument(doc.id, activePaneId || undefined); setIsOpen(false); }
        });
      });
      return items;
    }

    return [];
  }, [query, menuState, activeDocs, recentDocs, folders, folderColors, tasks, activePaneId, addDocument, openDocument, panes, closeDocument, setIsOpen]);

  // Find first selectable item index when menuState or query changes
  useEffect(() => {
    const firstSelectable = allItems.findIndex(item => item && item.type !== 'header');
    setSelectedIndex(firstSelectable !== -1 ? firstSelectable : 0);
  }, [menuState, query, allItems]);

  // Global keybind listeners for opening and closing
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isK && isCtrlOrMeta) {
        e.preventDefault();
        setIsOpen((open) => !open);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    const togglePalette = () => {
      setIsOpen((open) => !open);
    };

    document.addEventListener('keydown', down);
    window.addEventListener('command-palette:toggle', togglePalette);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('command-palette:toggle', togglePalette);
    };
  }, [isOpen]);

  // Allow the tutorial to imperatively close the palette
  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener('tutorial:close-palette', close);
    return () => window.removeEventListener('tutorial:close-palette', close);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setMenuState({ type: 'main' });
    }
  }, [isOpen]);

  // Handle auto-scrolling when navigating items with Arrow keys
  useEffect(() => {
    if (isOpen && parentRef.current) {
      const activeEl = parentRef.current.querySelector(`#cmd-palette-item-${selectedIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Select next interactive index, skipping header rows
  const getNextSelectableIndex = (current: number, direction: 'down' | 'up') => {
    let next = current;
    const len = allItems.length;
    if (len === 0) return 0;
    
    for (let i = 0; i < len; i++) {
      if (direction === 'down') {
        next = (next + 1) % len;
      } else {
        next = (next - 1 + len) % len;
      }
      if (allItems[next] && allItems[next].type !== 'header') {
        return next;
      }
    }
    return current;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => getNextSelectableIndex(prev, 'down'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => getNextSelectableIndex(prev, 'up'));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex] && allItems[selectedIndex].type !== 'header') {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Backspace' && query === '') {
      if (menuState.type === 'folder_docs') {
        e.preventDefault();
        setMenuState({ type: 'folders' });
      } else if (menuState.type === 'folders') {
        e.preventDefault();
        setMenuState({ type: 'main' });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-transparent backdrop-blur-[2px] z-50 pointer-events-auto"
          />
          <motion.div
            id="onboarding-command-palette"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-background border border-border shadow-sm-sm z-50 flex flex-col overflow-hidden rounded-sm-sm"
          >
            <div className="flex items-center px-4 border-b border-border relative">
              <MagnifyingGlass size={22} className="text-muted-foreground mr-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  menuState.type === 'folder_docs' 
                    ? `Search in ${menuState.folderName}...` 
                    : menuState.type === 'folders' 
                      ? "Search folders..." 
                      : "Search documents or type a command..."
                }
                className="w-full bg-transparent h-16 text-foreground placeholder:text-muted-foreground/50 outline-none text-lg font-sans tracking-tight"
              />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono absolute right-6 pointer-events-none">
                Esc to close
              </div>
            </div>

            <div ref={parentRef} className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar flex flex-col gap-1">
              {allItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                if (item.type === 'header') {
                  return (
                    <div 
                      key={`header-${index}-${item.title}`} 
                      className="text-[10px] font-bold px-3 py-1.5 text-muted-foreground/50 uppercase tracking-widest font-mono mt-3 first:mt-1 select-none"
                    >
                      {item.title}
                    </div>
                  );
                }

                return (
                  <button
                    id={`cmd-palette-item-${index}`}
                    key={`item-${index}-${item.title}`}
                    onClick={() => {
                      item.action();
                    }}
                    onMouseEnter={() => {
                      if (item.type !== 'header') {
                        setSelectedIndex(index);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-sm-sm text-[13px] text-left transition-colors duration-100 group relative border border-transparent outline-none cursor-pointer select-none",
                      isSelected 
                        ? "bg-muted text-foreground font-semibold shadow-sm-sm border-border" 
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "shrink-0 flex items-center justify-center w-5 h-5",
                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {item.icon}
                      </div>
                      <span className="truncate">{item.title}</span>
                    </div>
                    {isSelected && <ArrowRight size={14} className="text-muted-foreground/60" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
