import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS } from "@lexical/markdown"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, $isParagraphNode, $createParagraphNode } from "lexical"
import { createEditorConfig } from "./editorConfig"
import SlashCommandPlugin from "./plugins/SlashCommandPlugin"
import MentionPlugin from "./plugins/MentionPlugin"
import EmojiPickerPlugin from "./plugins/EmojiPickerPlugin"
import PersistencePlugin from "./plugins/PersistencePlugin"
import ScrollIntoViewPlugin from "./plugins/ScrollIntoViewPlugin"
import BlockHandlePlugin from "./plugins/BlockHandlePlugin"
import BackspacePlugin from "./plugins/BackspacePlugin"
import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin"
import PageLinkPreviewPlugin from "./plugins/PageLinkPreviewPlugin"
import TableHoverActionsPlugin from "./plugins/TableHoverActionsPlugin"
import EmojiPicker from "emoji-picker-react"
import { useDocumentStore } from "../documents/store"
import { ChatCircleText, Plus, Tag, X, Layout } from "@phosphor-icons/react"
import { useState, useEffect, useMemo } from "react"
import { getTagStyle, cn } from "@/shared/lib/utils"
import { useUiStore } from "@/shared/store/uiStore"

// Cast is needed because @lexical/react's RichTextPlugin ErrorBoundary prop type
// is narrower than the actual LexicalErrorBoundary component type in this version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SafeErrorBoundary = LexicalErrorBoundary as unknown as React.ComponentType<any>

interface Props {
  documentId: string
  // Legacy caller props — accepted but not used in the new Lexical implementation.
  // Callers in MainWorkspace, DailyNotesPage, TaskEditorModal still pass these.
  workspaceId?: string
  paneId?: string
  isDailyNote?: boolean
  isMinimized?: boolean
  readOnly?: boolean
  onWordCountChange?: (words: number) => void
  onClosePopup?: () => void
}

function EditorScrollContainer({ children, isMinimized }: { children: React.ReactNode; isMinimized?: boolean }) {
  const [editor] = useLexicalComposerContext()

  const handleScrollAreaClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Check if clicked in empty space below blocks
    const rootEl = editor.getRootElement()
    let isBelowBlocks = false

    if (rootEl) {
      const lastChild = rootEl.lastElementChild
      if (lastChild) {
        const lastChildRect = lastChild.getBoundingClientRect()
        // If click is below the bottom of the last block
        if (e.clientY > lastChildRect.bottom) {
          isBelowBlocks = true
        }
      } else {
        // No blocks exist yet
        isBelowBlocks = true
      }
    }

    // Trigger if clicking on the scroll area (margins), the spacer at the bottom,
    // or the empty space below the last block in the content editable
    if (
      target.classList.contains("editor-scroll-area") ||
      target.classList.contains("editor-click-target") ||
      target.classList.contains("lexical-editor-root") ||
      isBelowBlocks
    ) {
      e.preventDefault()
      e.stopPropagation()
      editor.update(() => {
        const root = $getRoot()
        const lastChild = root.getLastChild()
        
        // If the last child is already an empty paragraph, just select it
        if (lastChild && $isParagraphNode(lastChild) && lastChild.getTextContent() === "") {
          lastChild.select()
          return
        }

        const newParagraph = $createParagraphNode()
        root.append(newParagraph)
        newParagraph.select()
      })
    }
  }

  return (
    <div
      className={cn(
        "editor-scroll-area flex-1 w-full flex flex-col",
        isMinimized ? "items-start" : "items-center"
      )}
      onClick={handleScrollAreaClick}
    >
      {children}
    </div>
  )
}

export function TemplnoteEditor({
  documentId,
  readOnly = false,
  onWordCountChange,
  paneId,
  onClosePopup,
  isMinimized = false,
}: Props) {
  const config = createEditorConfig(documentId)
  const isRightSidebarOpen = useUiStore(state => state.isRightSidebarOpen)
  const toggleRightSidebar = useUiStore(state => state.toggleRightSidebar)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  
  const doc = useDocumentStore(state => state.documents[documentId])
  const updateDocument = useDocumentStore(state => state.updateDocument)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)

  const createdTags = useDocumentStore(state => state.createdTags || [])
  const createTag = useDocumentStore(state => state.createTag)
  const tagColors = useDocumentStore(state => state.tagColors || {})

  useEffect(() => {
    setIsEmojiPickerOpen(false)
    setIsTagPopoverOpen(false)
  }, [documentId])

  useEffect(() => {
    return () => {
      if (documentId) {
        // Only clean up if the document is no longer the active tab of any pane
        const activePanes = useUiStore.getState().panes;
        const isActive = activePanes.some(pane => pane.activeTabId === documentId);
        if (isActive) {
          return;
        }

        const doc = useDocumentStore.getState().documents[documentId];
        if (doc && doc.isUnsaved) {
          useDocumentStore.getState().permanentlyDeleteDocument(documentId);
          useUiStore.getState().closeDocument(documentId);
        }
      }
    };
  }, [documentId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false)
      }
    }
    if (isEmojiPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEmojiPickerOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsTagPopoverOpen(false)
      }
    }
    if (isTagPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isTagPopoverOpen])

  const filteredSuggestions = useMemo(() => {
    const currentTags = doc?.tags || []
    const query = tagSearchQuery.trim().toLowerCase()
    return createdTags.filter(tag => {
      const isAlreadyAdded = currentTags.includes(tag)
      const matchesQuery = tag.toLowerCase().includes(query)
      return !isAlreadyAdded && matchesQuery
    })
  }, [createdTags, doc?.tags, tagSearchQuery])

  const wrapperStyle: React.CSSProperties = {};
  if (doc?.backdropType && doc.backdropType !== 'none' && doc.backdropColor) {
    wrapperStyle.background = doc.backdropColor;
  }

  const bannerStyle: React.CSSProperties = {};
  if (doc?.topSectionColor) {
    bannerStyle.background = doc.topSectionColor;
  } else {
    bannerStyle.background = 'var(--background)';
  }

  const resolvedFontFamily = doc?.fontFamily === 'sans' ? 'var(--font-sans)' :
                             doc?.fontFamily === 'serif' ? 'var(--font-serif)' :
                             doc?.fontFamily === 'sans-serif' ? 'var(--font-sans)' :
                             doc?.fontFamily === 'monospace' ? 'var(--font-mono)' :
                             undefined;

  const titleStyle: React.CSSProperties = {};
  if (doc?.topSectionTextColor) {
    titleStyle.color = doc.topSectionTextColor;
  } else {
    titleStyle.color = 'var(--foreground)';
  }
  if (resolvedFontFamily) {
    titleStyle.fontFamily = resolvedFontFamily;
  }

  let resolvedTextColor: string | undefined = undefined;
  if (doc?.linkBackdropToCover) {
    resolvedTextColor = doc?.topSectionTextColor;
  } else {
    resolvedTextColor = doc?.textColor;
  }

  const editorTextStyle: React.CSSProperties = {};
  if (resolvedTextColor) {
    editorTextStyle.color = resolvedTextColor;
    (editorTextStyle as any)['--body-text'] = resolvedTextColor;
    (editorTextStyle as any)['--foreground'] = resolvedTextColor;
  }
  if (resolvedFontFamily) {
    editorTextStyle.fontFamily = resolvedFontFamily;
  }

  // Formatting styles mapping
  const resolvedBaseFontSize = doc?.fontSize === 'small' ? '14px' :
                               doc?.fontSize === 'large' ? '18px' :
                               '16px'; // default
  (editorTextStyle as any)['--editor-base-size'] = resolvedBaseFontSize;

  const resolvedLineHeightParagraph = doc?.lineHeight === 'compact' ? '1.5' :
                                      doc?.lineHeight === 'loose' ? '2.25' :
                                      '1.95'; // default
  const resolvedLineHeightRoot = doc?.lineHeight === 'compact' ? '1.4' :
                                 doc?.lineHeight === 'loose' ? '2.0' :
                                 '1.7'; // default
  const resolvedLineHeightList = doc?.lineHeight === 'compact' ? '1.45' :
                                 doc?.lineHeight === 'loose' ? '1.95' :
                                 '1.65'; // default

  (editorTextStyle as any)['--editor-line-height-paragraph'] = resolvedLineHeightParagraph;
  (editorTextStyle as any)['--editor-line-height-root'] = resolvedLineHeightRoot;
  (editorTextStyle as any)['--editor-line-height-list'] = resolvedLineHeightList;

  // Page Width
  (editorTextStyle as any)['--editor-max-width'] = doc?.pageWidth === 'wide' ? '90%' : '720px';
  const maxWidthClass = doc?.pageWidth === 'wide' ? 'max-w-[90%]' : 'max-w-[720px]';

  return (
    <LexicalComposer initialConfig={{ ...config, editable: !readOnly }}>
      <div 
        className={cn(
          "templnote-editor-wrapper relative flex flex-col w-full h-full overflow-y-auto",
          isMinimized && "is-minimized-editor"
        )}
        style={wrapperStyle}
      >
        {onClosePopup && (
          <button
            type="button"
            onClick={onClosePopup}
            className="absolute top-4 right-6 z-50 p-2 rounded-sm border border-border/80 bg-muted/65 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-muted/90 hover:scale-[1.05] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider select-none"
            title="Minimize"
          >
            <X size={11} weight="bold" />
            Minimize
          </button>
        )}
        <EditorScrollContainer isMinimized={isMinimized}>
          {/* Banner with gradient background */}
          {!isMinimized && (
            <div 
              className="w-full min-h-[11rem] py-6 shrink-0 relative flex items-center justify-center" 
              style={bannerStyle}
              contentEditable={false}
            >
              <div className={cn("flex flex-col items-start justify-center gap-3 w-full pl-4 pr-4 md:pl-0 md:pr-6 z-10 group/titlearea", maxWidthClass)}>
                {/* Emoji Button */}
                <div ref={pickerRef} className="relative z-50">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="w-16 h-16 flex items-center justify-start text-6xl hover:scale-105 transition-all cursor-pointer select-none bg-transparent border-none outline-none relative"
                  >
                    {doc?.icon ? (
                      doc.icon
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors bg-current/10"
                        style={{
                          borderColor: doc?.topSectionTextColor ? `${doc.topSectionTextColor}99` : 'var(--border)',
                          color: doc?.topSectionTextColor || 'var(--foreground)'
                        }}
                      >
                        <Plus size={18} weight="bold" />
                      </div>
                    )}
                  </button>
   
                  {isEmojiPickerOpen && (
                    <div 
                      className="absolute top-18 left-0 z-50 rounded-lg shadow-xl bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {doc?.icon && (
                        <button
                          type="button"
                          onClick={() => {
                            updateDocument(documentId, { icon: "" })
                            setIsEmojiPickerOpen(false)
                          }}
                          className="w-full py-1.5 px-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors text-center cursor-pointer select-none border border-red-200/50 dark:border-red-900/35"
                        >
                          Remove Emoji
                        </button>
                      )}
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          updateDocument(documentId, { icon: emojiData.emoji })
                          setIsEmojiPickerOpen(false)
                        }}
                        theme={
                          document.documentElement.classList.contains("dark")
                            ? "dark" as any
                            : "light" as any
                        }
                      />
                    </div>
                  )}
                </div>
   
                {/* Title and Tags container */}
                <div className="w-full flex flex-col gap-2 min-w-0">
                  {/* Page Title Input */}
                  <input
                    type="text"
                    placeholder="Untitled"
                    value={doc?.title ?? ""}
                    onChange={(e) => updateDocument(documentId, { title: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-4xl font-bold font-sans tracking-tight drop-shadow-md placeholder-current placeholder-opacity-50"
                    style={titleStyle}
                  />

                  {/* Tags Section */}
                  {(!readOnly || (doc?.tags && doc.tags.length > 0)) && (
                    <div 
                      className="flex flex-wrap items-center gap-1.5 text-sm font-sans select-none" 
                      contentEditable={false}
                    >
                      <Tag 
                        size={16} 
                        className="mr-1 opacity-70 shrink-0" 
                        style={{ color: doc?.topSectionTextColor || 'var(--muted-foreground)' }} 
                      />
                      
                      {doc?.tags && doc.tags.length > 0 ? (
                        doc.tags.map(tag => {
                          const tagStyle = getTagStyle(tag, tagColors);
                          return (
                            <span
                              key={tag}
                              className="tag-element flex items-center gap-1 border text-xs px-2 py-0.5 transition-colors font-medium rounded-sm-sm group/tag relative"
                              style={{
                                backgroundColor: 'var(--tag-bg)',
                                borderColor: 'var(--tag-border)',
                                color: 'var(--tag-text)',
                                ...tagStyle
                              }}
                            >
                              <span>{tag}</span>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTags = (doc.tags || []).filter(t => t !== tag);
                                    updateDocument(documentId, { tags: newTags });
                                  }}
                                  className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X size={10} weight="bold" />
                                </button>
                              )}
                            </span>
                          )
                        })
                      ) : (
                        <span 
                          className="text-xs italic font-normal mr-2 opacity-60"
                          style={{ color: doc?.topSectionTextColor || 'var(--muted-foreground)' }}
                        >
                          No tags
                        </span>
                      )}

                      {/* Add Tag Popover */}
                      {!readOnly && (
                        <div ref={popoverRef} className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsTagPopoverOpen(!isTagPopoverOpen);
                              setTagSearchQuery("");
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 border border-dashed rounded-sm text-xs transition-colors cursor-pointer opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-black/30"
                            style={{
                              color: doc?.topSectionTextColor || 'var(--muted-foreground)',
                              borderColor: doc?.topSectionTextColor ? `${doc.topSectionTextColor}66` : 'var(--border)'
                            }}
                          >
                            <Plus size={12} weight="bold" />
                            <span>Add Tag</span>
                          </button>

                          {isTagPopoverOpen && (
                            <div 
                              className="absolute top-7 left-0 z-50 w-64 rounded-lg shadow-xl bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search or create tag..."
                                value={tagSearchQuery}
                                onChange={(e) => setTagSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const trimmed = tagSearchQuery.trim();
                                    if (trimmed) {
                                      if (!createdTags.includes(trimmed)) {
                                        createTag(trimmed);
                                      }
                                      const currentTags = doc?.tags || [];
                                      if (!currentTags.includes(trimmed)) {
                                        updateDocument(documentId, { tags: [...currentTags, trimmed] });
                                      }
                                      setTagSearchQuery("");
                                      setIsTagPopoverOpen(false);
                                    }
                                  } else if (e.key === "Escape") {
                                    setIsTagPopoverOpen(false);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded outline-none focus:border-purple-500 dark:focus:border-purple-400 text-foreground placeholder-muted-foreground/60"
                              />

                              <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">
                                {filteredSuggestions.map((tag) => {
                                  const tagStyle = getTagStyle(tag, tagColors);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => {
                                        const currentTags = doc?.tags || [];
                                        if (!currentTags.includes(tag)) {
                                          updateDocument(documentId, { tags: [...currentTags, tag] });
                                        }
                                        setTagSearchQuery("");
                                        setIsTagPopoverOpen(false);
                                      }}
                                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between group/item cursor-pointer text-foreground"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span 
                                          className="w-2.5 h-2.5 rounded-full border tag-element" 
                                          style={{ 
                                            backgroundColor: 'var(--tag-bg)', 
                                            borderColor: 'var(--tag-border)',
                                            ...tagStyle 
                                          }} 
                                        />
                                        <span>{tag}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity">Select</span>
                                    </button>
                                  );
                                })}

                                {tagSearchQuery.trim() && !createdTags.includes(tagSearchQuery.trim()) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const trimmed = tagSearchQuery.trim();
                                      createTag(trimmed);
                                      const currentTags = doc?.tags || [];
                                      if (!currentTags.includes(trimmed)) {
                                        updateDocument(documentId, { tags: [...currentTags, trimmed] });
                                      }
                                      setTagSearchQuery("");
                                      setIsTagPopoverOpen(false);
                                    }}
                                    className="w-full text-left px-2 py-2 text-xs rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 font-medium flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Plus size={12} weight="bold" />
                                    <span>Create &quot;{tagSearchQuery.trim()}&quot;</span>
                                  </button>
                                )}

                                {filteredSuggestions.length === 0 && !tagSearchQuery.trim() && (
                                  <div className="px-2 py-3 text-xs text-muted-foreground/60 text-center italic">
                                    No other tags available
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div 
            className={cn(
              "editor-content-column w-full relative flex flex-col pb-12 pt-4",
              isMinimized ? "px-0 max-w-none" : cn("px-6 md:px-8", maxWidthClass)
            )}
            style={editorTextStyle}
          >
            {/* The actual Lexical editable area */}
            <div className="editor-container relative flex flex-col flex-1">
              <RichTextPlugin
                contentEditable={
                  <div className="relative block w-full flex-1">
                    <ContentEditable
                      ref={contentEditableRef}
                      className={cn(
                        "lexical-root lexical-editor-root outline-none w-full cursor-text text-[var(--body-text)]",
                        isMinimized ? "min-h-[150px]" : "min-h-[60vh]"
                      )}
                      aria-multiline
                      role="textbox"
                      spellCheck
                    />
                  </div>
                }
                 placeholder={
                  <div 
                    className="absolute top-4 left-0.5 pointer-events-none select-none text-[var(--muted-foreground)] opacity-40 font-sans flex items-center"
                    style={{
                      height: 'calc(var(--editor-base-size, 16px) * 1.1875 * var(--editor-line-height-paragraph, 1.95))',
                      fontSize: 'calc(var(--editor-base-size, 16px) * 1.1875)',
                      lineHeight: '1',
                      ...(resolvedFontFamily ? { fontFamily: resolvedFontFamily } : {})
                    }}
                  >
                    press '/' or '@' for commands or 'tab' for ai
                  </div>
                }
                ErrorBoundary={SafeErrorBoundary}
              />
            </div>

            {/* Spacer so user can always click below last block */}
            <div className={cn("editor-click-target cursor-text", isMinimized ? "h-10" : "h-40")} />
          </div>
        </EditorScrollContainer>

        {/* All plugins — outside the visual column, inside the composer */}
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <TablePlugin hasCellBackgroundColor={true} hasHorizontalScroll={true} />
        <TableHoverActionsPlugin documentId={documentId} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandPlugin />
        <MentionPlugin />
        <EmojiPickerPlugin />
        <ScrollIntoViewPlugin />
        <BlockHandlePlugin />
        <BackspacePlugin />
        <FloatingToolbarPlugin />
        <PageLinkPreviewPlugin paneId={paneId} />
        <PersistencePlugin
          documentId={documentId}
          onWordCountChange={onWordCountChange}
        />
      </div>
    </LexicalComposer>
  )
}

export default TemplnoteEditor
