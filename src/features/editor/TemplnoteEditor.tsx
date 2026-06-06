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
import { createEditorConfig } from "./editorConfig"
import SlashCommandPlugin from "./plugins/SlashCommandPlugin"
import PersistencePlugin from "./plugins/PersistencePlugin"

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

  return (
    <LexicalComposer initialConfig={{ ...config, editable: !readOnly }}>
      <div className="templnote-editor-wrapper relative flex flex-col w-full h-full">
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="
                  lexical-root
                  outline-none w-full cursor-text
                  text-[var(--body-text)]
                  min-h-[420px] px-0 py-0
                "
                aria-multiline
                role="textbox"
                spellCheck
              />
            }
            placeholder={
              <div className="
                absolute top-0 left-0
                text-[var(--muted-foreground)] text-base opacity-55
                pointer-events-none select-none
              ">
                Press '/' for commands…
              </div>
            }
            ErrorBoundary={SafeErrorBoundary}
          />
        </div>

        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <TablePlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandPlugin />
        <PersistencePlugin
          documentId={documentId}
          onWordCountChange={onWordCountChange}
        />
      </div>
    </LexicalComposer>
  )
}

export default TemplnoteEditor
