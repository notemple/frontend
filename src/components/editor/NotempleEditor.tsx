import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { motion } from 'motion/react';
import { SlashCommand, getSuggestionItems, renderItems } from './SlashCommand';
import { useDocumentStore } from '@/src/store/documentStore';
import { useUiStore } from '@/src/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { Tag, TextB, TextItalic, TextStrikethrough, TextAUnderline, Code, ArrowsInSimple } from '@phosphor-icons/react';
import { useSettingsStore } from '@/src/store/settingsStore';
import { toDate } from 'date-fns-tz';
import { cn } from '@/src/lib/utils';
import { formatDisplayDate } from '@/src/lib/time';

const EMPTY_TAGS: string[] = [];

let lastDocumentsTags: any = null;
let cachedAllExistingTags: string[] = [];

const allExistingTagsSelector = (state: any) => {
  if (state.documents === lastDocumentsTags) {
    return cachedAllExistingTags;
  }
  lastDocumentsTags = state.documents;
  const set = new Set<string>();
  Object.values(state.documents).forEach((doc: any) => {
    doc.tags?.forEach((tag: string) => set.add(tag));
  });
  cachedAllExistingTags = Array.from(set);
  return cachedAllExistingTags;
};

export const NotempleEditor = ({ 
  documentId, 
  paneId, 
  isDailyNote, 
  isMinimized = false, 
  onClosePopup 
}: { 
  documentId: string; 
  paneId?: string; 
  isDailyNote?: boolean; 
  isMinimized?: boolean; 
  onClosePopup?: () => void; 
}) => {
  const addDocument = useDocumentStore(state => state.addDocument);
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const { setActiveTab, openDocument, setSelectedDailyNoteDate } = useUiStore();
  const { timezone } = useSettingsStore();

  const handleBackToDailyNotes = () => {
    if (onClosePopup) {
      onClosePopup();
      return;
    }
    const dateStr = documentId.replace('daily-note-', '');
    const parsedDate = toDate(`${dateStr}T00:00:00`, { timeZone: timezone });
    setSelectedDailyNoteDate(parsedDate);
    if (paneId) {
      openDocument('section-daily-notes', paneId);
    } else {
      openDocument('section-daily-notes');
    }
  };

  const documentSelector = useCallback(
    (state: any) => {
      const d = state.documents[documentId];
      if (!d) {
        return {
          id: documentId,
          title: '',
          content: '',
          type: 'page',
          updatedAt: '',
          tags: EMPTY_TAGS
        };
      }
      return d;
    },
    [documentId]
  );
  const document = useDocumentStore(useShallow(documentSelector));

  const allExistingTags = useDocumentStore(useShallow(allExistingTagsSelector));

  const [title, setTitle] = useState(document?.title || '');
  const [tags, setTags] = useState<string[]>(document?.tags || []);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  const localStyle = {
    color: document?.color || '#ffffff',
    fontFamily: document?.fontFamily || '',
    backdropColor: document?.backdropColor,
    backdropType: document?.backdropType || 'none',
    backdropStyle: document?.backdropStyle || 'immersive',
    backdropGradientStart: document?.backdropGradientStart || '',
    backdropGradientEnd: document?.backdropGradientEnd || '',
    backdropGradientDirection: document?.backdropGradientDirection || '',
    documentColor: document?.documentColor,
    textColor: document?.textColor
  };

  const hasCustomStyle = !!(localStyle.backdropColor || localStyle.documentColor || localStyle.textColor);

  // Smart dynamic text color contrast resolver
  const activeTextColor = useMemo(() => {
    if (localStyle.textColor) return localStyle.textColor;
    if (!hasCustomStyle) return 'var(--foreground)';
    if (!localStyle.documentColor) return '#111827'; // Default light beige paper

    const clean = localStyle.documentColor.toLowerCase();
    
    // Check if it's a gradient
    if (clean.includes('gradient')) {
      // If it contains dark colors/gradients, it is dark paper
      if (
        clean.includes('#09090b') || clean.includes('#18181b') ||
        clean.includes('#1c1c1e') || clean.includes('#0f172a') ||
        clean.includes('#1a1740') || clean.includes('#121214') ||
        clean.includes('#1e293b') || clean.includes('#1f1b40') ||
        clean.includes('#0b2e24') || clean.includes('#041410') ||
        clean.includes('#300f4f') || clean.includes('#18052b') ||
        clean.includes('#420d0d') || clean.includes('#1f0404') ||
        clean.includes('#07241c') || clean.includes('#24053e') ||
        clean.includes('#2d0505')
      ) {
        return '#ffffff';
      }
      return '#111827';
    }
    
    // Check solid hex brightness
    if (clean.startsWith('#')) {
      const hex = clean.substring(1);
      if (hex.length === 3 || hex.length === 6) {
        const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
        const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
        const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
        const brightness = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
        return brightness < 130 ? '#ffffff' : '#111827';
      }
    }
    
    return '#111827';
  }, [localStyle.textColor, localStyle.documentColor, hasCustomStyle]);

  // Derived muted color
  const activeMutedColor = useMemo(() => {
    if (localStyle.textColor) return localStyle.textColor;
    if (!hasCustomStyle) return 'var(--muted-foreground)';
    return activeTextColor === '#ffffff' ? '#9ca3af' : '#4b5563';
  }, [localStyle.textColor, activeTextColor, hasCustomStyle]);

  useEffect(() => {
    if (document) {
      if (document.title !== title) {
        setTitle(document.title || '');
      }
      setTags(document.tags || []);
    }
  }, [document?.id, document?.title, title]);

  const extensions = useMemo(() => [
    StarterKit.configure({
      underline: false,
    }),
    Placeholder.configure({
      placeholder: 'Press "/" for commands, or start typing...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Image,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    Color,
    TextStyle,
    FontFamily,
    Highlight.configure({
      multicolor: true,
    }),
    Typography,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    SlashCommand.configure({
      suggestion: {
        items: getSuggestionItems,
        render: renderItems,
      },
    }),
  ], []);

  const debouncedUpdateRef = useRef<any>(null);

  const editor = useEditor({
    extensions,
    content: document?.content || '',
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none w-full max-w-full',
          (localStyle.backdropColor || localStyle.textColor || localStyle.documentColor)
            ? ''
            : 'text-foreground prose-headings:text-foreground hover:prose-a:text-foreground prose-a:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-ol:text-foreground prose-ul:text-foreground prose-p:text-foreground/95'
        ),
        style: (localStyle.backdropColor || localStyle.textColor || localStyle.documentColor)
          ? `color: ${activeTextColor}; --tw-prose-body: ${activeTextColor}; --tw-prose-headings: ${activeTextColor}; --tw-prose-bold: ${activeTextColor}; --tw-prose-links: ${activeTextColor}; --tw-prose-quotes: ${activeTextColor}; --tw-prose-code: ${activeTextColor};`
          : ''
      },
      handleDrop: (view, event, slice, moved) => {
        if (!event.dataTransfer) return false;

        const insertData = event.dataTransfer.getData('application/notemple-insert');
        if (insertData) {
          const { label } = JSON.parse(insertData);
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (coordinates) {
            const contentToInsert = `[${label} Placeholder]`;
            if (label === 'Image' || label === 'Image from Unsplash') {
              view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.image.create({
                src: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=600&auto=format&fit=crop',
                alt: 'Unsplash Placeholder'
              })));
            } else if (label === 'Text') {
              view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.paragraph.create()));
            } else if (label === 'Code Block') {
              view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.codeBlock.create()));
            } else if (label === 'Table') {
              const tableNode = view.state.schema.nodes.table.create(null, [
                view.state.schema.nodes.tableRow.create(null, [
                  view.state.schema.nodes.tableHeader.createAndFill()!,
                  view.state.schema.nodes.tableHeader.createAndFill()!
                ]),
                view.state.schema.nodes.tableRow.create(null, [
                  view.state.schema.nodes.tableCell.createAndFill()!,
                  view.state.schema.nodes.tableCell.createAndFill()!
                ])
              ]);
              view.dispatch(view.state.tr.insert(coordinates.pos, tableNode));
            } else {
              view.dispatch(view.state.tr.insertText(contentToInsert, coordinates.pos));
            }
            view.focus();
            return true;
          }
        }

        const lineData = event.dataTransfer.getData('application/notemple-insert-line');
        if (lineData) {
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (coordinates) {
            view.dispatch(view.state.tr.insert(coordinates.pos, view.state.schema.nodes.horizontalRule.create()));
            view.focus();
            return true;
          }
        }

        return false;
      }
    },
    onUpdate: ({ editor }) => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
      debouncedUpdateRef.current = setTimeout(() => {
        updateDocument(documentId, { content: editor.getHTML() });
        debouncedUpdateRef.current = null;
      }, 750);
    }
  });

  // Synchronously save any pending editor edits on unmount or tab switch
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
        debouncedUpdateRef.current = null;
        if (editor && !editor.isDestroyed) {
          const html = editor.getHTML();
          if (html !== '<p></p>' && html !== '') {
            useDocumentStore.getState().updateDocument(documentId, { content: html });
          }
        }
      }
    };
  }, [documentId, editor]);

  useEffect(() => {
    const handleStyleChange = (e: CustomEvent) => {
      updateDocument(documentId, e.detail);
    };
    window.addEventListener('doc-style-change', handleStyleChange as EventListener);
    return () => window.removeEventListener('doc-style-change', handleStyleChange as EventListener);
  }, [documentId, updateDocument]);

  // Dynamically update Tiptap editor class attributes when document style changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const hasStyle = !!(localStyle.backdropColor || localStyle.textColor || localStyle.documentColor);
      editor.setOptions({
        editorProps: {
          attributes: {
            class: cn(
              'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none w-full max-w-full',
              hasStyle
                ? ''
                : 'text-foreground prose-headings:text-foreground hover:prose-a:text-foreground prose-a:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-ol:text-foreground prose-ul:text-foreground prose-p:text-foreground/95'
            ),
            style: hasStyle
              ? `color: ${activeTextColor}; --tw-prose-body: ${activeTextColor}; --tw-prose-headings: ${activeTextColor}; --tw-prose-bold: ${activeTextColor}; --tw-prose-links: ${activeTextColor}; --tw-prose-quotes: ${activeTextColor}; --tw-prose-code: ${activeTextColor};`
              : ''
          }
        }
      });
    }
  }, [editor, localStyle.backdropColor, localStyle.textColor, localStyle.documentColor, activeTextColor]);



  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateDocument(documentId, { title: newTitle });
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      updateDocument(documentId, { tags: newTags });
    }
    setShowTagsDropdown(false);
  };

  const prevDocIdRef = useRef(documentId);

  useEffect(() => {
    if (editor && documentId !== prevDocIdRef.current) {
      // Only set content if the editor's current HTML doesn't match the incoming document's content.
      // This prevents cursor loss when transitioning from a 'new-note' to a saved note while typing.
      if (editor.getHTML() !== (document?.content || '<p></p>') && editor.getHTML() !== (document?.content || '')) {
        setTimeout(() => {
          if (!editor.isDestroyed) {
            editor.commands.setContent(document?.content || '');
          }
        }, 0);
      }
      prevDocIdRef.current = documentId;
    }
  }, [editor, documentId, document?.content]);

  if (!document) return <div className="p-8 text-muted-foreground">Document not found.</div>;



  return (
    <div
      className={cn(
        "w-full overflow-y-auto no-scrollbar flex flex-col relative",
        isMinimized 
          ? "h-[280px] border border-border rounded-xl bg-muted/20 hover:bg-muted/30 hover:border-muted-foreground/20 focus-within:border-rose-500/35 focus-within:bg-background transition-all duration-200" 
          : "h-full",
        hasCustomStyle ? "p-4 sm:p-8 md:p-12 lg:p-16 transition-[padding] duration-300" : ""
      )}
      style={{
        background: localStyle.backdropColor || undefined,
      }}
    >
      {/* If Faded style backdrop is selected, overlay a soft white matte solid layer */}
      {hasCustomStyle && localStyle.backdropStyle === 'faded' && (
        <div className="absolute inset-0 bg-white/85 pointer-events-none z-0" style={{ transition: 'background-color 0.15s ease' }} />
      )}

      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 35 }}
        className={cn(
          "w-full mx-auto font-content flex flex-col shrink-0 z-10",
          hasCustomStyle
            ? "max-w-[950px] p-8 sm:p-12 md:p-16 rounded-[1.5rem] shadow-none relative border border-border min-h-[500px] md:min-h-[calc(100vh-160px)] overflow-hidden transition-[max-width,padding,border-radius,box-shadow] duration-300 ease-out"
            : cn("max-w-[900px] h-full", isMinimized ? "py-4 px-6" : "py-16 px-12")
        )}
        style={{
          background: localStyle.documentColor || (hasCustomStyle ? '#faf8f5' : 'var(--background)'),
          color: activeTextColor,
          fontFamily: localStyle.fontFamily || undefined,
          ['--tw-prose-body' as any]: activeTextColor,
          ['--tw-prose-headings' as any]: activeTextColor,
          ['--tw-prose-links' as any]: activeTextColor,
          ['--tw-prose-bold' as any]: activeTextColor,
          ['--tw-prose-quotes' as any]: activeTextColor,
          ['--tw-prose-code' as any]: activeTextColor,
        }}
      >
        {hasCustomStyle && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        )}

        <div className={cn("relative z-10", isMinimized ? "mb-4 px-2" : "mb-12 px-[54px]")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: activeMutedColor }}>
              <span>{document.type}</span>
              <span>/</span>
              <span>{formatDisplayDate(document.updatedAt, "MMM d, yyyy")}</span>
            </div>

            {documentId.startsWith('daily-note-') && !isDailyNote && (
              <button
                onClick={handleBackToDailyNotes}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm select-none"
                title="Back to Daily Notes view"
              >
                <ArrowsInSimple size={14} />
                <span>Daily Notes</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {hasCustomStyle && (
              <div
                className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 opacity-40 hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                style={{ borderColor: activeTextColor }}
              >
                <div
                  className="w-3 h-3 rounded bg-current"
                  style={{ backgroundColor: activeTextColor }}
                />
              </div>
            )}
            {isDailyNote ? null : (
              <input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled Document"
                className="text-5xl w-full font-medium font-content tracking-tight outline-none border-none bg-transparent pb-4 placeholder:placeholder-opacity-20"
                style={{
                  color: activeTextColor,
                }}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 relative group/tags font-sans">
            {tags.map(tag => {
              const colors = [
                { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.30)", text: "text-rose-700 dark:text-rose-300" },
                { bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.32)", text: "text-amber-800 dark:text-amber-300" },
                { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.30)", text: "text-emerald-700 dark:text-emerald-300" },
                { bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.30)", text: "text-sky-700 dark:text-sky-300" },
                { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.30)", text: "text-purple-700 dark:text-purple-300" },
                { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.30)", text: "text-pink-700 dark:text-pink-300" }
              ];
              let hash = 0;
              for (let i = 0; i < tag.length; i++) {
                hash = tag.charCodeAt(i) + ((hash << 5) - hash);
              }
              const colorSet = colors[Math.abs(hash) % colors.length];
              return (
                <span
                  key={tag}
                  className={cn("flex items-center gap-1 border text-xs px-3 py-1 transition-colors shadow-sm font-medium", colorSet.text)}
                  style={{
                    backgroundColor: colorSet.bg,
                    borderColor: colorSet.border,
                  }}
                >
                  <Tag size={12} weight="fill" className="opacity-60 text-current" />
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = tags.filter(t => t !== tag);
                      setTags(newTags);
                      updateDocument(documentId, { tags: newTags });
                    }}
                    className="ml-1 opacity-45 hover:opacity-100 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              );
            })}
            <div className="relative">
              {tags.length === 0 ? (
                <button
                  onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                  className="flex items-center gap-1 bg-transparent border border-dashed text-xs px-3 py-1 transition-all font-mono"
                  style={{
                    borderColor: hasCustomStyle ? (activeTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : 'var(--border)',
                    color: activeMutedColor
                  }}
                >
                  <Tag size={12} />
                  Add tag
                </button>
              ) : (
                <button
                  onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                  className={cn(
                    "flex items-center justify-center border border-dashed text-xs w-7 h-7 transition-all",
                    showTagsDropdown ? "opacity-100" : "opacity-0 group-hover/tags:opacity-100"
                  )}
                  style={{
                    borderColor: hasCustomStyle ? (activeTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : 'var(--border)',
                    color: activeMutedColor
                  }}
                  title="Add Tag"
                >
                  +
                </button>
              )}
              {showTagsDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border shadow-2xl z-50 overflow-hidden text-sans text-foreground">
                  <div className="max-h-40 overflow-y-auto no-scrollbar">
                    {allExistingTags.filter(t => !tags.includes(t)).length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground/60">No existing tags.</div>
                    )}
                    {allExistingTags.filter(t => !tags.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="w-full text-left px-3 py-2 text-xs text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 box-border border-t border-border bg-muted/50">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Create new tag..."
                      className="w-full bg-transparent px-2 py-1.5 outline-none text-xs text-foreground placeholder:text-muted-foreground/40 border border-transparent focus:border-border transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleAddTag(e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        } else if (e.key === 'Escape') {
                          setShowTagsDropdown(false);
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.relatedTarget) {
                          setShowTagsDropdown(false);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex-1 notemple-editor-wrapper font-content text-lg relative",
            isMinimized ? "px-2" : "px-[54px]"
          )}
          style={{
            color: activeTextColor,
            fontFamily: localStyle.fontFamily || undefined
          }}
        >
          {editor && (
            <BubbleMenu
              editor={editor}
              options={{ placement: 'top' }}
              className="flex items-center gap-1 bg-background border border-border rounded-xl shadow-2xl p-1.5 font-sans"
            >
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("p-1.5 rounded-lg transition-colors", editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextB size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("p-1.5 rounded-lg transition-colors", editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextItalic size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn("p-1.5 rounded-lg transition-colors", editor.isActive('underline') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextAUnderline size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn("p-1.5 rounded-lg transition-colors", editor.isActive('strike') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextStrikethrough size={16} />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn("p-1.5 rounded-lg transition-colors", editor.isActive('code') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <Code size={16} />
              </button>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </motion.div>
    </div>
  );
};
