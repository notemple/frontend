import { useDocumentStore } from '@/features/documents/store';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { FileText,Folder as FolderIcon } from '@phosphor-icons/react';
import React,{ useEffect,useMemo,useRef,useState } from 'react';

export const parseTaskTitle = (title: string, onDocClick: (docId: string, e: React.MouseEvent) => void) => {
  if (!title || !title.trim()) return <span className="text-muted-foreground/40 font-normal italic">Untitled Task</span>;

  const parts = [];
  const regex = /\[\[(doc-[a-zA-Z0-9-]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(title)) !== null) {
    const textBefore = title.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(<span key={`text-${lastIndex}`}>{textBefore}</span>);
    }

    const docId = match[1];
    const docLabel = match[2];

    const doc = useDocumentStore.getState().documents[docId];
    const docIcon = doc?.icon || '📄';

    parts.push(
      <span
        key={`doc-${match.index}`}
        onClick={(e) => onDocClick(docId, e)}
        onPointerDown={(e) => e.stopPropagation()} // Prevents dnd-kit card dragging
        className="mx-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold cursor-pointer hover:bg-blue-500/20 active:scale-95 transition-all select-none align-middle"
        title="Click to open document"
      >
        <span className="shrink-0 mr-0.5 text-[12px]">{docIcon}</span>
        {docLabel}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  const textAfter = title.substring(lastIndex);
  if (textAfter) {
    parts.push(<span key={`text-${lastIndex}`}>{textAfter}</span>);
  }

  return parts;
};

const stringToHtml = (str: string) => {
  if (!str) return '';
  return str.replace(/\[\[(doc-[a-zA-Z0-9-]+)\|([^\]]+)\]\]/g, (match, docId, label) => {
    const doc = useDocumentStore.getState().documents[docId];
    const docIcon = doc?.icon || '📄';
    return `<span class="mx-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold cursor-pointer select-none align-middle" data-doc-id="${docId}" data-doc-label="${label}" contenteditable="false"><span class="shrink-0 mr-0.5 text-[12px]">${docIcon}</span>${label}</span>`;
  });
};

const htmlToString = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const badges = temp.querySelectorAll('span[data-doc-id]');
  badges.forEach(badge => {
    const docId = badge.getAttribute('data-doc-id');
    const label = badge.getAttribute('data-doc-label');
    if (docId && label) {
      badge.replaceWith(`[[${docId}|${label}]]`);
    }
  });
  const rawText = temp.textContent || temp.innerText || '';
  return rawText.replace(/\u00A0/g, ' ');
};

export const TaskTitleInput = ({
  value,
  onChange,
  onBlur,
  isCompleted,
  className,
  isSmallView = false,
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  isCompleted: boolean;
  className?: string;
  isSmallView?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [atTokenIndex, setAtTokenIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const rawFolders = useDocumentStore(state => state.folders) || [];
  const documents = useDocumentStore(state => state.documents) || {};
  const openDocument = useUiStore(state => state.openDocument);

  const folders = useMemo(() => rawFolders.filter(f => !f.isDeleted), [rawFolders]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.innerHTML = stringToHtml(value);
      editableRef.current.focus();
      
      // Move caret to end
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isEditing]);

  // Click outside to close autocomplete
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const selectableItems = useMemo(() => {
    const list: { id: string; title: string; type: 'document'; folderName?: string }[] = [];
    const query = searchQuery.toLowerCase();

    // 1. Folders and their documents
    folders.forEach(folder => {
      const docsInFolder = Object.values(documents)
        .filter((doc: any) => doc && doc.folderId === folder.id && !doc.isDeleted)
        .filter((doc: any) => !query || (doc.title || 'Untitled').toLowerCase().includes(query));

      docsInFolder.forEach((doc: any) => {
        list.push({
          id: doc.id,
          title: doc.title || 'Untitled',
          type: 'document',
          folderName: folder.name
        });
      });
    });

    // 2. Uncategorized documents
    const uncategorizedDocs = Object.entries(documents)
      .filter(([id, doc]: any) => doc && !doc.folderId && !doc.isDeleted && !id.startsWith('daily-note-') && !id.startsWith('task-'))
      .map(([_, doc]: any) => doc)
      .filter((doc: any) => !query || (doc.title || 'Untitled').toLowerCase().includes(query));

    uncategorizedDocs.forEach((doc: any) => {
      list.push({
        id: doc.id,
        title: doc.title || 'Untitled',
        type: 'document',
        folderName: 'Uncategorized'
      });
    });

    return list;
  }, [folders, documents, searchQuery]);

  const groupedMenu = useMemo(() => {
    const groups: Record<string, typeof selectableItems> = {};
    selectableItems.forEach(item => {
      const g = item.folderName || 'Uncategorized';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }, [selectableItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const val = editableRef.current?.innerHTML || '';
    const parsedStr = htmlToString(val);
    onChange(parsedStr);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableRef.current!);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const textBeforeCursor = preCaretRange.toString();
      
      const lastAtIdx = textBeforeCursor.lastIndexOf('@');
      if (lastAtIdx !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
        if (!/\s/.test(textAfterAt)) {
          setShowAutocomplete(true);
          setSearchQuery(textAfterAt);
          setAtTokenIndex(lastAtIdx);
          return;
        }
      }
    }
    setShowAutocomplete(false);
  };

  const selectDocument = (docId: string, docTitle: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editableRef.current) return;

    const range = selection.getRangeAt(0);
    let textNode = range.startContainer;
    let offset = range.startOffset;

    if (textNode.nodeType === Node.ELEMENT_NODE) {
      const children = textNode.childNodes;
      if (children.length > 0) {
        textNode = children[Math.min(offset, children.length - 1)];
      }
    }

    const text = textNode.textContent || '';
    const lastAtIdx = text.lastIndexOf('@');
    
    const doc = useDocumentStore.getState().documents[docId];
    const docIcon = doc?.icon || '📄';

    if (lastAtIdx !== -1) {
      range.setStart(textNode, lastAtIdx);
      range.setEnd(textNode, offset);
      range.deleteContents();
      
      const span = document.createElement('span');
      span.className = "mx-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold cursor-pointer select-none align-middle";
      span.setAttribute('data-doc-id', docId);
      span.setAttribute('data-doc-label', docTitle);
      span.setAttribute('contenteditable', 'false');
      span.innerHTML = `<span class="shrink-0 mr-0.5 text-[12px]">${docIcon}</span>${docTitle}`;
      
      range.insertNode(span);
      
      const space = document.createTextNode('\u00A0');
      range.setStartAfter(span);
      range.insertNode(space);
      
      range.setStartAfter(space);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const span = document.createElement('span');
      span.className = "mx-0.5 inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold cursor-pointer select-none align-middle";
      span.setAttribute('data-doc-id', docId);
      span.setAttribute('data-doc-label', docTitle);
      span.setAttribute('contenteditable', 'false');
      span.innerHTML = `<span class="shrink-0 mr-0.5 text-[12px]">${docIcon}</span>${docTitle}`;
      
      range.insertNode(span);
      
      const space = document.createTextNode('\u00A0');
      range.setStartAfter(span);
      range.insertNode(space);
      
      range.setStartAfter(space);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const newStr = htmlToString(editableRef.current.innerHTML);
    onChange(newStr);
    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showAutocomplete && selectableItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % selectableItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + selectableItems.length - 1) % selectableItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = selectableItems[selectedIndex];
        if (selected) {
          selectDocument(selected.id, selected.title);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      editableRef.current?.blur();
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsEditing(false);
      onBlur();
    }, 180);
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={cn(
          "text-sm font-sans transition-all py-1.5 px-2 flex-1 rounded-sm-sm border border-transparent hover:border-border/30 hover:bg-muted/10 cursor-text select-none min-w-0 truncate whitespace-nowrap leading-tight",
          isCompleted ? "line-through text-muted-foreground/40 font-medium" : "text-foreground font-semibold",
          className
        )}
      >
        {parseTaskTitle(value, (docId, e) => {
          e.stopPropagation();
          e.preventDefault();
          openDocument(docId);
        })}
      </div>
    );
  }

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div
        ref={editableRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()} // Prevents dragging on Kanban board
        className={cn(
          "text-sm font-sans font-semibold transition-all bg-transparent border border-border/80 focus:border-border/80 focus:ring-1 focus:ring-border rounded-sm-sm outline-none px-2 w-full py-1 text-left min-h-[28px] break-words whitespace-pre-wrap",
          isCompleted ? "line-through text-muted-foreground/50" : "text-foreground font-semibold",
          className
        )}
      />
      {showAutocomplete && selectableItems.length > 0 && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-background border border-border shadow-xl rounded-sm-sm p-1.5 z-[100] max-h-48 overflow-y-auto no-scrollbar font-sans flex flex-col gap-1 text-left">
          {Object.keys(groupedMenu).map(groupName => (
            <div key={groupName} className="flex flex-col gap-0.5">
              <div className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground/75 tracking-wider uppercase flex items-center gap-1.5 border-b border-border/40 pb-1 mb-1">
                <FolderIcon size={11} className="opacity-60" />
                {groupName}
              </div>
              {groupedMenu[groupName].map(item => {
                const flattenedIndex = selectableItems.findIndex(i => i.id === item.id);
                const isSelected = flattenedIndex === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents blur
                      selectDocument(item.id, item.title);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-sm transition-all relative outline-none cursor-pointer text-left font-semibold",
                      isSelected ? "bg-muted text-foreground border border-border/40" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent"
                    )}
                  >
                    <FileText size={13} className="text-blue-500 shrink-0 opacity-80" />
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
