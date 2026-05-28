import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '@/shared/store/uiStore';
import { MagnifyingGlass, Columns, FileText, ArrowRight } from '@phosphor-icons/react';
import { useDocumentStore } from '@/features/documents/store';
import { useShallow } from 'zustand/react/shallow';
import { useVirtual } from 'react-virtual';

let lastDocuments: any = null;
let cachedDocsList: any[] = [];

const docsListSelector = (state: any) => {
  if (state.documents === lastDocuments) {
    return cachedDocsList;
  }
  lastDocuments = state.documents;
  cachedDocsList = Object.values(state.documents)
    .filter((doc: any) => doc && !doc.isDeleted)
    .map((doc: any) => ({ id: doc.id, title: doc.title || 'Untitled' }))
    .filter(Boolean);
  return cachedDocsList;
};

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addPane, openDocument } = useUiStore(
    useShallow((state) => ({
      addPane: state.addPane,
      openDocument: state.openDocument,
    }))
  );
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Stable outer selector wrapped in useShallow
  const docsList = useDocumentStore(useShallow(docsListSelector));

  const filteredDocs = docsList.filter(doc =>
    doc && (doc.title || 'Untitled').toLowerCase().includes(query.toLowerCase())
  );

  const rowVirtualizer = useVirtual({
    size: filteredDocs.length,
    parentRef,
    estimateSize: React.useCallback(() => 42, []), // estimated row height is 42px
    overscan: 5,
  });

  const allItems = [
    { type: 'command', title: 'Split Workspace', icon: <Columns size={16} />, action: () => { addPane(`pane-${Date.now()}`); setIsOpen(false); } },
    ...filteredDocs.map(doc => ({ type: 'document', title: doc?.title || 'Untitled', icon: <FileText size={16} />, action: () => { if(doc?.id) openDocument(doc.id); setIsOpen(false); } }))
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
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
            className="fixed inset-0 bg-card z-50 pointer-events-auto"
          />
          <motion.div
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
                placeholder="Search documents or type a command..."
                className="w-full bg-transparent h-16 text-foreground placeholder:text-muted-foreground/50 outline-none text-lg font-sans tracking-tight"
              />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-mono absolute right-6 pointer-events-none">
                Esc to close
              </div>
            </div>

            <div ref={parentRef} className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
              <div className="text-xs font-semibold px-3 py-2 text-muted-foreground mb-1 uppercase tracking-wider font-mono">Commands</div>
              <button
                onClick={allItems[0].action}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm-sm text-[13px] text-left transition-colors duration-100 group ${selectedIndex === 0 ? 'bg-muted text-foreground font-semibold shadow-sm-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <div className="flex items-center">
                  {React.cloneElement(allItems[0].icon, { className: selectedIndex === 0 ? 'text-foreground mr-3' : 'text-muted-foreground mr-3' })}
                  {allItems[0].title}
                </div>
                {selectedIndex === 0 && <ArrowRight size={14} className="text-muted-foreground/60" />}
              </button>

              {filteredDocs.length > 0 && (
                <>
                  <div className="text-xs font-semibold px-3 py-2 text-muted-foreground mt-4 mb-1 uppercase tracking-wider font-mono">Documents</div>
                  <div
                    style={{
                      height: `${rowVirtualizer.totalSize}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.virtualItems.map((virtualRow) => {
                      const doc = filteredDocs[virtualRow.index];
                      if (!doc) return null;
                      const itemIndex = virtualRow.index + 1; // plus command
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => allItems[itemIndex].action()}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-sm-sm text-[13px] text-left transition-colors duration-100 group ${isSelected ? 'bg-muted text-foreground font-semibold shadow-sm-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                          <div className="flex items-center">
                            {React.cloneElement(allItems[itemIndex].icon, { className: isSelected ? 'text-foreground mr-3' : 'text-muted-foreground mr-3' })}
                            {doc.title || 'Untitled'}
                          </div>
                          {isSelected && <ArrowRight size={14} className="text-muted-foreground/60" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
