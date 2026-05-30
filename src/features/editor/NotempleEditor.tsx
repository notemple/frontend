import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ReferenceExtension } from './extensions/ReferenceExtension';
import { MentionSuggestion, renderMentionItems } from './extensions/MentionSuggestion';
import { TagSuggestion, renderTagItems } from './extensions/TagSuggestion';
import { CustomImageExtension } from './extensions/CustomImageExtension';
import { BlockHandle } from './components/BlockHandle';
import { aiService } from '@/services/ai.service';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { CustomTable } from './extensions/table/CustomTable';
import { TableRow, TableHeader, TableCell } from './extensions/table/TableCell';
import { FloatingToolbar } from './extensions/table/FloatingToolbar';
import './extensions/table/styles.css';
import { CustomTodoItem } from './extensions/CustomTodoItem';
import { CustomCodeBlock } from './extensions/CustomCodeBlock';
import { EditorDndContext } from './components/EditorDndContext';
import { DocumentPreviewPopup } from './components/DocumentPreviewPopup';
import { motion } from 'motion/react';
import { SlashCommand, getSuggestionItems, renderItems } from './components/SlashCommand';
import { useDocumentStore, type NoteDocument } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { Tag, TextB, TextItalic, TextStrikethrough, TextAUnderline, Code, ArrowsInSimple, Sparkle, FileText, Smiley, CaretUp, CaretDown } from '@phosphor-icons/react';
import { useSettingsStore } from '@/features/settings/store';
import { toDate } from 'date-fns-tz';
import { cn, getTagStyle } from '@/shared/lib/utils';
import { formatDisplayDate } from '@/shared/lib/time';

const EMPTY_TAGS: string[] = [];

let lastDocumentsTags: any = null;
let lastCreatedTags: any = null;
let cachedAllExistingTags: string[] = [];

const allExistingTagsSelector = (state: any) => {
  if (state.documents === lastDocumentsTags && state.createdTags === lastCreatedTags) {
    return cachedAllExistingTags;
  }
  lastDocumentsTags = state.documents;
  lastCreatedTags = state.createdTags;
  const set = new Set<string>();
  
  // 1. Add user-created tags (from Tags page)
  state.createdTags?.forEach((tag: string) => {
    if (tag && tag.trim()) set.add(tag);
  });

  // 2. Add tags already assigned to documents
  Object.values(state.documents).forEach((doc: any) => {
    doc.tags?.forEach((tag: string) => {
      if (tag && tag.trim()) set.add(tag);
    });
  });

  cachedAllExistingTags = Array.from(set);
  return cachedAllExistingTags;
};

const getBacklinksForDocument = (currentDocId: string, documents: Record<string, NoteDocument>) => {
  const list: { id: string; title: string; excerpt: string; updatedAt: string }[] = [];
  Object.values(documents).forEach(doc => {
    if (doc.id === currentDocId || doc.isDeleted || !doc.content) return;
    
    // Parse references
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(doc.content, 'text/html');
    const hasRef = Array.from(htmlDoc.querySelectorAll('span[data-reference][data-type="document"]'))
      .some(span => span.getAttribute('data-id') === currentDocId);
      
    if (hasRef) {
      // Extract a clean excerpt around the reference or from the beginning
      const cleanText = htmlDoc.body.textContent || '';
      const excerpt = cleanText.length > 140 ? `${cleanText.slice(0, 140).trim()}...` : cleanText.trim();
      list.push({
        id: doc.id,
        title: doc.title || 'Untitled',
        excerpt: excerpt || 'No text preview available.',
        updatedAt: doc.updatedAt
      });
    }
  });
  return list;
};

export const NotempleEditor = React.memo(({ 
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
  const { setActiveTab, openDocument, setSelectedDailyNoteDate } = useUiStore(
    useShallow((state) => ({
      setActiveTab: state.setActiveTab,
      openDocument: state.openDocument,
      setSelectedDailyNoteDate: state.setSelectedDailyNoteDate,
    }))
  );
  const timezone = useSettingsStore(state => state.timezone);

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
  const isInitialized = useDocumentStore(state => state.isInitialized);

  const allExistingTags = useDocumentStore(useShallow(allExistingTagsSelector));
  const tagColors = useDocumentStore(state => state.tagColors) || {};

  const [title, setTitle] = useState(document?.title || '');
  const [tags, setTags] = useState<string[]>(document?.tags || []);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showBacklinks, setShowBacklinks] = useState(false);
  const documents = useDocumentStore(state => state.documents);
  const backlinks = useMemo(() => {
    if (!documentId) return [];
    return getBacklinksForDocument(documentId, documents);
  }, [documentId, documents]);

  useEffect(() => {
    if (!showTagsDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(e.target as Node)) {
        setShowTagsDropdown(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showTagsDropdown]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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
    if (document && isInitialized) {
      if (document.title !== title) {
        setTitle(document.title || '');
      }
      setTags(document.tags || []);
    }
  }, [document?.id, document?.title, title, isInitialized]);

  const extensions = useMemo(() => [
    StarterKit.configure({
      underline: false,
      codeBlock: false,
    }),
    CustomCodeBlock,
    Placeholder.configure({
      placeholder: 'Press "/" for commands, or start typing...',
    }),
    TaskList,
    CustomTodoItem.configure({
      nested: true,
    }),
    CustomImageExtension,
    ReferenceExtension,
    MentionSuggestion.configure({
      suggestion: {
        items: ({ query }) => [query],
        render: renderMentionItems,
      },
    }),
    TagSuggestion.configure({
      suggestion: {
        items: ({ query }) => [query],
        render: renderTagItems,
      },
    }),
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
    CustomTable.configure({
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

  const contentLoadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (editor && document && isInitialized) {
      const currentHTML = editor.getHTML();
      const targetHTML = document.content || '';

      // If we haven't loaded the content for this documentId yet, OR if the documentId changed
      if (contentLoadedForRef.current !== documentId) {
        // Only set content if the editor's current HTML doesn't match the incoming document's content.
        // This prevents cursor loss when transitioning from a 'new-note' to a saved note while typing.
        if (currentHTML !== (targetHTML || '<p></p>') && currentHTML !== (targetHTML || '')) {
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(targetHTML);
            }
          }, 0);
        }
        contentLoadedForRef.current = documentId;
      }
    }
  }, [editor, documentId, document?.content, isInitialized]);

  if (!document) return <div className="p-8 text-muted-foreground">Document not found.</div>;



  return (
    <div
      className={cn(
        "w-full overflow-y-auto no-scrollbar flex flex-col relative",
        isMinimized 
          ? "h-[280px] border border-border rounded-sm-sm bg-muted/20 hover:bg-muted/30 hover:border-muted-foreground/20 focus-within:border-rose-500/35 focus-within:bg-background transition-all duration-200" 
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

      <div
        className={cn(
          "w-full mx-auto font-content flex flex-col shrink-0 z-10",
          hasCustomStyle
            ? "max-w-[950px] p-8 sm:p-12 md:p-16 rounded-sm-sm shadow-sm-none relative border border-border min-h-[500px] md:min-h-[calc(100vh-160px)] overflow-hidden"
            : cn("max-w-[900px] h-full", isMinimized ? "py-4 px-6" : "py-16 px-12")
        )}
        style={{
          background: localStyle.documentColor || (hasCustomStyle ? '#faf8f5' : 'transparent'),
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
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm-sm border border-border bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm-sm select-none"
                title="Back to Daily Notes view"
              >
                <ArrowsInSimple size={14} />
                <span>Daily Notes</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isDailyNote ? null : (
              <div className="relative shrink-0 self-center animate-fade-in" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-12 h-12 rounded-sm-sm border border-transparent hover:border-border flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-muted/30 hover:shadow-sm-sm transition-all cursor-pointer select-none"
                  title={document.icon ? "Change Emoji" : "Add Emoji"}
                >
                  {document.icon ? (
                    <span className="text-[26px] leading-none flex items-center justify-center font-sans">{document.icon}</span>
                  ) : (
                    <Smiley size={24} style={{ color: activeTextColor }} />
                  )}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border shadow-sm-sm z-50 overflow-hidden text-sans text-foreground rounded-sm-sm">
                    <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select Emoji</span>
                      {document.icon && (
                        <button
                          onClick={() => {
                            updateDocument(documentId, { icon: undefined });
                            setShowEmojiPicker(false);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-1 p-2.5 max-h-48 overflow-y-auto no-scrollbar">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
                        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
                        '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
                        '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
                        '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
                        '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
                        '🤗', '🤔', '🫣', '🤭', '🫢', '🫡', '🤫', '🫠', '✍️', '📝',
                        '📚', '💻', '💡', '🚀', '🔥', '⭐️', '🎯', '🎨', '🧠', '💼',
                        '📅', '📌', '❤️', '👍', '🎉', '🌟', '✨', '🌍', '🐱', '🍕'
                      ].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            updateDocument(documentId, { icon: emoji });
                            setShowEmojiPicker(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-muted rounded transition-colors cursor-pointer select-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isDailyNote ? null : (
              <input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled Document"
                className="text-5xl w-full font-medium font-content tracking-tight outline-none border-none bg-transparent placeholder:placeholder-opacity-20 flex-1"
                style={{
                  color: activeTextColor,
                }}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 relative group/tags font-sans">
            {tags.map(tag => {
              const tagStyle = getTagStyle(tag, tagColors);
              return (
                <span
                  key={tag}
                  className="tag-element flex items-center gap-1 border text-xs px-3 py-1 transition-colors shadow-sm-sm font-medium rounded-sm-sm"
                  style={{
                    backgroundColor: 'var(--tag-bg)',
                    borderColor: 'var(--tag-border)',
                    color: 'var(--tag-text)',
                    ...tagStyle
                  }}
                >
                  <Tag size={12} weight="fill" className="opacity-60 text-[color:var(--tag-text)]" />
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = tags.filter(t => t !== tag);
                      setTags(newTags);
                      updateDocument(documentId, { tags: newTags });
                    }}
                    className="ml-1 opacity-45 hover:opacity-100 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    &times;
                  </button>
                </span>
              );
            })}
            <div className="relative" ref={tagsDropdownRef}>
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
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border shadow-sm-sm z-50 overflow-hidden text-sans text-foreground">
                  <div className="max-h-40 overflow-y-auto no-scrollbar p-2.5 flex flex-col gap-1.5">
                    {allExistingTags.filter(t => !tags.includes(t)).length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground/60">No existing tags.</div>
                    )}
                    {allExistingTags.filter(t => !tags.includes(t)).map(tag => {
                      const tagStyle = getTagStyle(tag, tagColors);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="tag-element w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer flex items-center gap-2 border rounded-sm-sm hover:brightness-95 dark:hover:brightness-110 select-none"
                          style={{
                            backgroundColor: 'var(--tag-bg)',
                            color: 'var(--tag-text)',
                            borderColor: 'var(--tag-border)',
                            ...tagStyle
                          }}
                        >
                          <Tag size={12} weight="fill" className="opacity-75 text-[color:var(--tag-text)]" />
                          <span className="font-semibold truncate">{tag}</span>
                        </button>
                      );
                    })}
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
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <EditorDndContext editor={editor!}>
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
            <BlockHandle editor={editor} />
          )}
          {editor && (
            <BubbleMenu
              editor={editor}
              options={{ placement: 'top' }}
              className="flex items-center gap-1 bg-background border border-border rounded-sm-sm shadow-sm-sm p-1.5 font-sans"
            >
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("p-1.5 rounded-sm-sm transition-colors", editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextB size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("p-1.5 rounded-sm-sm transition-colors", editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextItalic size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn("p-1.5 rounded-sm-sm transition-colors", editor.isActive('underline') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextAUnderline size={16} />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn("p-1.5 rounded-sm-sm transition-colors", editor.isActive('strike') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <TextStrikethrough size={16} />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn("p-1.5 rounded-sm-sm transition-colors", editor.isActive('code') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              >
                <Code size={16} />
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={async () => {
                  const { from, to } = editor.state.selection;
                  const selectedText = editor.state.doc.textBetween(from, to, ' ');
                  if (selectedText) {
                    const res = await aiService.rewrite(selectedText, 'improved');
                    if (res.success) {
                      editor.chain().focus().insertContentAt({ from, to }, res.text).run();
                    }
                  }
                }}
                className="p-1.5 rounded-sm-sm transition-colors text-purple-500 hover:bg-purple-500/10 cursor-pointer"
                title="AI Polish selected text"
              >
                <Sparkle size={16} />
              </button>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
          {editor && <FloatingToolbar editor={editor} />}
          <DocumentPreviewPopup />

          {/* Backlinks panel */}
          {!isMinimized && backlinks.length > 0 && (
            <div className="mt-32 pb-8 pt-8 border-t border-border/40 font-sans shrink-0 z-10 relative">
              <button
                onClick={() => setShowBacklinks(!showBacklinks)}
                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer select-none mb-4"
              >
                <FileText size={14} className="opacity-70" />
                <span>Backlinks ({backlinks.length})</span>
                {showBacklinks ? <CaretUp size={14} className="opacity-75" /> : <CaretDown size={14} className="opacity-75" />}
              </button>
              
              {showBacklinks && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  {backlinks.map(link => {
                    const targetDoc = documents[link.id];
                    return (
                      <div
                        key={link.id}
                        onClick={() => openDocument(link.id)}
                        className="group/backlink p-4 rounded-sm-sm border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 shadow-sm-sm"
                      >
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground group-hover/backlink:text-blue-500 transition-colors">
                          {targetDoc?.icon ? (
                            <span className="text-[14px] leading-none shrink-0 font-sans">{targetDoc.icon}</span>
                          ) : (
                            <FileText size={14} className="text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{link.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {link.excerpt}
                        </p>
                        <div className="text-[10px] text-muted-foreground/50 font-mono mt-1">
                          Updated {formatDisplayDate(link.updatedAt, "MMM d, h:mm a")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        </EditorDndContext>
      </div>
    </div>
  );
});
