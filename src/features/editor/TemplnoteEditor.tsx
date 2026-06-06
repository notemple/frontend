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
import { createEditorConfig } from "./editorConfig"
import SlashCommandPlugin from "./plugins/SlashCommandPlugin"
import PersistencePlugin from "./plugins/PersistencePlugin"
import ScrollIntoViewPlugin from "./plugins/ScrollIntoViewPlugin"
import BlockHandlePlugin from "./plugins/BlockHandlePlugin"

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

export function TemplnoteEditor({
  documentId,
  readOnly = false,
  onWordCountChange,
}: Props) {
  const config = createEditorConfig(documentId)
  const contentEditableRef = useRef<HTMLDivElement>(null)

  return (
    <LexicalComposer initialConfig={{ ...config, editable: !readOnly }}>
      <div className="templnote-editor-wrapper relative flex flex-col w-full h-full overflow-y-auto">
        {/* Centered content column */}
        <div className="editor-scroll-area flex-1 w-full px-6 py-12 flex flex-col items-center">
          {/* Max-width content column — matches Notion's ~720px sweet spot */}
          <div className="editor-content-column w-full max-w-[720px] relative flex flex-col">
            
            {/* Page title area */}
            <div className="editor-title-area mb-8">
              {/* Title is rendered by the parent documents feature,
                  not the editor itself — leave a placeholder comment here */}
            </div>

            {/* The actual Lexical editable area */}
            <div className="editor-container relative flex flex-col flex-1">
              <RichTextPlugin
                contentEditable={
                  <div className="relative block w-full flex-1">
                    <ContentEditable
                      ref={contentEditableRef}
                      className="lexical-root outline-none w-full cursor-text text-[var(--body-text)] min-h-[60vh]"
                      aria-multiline
                      role="textbox"
                      spellCheck
                    />
                  </div>
                }
                placeholder={
                  <div className="absolute top-0 left-0 pointer-events-none select-none text-[var(--muted-foreground)] opacity-40 text-base leading-7">
                    Press '/' for commands…
                  </div>
                }
                ErrorBoundary={SafeErrorBoundary}
              />
            </div>

            {/* Spacer so user can always click below last block to focus */}
            <div
              className="editor-click-target h-40 cursor-text"
              onClick={() => contentEditableRef.current?.focus()}
            />
          </div>
        </div>

        {/* All plugins — outside the visual column, inside the composer */}
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <TablePlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandPlugin />
        <ScrollIntoViewPlugin />
        <BlockHandlePlugin />
        <PersistencePlugin
          documentId={documentId}
          onWordCountChange={onWordCountChange}
        />
      </div>
    </LexicalComposer>
  )
}

export default TemplnoteEditor
