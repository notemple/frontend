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
import PersistencePlugin from "./plugins/PersistencePlugin"
import ScrollIntoViewPlugin from "./plugins/ScrollIntoViewPlugin"
import BlockHandlePlugin from "./plugins/BlockHandlePlugin"
import BackspacePlugin from "./plugins/BackspacePlugin"
import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin"

import EmojiPicker from "emoji-picker-react"
import { useDocumentStore } from "../documents/store"
import { ChatCircleText, Plus } from "@phosphor-icons/react"
import { useState, useEffect } from "react"

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

function EditorScrollContainer({ children }: { children: React.ReactNode }) {
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
      className="editor-scroll-area flex-1 w-full flex flex-col items-center"
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
}: Props) {
  const config = createEditorConfig(documentId)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  
  const doc = useDocumentStore(state => state.documents[documentId])
  const updateDocument = useDocumentStore(state => state.updateDocument)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsEmojiPickerOpen(false)
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

  const wrapperStyle: React.CSSProperties = {};
  if (doc?.backdropType && doc.backdropType !== 'none' && doc.backdropColor) {
    wrapperStyle.background = doc.backdropColor;
  }

  const bannerStyle: React.CSSProperties = {};
  if (doc?.topSectionColor) {
    bannerStyle.background = doc.topSectionColor;
  } else {
    bannerStyle.background = 'linear-gradient(to right, #2a4e6c, #527d97, #b8c5cc)';
  }

  const titleStyle: React.CSSProperties = {};
  if (doc?.topSectionTextColor) {
    titleStyle.color = doc.topSectionTextColor;
  } else {
    titleStyle.color = '#ffffff';
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

  return (
    <LexicalComposer initialConfig={{ ...config, editable: !readOnly }}>
      <div 
        className="templnote-editor-wrapper relative flex flex-col w-full h-full overflow-y-auto"
        style={wrapperStyle}
      >
        <EditorScrollContainer>
          {/* Banner with gradient background */}
          <div 
            className="w-full h-44 shrink-0 relative flex items-center justify-center" 
            style={bannerStyle}
            contentEditable={false}
          >
            <div className="flex flex-row items-center justify-center gap-4 w-full max-w-[720px] px-6 md:px-8 z-10 group/titlearea">
              {/* Emoji Button */}
              <div ref={pickerRef} className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  className="w-16 h-16 flex items-center justify-center text-6xl hover:scale-105 transition-all cursor-pointer select-none bg-transparent border-none outline-none relative"
                >
                  {doc?.icon ? (
                    doc.icon
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors bg-current/10"
                      style={{
                        borderColor: doc?.topSectionTextColor ? `${doc.topSectionTextColor}99` : 'rgba(255, 255, 255, 0.6)',
                        color: doc?.topSectionTextColor || '#ffffff'
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
 
              {/* Page Title Input */}
              <input
                type="text"
                placeholder="Untitled"
                value={doc?.title ?? ""}
                onChange={(e) => updateDocument(documentId, { title: e.target.value })}
                className="flex-1 bg-transparent border-none outline-none text-4xl font-bold font-sans tracking-tight drop-shadow-md min-w-0 placeholder-current placeholder-opacity-50"
                style={titleStyle}
              />
            </div>
          </div>

          <div 
            className="editor-content-column w-full max-w-[720px] px-6 md:px-8 relative flex flex-col pb-12 pt-4"
            style={editorTextStyle}
          >

            {/* The actual Lexical editable area */}
            <div className="editor-container relative flex flex-col flex-1">
              <RichTextPlugin
                contentEditable={
                  <div className="relative block w-full flex-1">
                    <ContentEditable
                      ref={contentEditableRef}
                      className="lexical-root lexical-editor-root outline-none w-full cursor-text text-[var(--body-text)] min-h-[60vh]"
                      aria-multiline
                      role="textbox"
                      spellCheck
                    />
                  </div>
                }
                placeholder={
                  <div className="absolute top-0 left-14 pointer-events-none select-none text-[var(--muted-foreground)] opacity-40 text-base leading-7">
                    Press '/' for commands…
                  </div>
                }
                ErrorBoundary={SafeErrorBoundary}
              />
            </div>

            {/* Spacer so user can always click below last block */}
            <div className="editor-click-target h-40 cursor-text" />
          </div>
        </EditorScrollContainer>

        {/* All plugins — outside the visual column, inside the composer */}
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <TablePlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandPlugin />
        <MentionPlugin />
        <ScrollIntoViewPlugin />
        <BlockHandlePlugin />
        <BackspacePlugin />
        <FloatingToolbarPlugin />
        <PersistencePlugin
          documentId={documentId}
          onWordCountChange={onWordCountChange}
        />
      </div>
    </LexicalComposer>
  )
}

export default TemplnoteEditor
