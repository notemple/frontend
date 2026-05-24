import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '../../store/uiStore';
import { MagnifyingGlass, Columns, FileText, ArrowRight } from '@phosphor-icons/react';
import { useDocumentStore } from '../../store/documentStore';
import { useShallow } from 'zustand/react/shallow';

let lastDocuments: any = null;
let cachedDocsList: any[] = [];

const docsListSelector = (state: any) => {
  if (state.documents === lastDocuments) {
    return cachedDocsList;
  }
  lastDocuments = state.documents;
  cachedDocsList = Object.values(state.documents)
    .map((doc: any) => doc ? { id: doc.id, title: doc.title } : null)
    .filter(Boolean);
  return cachedDocsList;
};

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addPane, openDocument } = useUiStore();
  
  // Stable outer selector wrapped in useShallow
  const docsList = useDocumentStore(useShallow(docsListSelector));

  const filteredDocs = docsList.filter(doc =>
    doc && (doc.title || 'Untitled').toLowerCase().includes(query.toLowerCase())
  );

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
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 pointer-events-auto"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-50 flex flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex items-center px-4 border-b border-white/5 relative">
              <MagnifyingGlass size={22} className="text-white/40 mr-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documents or type a command..."
                className="w-full bg-transparent h-16 text-white placeholder:text-white/30 outline-none text-lg font-sans tracking-tight"
              />
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono absolute right-6 pointer-events-none">
                Esc to close
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
              <div className="text-xs font-semibold px-3 py-2 text-white/40 mb-1 uppercase tracking-wider font-mono">Commands</div>
              <button
                onClick={allItems[0].action}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] text-left transition-all group ${selectedIndex === 0 ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
              >
                <div className="flex items-center">
                  {React.cloneElement(allItems[0].icon, { className: selectedIndex === 0 ? 'text-white mr-3' : 'text-white/40 group-hover:text-white/70 mr-3' })}
                  {allItems[0].title}
                </div>
                {selectedIndex === 0 && <ArrowRight size={14} className="text-white/50" />}
              </button>

              {filteredDocs.length > 0 && (
                <>
                  <div className="text-xs font-semibold px-3 py-2 text-white/40 mt-4 mb-1 uppercase tracking-wider font-mono">Documents</div>
                  {filteredDocs.map((doc, idx) => {
                    const itemIndex = idx + 1; // plus command
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => allItems[itemIndex].action()}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] text-left transition-all group ${isSelected ? 'bg-white/10 text-white shadow-sm' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                      >
                        <div className="flex items-center">
                          {React.cloneElement(allItems[itemIndex].icon, { className: isSelected ? 'text-white mr-3' : 'text-white/40 group-hover:text-white/70 mr-3' })}
                          {doc.title}
                        </div>
                        {isSelected && <ArrowRight size={14} className="text-white/50" />}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
