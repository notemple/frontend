import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { useEffect, useRef } from "react"
import type { EditorState } from "lexical"
import { $getRoot } from "lexical"
import { db } from "../../../storage/dexie/db"
import { $generateNodesFromDOM } from "@lexical/html"

import { useDocumentStore, getDailyNoteTitle } from "@/features/documents/store"
import { useSettingsStore } from "@/features/settings/store"

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
      const trimmedText = textContent.trim()
      const wordCount = trimmedText.split(/\s+/).filter(Boolean).length

      if (documentId.startsWith("daily-note-")) {
        const { timezone } = useSettingsStore.getState()
        const existingDoc = useDocumentStore.getState().documents[documentId]

        const currentTitle = existingDoc ? existingDoc.title : ""
        const defaultTitle = getDailyNoteTitle(documentId, timezone)

        const hasCharacter = trimmedText.length > 0
        const hasTitle = currentTitle && currentTitle.trim().length > 0 && currentTitle !== defaultTitle

        if (!hasCharacter && !hasTitle) {
          // Remove/delete empty daily note document
          if (existingDoc && !existingDoc.isDeleted) {
            await useDocumentStore.getState().deleteDocument(documentId)
          }
          return
        }

        // Save daily note document
        if (!existingDoc) {
          await useDocumentStore.getState().updateDocument(documentId, {
            lexicalState: serialized,
            contentText: textContent,
            tags: ["notes"],
            folderId: null, // Don't save in folders
          })
        } else {
          await useDocumentStore.getState().updateDocument(documentId, {
            lexicalState: serialized,
            contentText: textContent,
            folderId: null, // Keep in daily notes page only
            isDeleted: false,
            deletedAt: undefined,
          })
        }
      } else {
        // Prevent saving empty states that could corrupt the document
        if (editorState.isEmpty()) return

        const existingDoc = useDocumentStore.getState().documents[documentId]
        if (!existingDoc || existingDoc.isDeleted) return

        if (existingDoc && existingDoc.isUnsaved) {
          await useDocumentStore.getState().updateDocument(documentId, {
            lexicalState: serialized,
            contentText: textContent,
            isUnsaved: false
          })
        } else {
          await useDocumentStore.getState().updateDocument(documentId, {
            lexicalState: serialized,
            contentText: textContent,
          })
        }
      }

      onWordCountChange?.(wordCount)
    }, 500)
  }

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
}
