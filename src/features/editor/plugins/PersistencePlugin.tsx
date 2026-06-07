import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useEffect, useRef } from "react"
import type { EditorState } from "lexical"
import { $getRoot } from "lexical"
import { db } from "../../../storage/dexie/db"
import { $generateNodesFromDOM } from "@lexical/html"

interface Props {
  documentId: string
  onWordCountChange?: (words: number) => void
}

export default function PersistencePlugin({ documentId, onWordCountChange }: Props) {
  const [editor] = useLexicalComposerContext()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hydratedRef = useRef(false)

  // Restore saved state from Dexie on mount
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    db.documents.get(documentId).then((doc) => {
      if (!doc) return
      
      if (doc.lexicalState) {
        try {
          const parsed = editor.parseEditorState(doc.lexicalState)
          if (parsed.isEmpty()) {
            console.warn("[PersistencePlugin] Parsed state is empty. Ignoring.")
            return
          }
          // setEditorState must be called outside of editor.update()
          queueMicrotask(() => editor.setEditorState(parsed))
        } catch (err) {
          console.warn("[PersistencePlugin] Failed to restore state:", err)
        }
      } else if (doc.content) {
        // Fallback: Convert raw HTML content to Lexical nodes on first load
        try {
          const parser = new DOMParser()
          const dom = parser.parseFromString(doc.content, "text/html")
          editor.update(() => {
            const nodes = $generateNodesFromDOM(editor, dom)
            const root = $getRoot()
            root.clear()
            root.append(...nodes)
          })
        } catch (err) {
          console.warn("[PersistencePlugin] Failed to parse HTML content fallback:", err)
        }
      }
    })
  }, [documentId, editor])

  const handleChange = (editorState: EditorState) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const serialized = JSON.stringify(editorState.toJSON())
      const textContent = editorState.read(() => $getRoot().getTextContent())
      const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length

      // Prevent saving empty states that could corrupt the document
      if (editorState.isEmpty()) return

      await db.documents.update(documentId, {
        lexicalState: serialized,
        contentText: textContent,
        updatedAt: String(Date.now()),
      })

      onWordCountChange?.(wordCount)
    }, 500)
  }

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
}
