import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { CustomCodeBlock } from '../extensions/CustomCodeBlock';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { 
  FileText, 
  ArrowSquareOut,
  X,
  Sparkle
} from '@phosphor-icons/react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import ReactDOM from 'react-dom';

export const DocumentPreviewPopup = () => {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLElement | null>(null);
  
  const documents = useDocumentStore(state => state.documents);
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const openDocument = useUiStore(state => state.openDocument);
  
  const popupRef = useRef<HTMLDivElement>(null);
  const targetDoc = activeDocId ? documents[activeDocId] : null;

  // Track the global event to open preview popup
  useEffect(() => {
    const handleOpenPreview = (e: CustomEvent) => {
      const { id, trigger } = e.detail;
      setActiveDocId(id);
      setTriggerEl(trigger);
    };

    window.addEventListener('doc-preview-open' as any, handleOpenPreview as any);
    return () => window.removeEventListener('doc-preview-open' as any, handleOpenPreview as any);
  }, []);

  // Set up Floating UI coordinates
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    open: !!activeDocId,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 12 })]
  });

  useEffect(() => {
    if (triggerEl) {
      refs.setReference(triggerEl);
    }
  }, [triggerEl, refs]);

  // Click outside and escape listeners to close popup
  useEffect(() => {
    if (!activeDocId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(e.target as Node) &&
        triggerEl &&
        !triggerEl.contains(e.target as Node)
      ) {
        setActiveDocId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDocId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDocId, triggerEl]);

  // Initialize mini tiptap editor inside the preview popup
  const extensions = useMemo(() => [
    StarterKit.configure({
      underline: false,
      codeBlock: false,
    }),
    CustomCodeBlock,
    Placeholder.configure({
      placeholder: 'Add details inside this note preview...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    Color,
    TextStyle,
    FontFamily,
    Highlight,
    Typography,
  ], []);

  const debouncedUpdateRef = useRef<any>(null);

  const previewEditor = useEditor({
    extensions,
    content: targetDoc?.content || '',
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none w-full max-w-full text-foreground/90 font-content text-[13px] leading-relaxed prose-p:my-1 prose-headings:text-foreground prose-ol:text-foreground prose-ul:text-foreground',
      }
    },
    onUpdate: ({ editor }) => {
      if (!activeDocId) return;
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
      debouncedUpdateRef.current = setTimeout(() => {
        updateDocument(activeDocId, { content: editor.getHTML() });
        debouncedUpdateRef.current = null;
      }, 500);
    }
  });

  // Synchronously save pending edits when closing or swapping preview note
  useEffect(() => {
    if (previewEditor && activeDocId) {
      setTimeout(() => {
        if (previewEditor && !previewEditor.isDestroyed) {
          previewEditor.commands.setContent(targetDoc?.content || '');
        }
      }, 0);
    }
    return () => {
      if (debouncedUpdateRef.current && activeDocId) {
        clearTimeout(debouncedUpdateRef.current);
        debouncedUpdateRef.current = null;
        if (previewEditor && !previewEditor.isDestroyed) {
          updateDocument(activeDocId, { content: previewEditor.getHTML() });
        }
      }
    };
  }, [activeDocId, previewEditor, targetDoc?.content]);

  if (!activeDocId || !targetDoc) return null;

  const handleOpenFullTab = () => {
    openDocument(activeDocId);
    setActiveDocId(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateDocument(activeDocId, { title: e.target.value });
  };

  // Render popup overlay inside React Portal
  return ReactDOM.createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="table-dark-menu z-[1000] w-[350px] max-h-[380px] flex flex-col shadow-xl select-none animate-fade-in p-0 overflow-hidden font-sans border border-[#27272a] bg-[#18181b]"
    >
      <div 
        ref={popupRef}
        className="flex flex-col h-full w-full max-h-[380px]"
      >
        {/* Portal Header */}
        <div className="flex items-center justify-between border-b border-[#27272a] px-3.5 py-2.5 bg-[#202023] shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText size={14} className="text-[#a1a1aa] shrink-0" />
            <input 
              value={targetDoc.title || ''}
              onChange={handleTitleChange}
              placeholder="Untitled note"
              className="bg-transparent border-none text-[12px] font-semibold text-[#f4f4f5] outline-none truncate w-full"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <button 
              onClick={handleOpenFullTab}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Open full document"
            >
              <ArrowSquareOut size={13} />
            </button>
            <button 
              onClick={() => setActiveDocId(null)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Live Mini Editor */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[320px] scrollbar-thin">
          <EditorContent editor={previewEditor} />
        </div>
      </div>
    </div>,
    document.body
  );
};
