import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode, $createParagraphNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import { $createPageLinkNode } from "../nodes/PageLinkNode"
import { $createTaskNode } from "../nodes/TaskNode"
import MentionMenu from "../components/MentionMenu"

export default function MentionPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [itemsCount, setItemsCount] = useState(0)

  // Track the exact @ position so insertMention can delete precisely
  const atStartRef = useRef<{ nodeKey: string; offset: number } | null>(null)

  // Open, position, and filter menu when "@" is typed
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (open) setOpen(false)
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          if (open) setOpen(false)
          return
        }

        const textContent = node.getTextContent()
        const offset = anchor.offset

        // Only look at text before cursor
        const textBeforeCursor = textContent.slice(0, offset)
        const lastAtIdx = textBeforeCursor.lastIndexOf("@")

        // Close if no "@" found before cursor
        if (lastAtIdx === -1) {
          if (open) setOpen(false)
          return
        }

        // Trigger must be preceded by whitespace or at start of node
        const charBefore = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : null
        const isValidTrigger = charBefore === null || /\s/.test(charBefore)
        if (!isValidTrigger) {
          if (open) setOpen(false)
          return
        }

        const queryText = textBeforeCursor.slice(lastAtIdx + 1)

        // Close if query contains a newline, is too long, or has too many spaces
        if (queryText.includes("\n") || queryText.length > 30 || queryText.split(" ").length > 4) {
          if (open) setOpen(false)
          return
        }

        // Get caret position from the DOM
        const domSelection = window.getSelection()
        if (!domSelection || domSelection.rangeCount === 0) return
        const domRange = domSelection.getRangeAt(0)
        const rect = domRange.getBoundingClientRect()

        const editorEl = editor.getRootElement()
        const editorRect = editorEl?.getBoundingClientRect()

        setPosition({
          top: rect.bottom + 8,
          left: rect.width > 0 ? rect.left : (editorRect?.left ?? 100),
        })

        // Track the at position
        atStartRef.current = {
          nodeKey: anchor.key,
          offset: lastAtIdx,
        }

        setQuery(queryText)
        setOpen(true)
      })
    })
  }, [editor, open])

  const insertMention = useCallback(
    (payload: { type: "doc" | "task" | "date"; id: string; title: string }) => {
      setOpen(false)

      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const anchor = sel.anchor.getNode()
        if (!$isTextNode(anchor)) return

        const atPos = atStartRef.current?.offset ?? anchor.getTextContent().lastIndexOf("@")
        if (atPos === -1) return

        // Delete from "@" symbol to the current cursor position
        anchor.spliceText(atPos, sel.anchor.offset - atPos, "")

        if (payload.type === "task") {
          const topLevelElement = anchor.getTopLevelElementOrThrow()
          const taskNode = $createTaskNode(payload.id)
          topLevelElement.replace(taskNode)

          const paragraphNode = $createParagraphNode()
          taskNode.insertAfter(paragraphNode)
          paragraphNode.select()
        } else {
          // Create and insert PageLinkNode reference
          const mentionNode = $createPageLinkNode(payload.id, payload.title)
          sel.insertNodes([mentionNode])
        }
      })

      atStartRef.current = null
    },
    [editor]
  )

  // Handle keyboard navigation while open
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i + 1) % Math.max(itemsCount, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i - 1 + Math.max(itemsCount, 1)) % Math.max(itemsCount, 1))
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, itemsCount, selectedIdx])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = () => setOpen(false)
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

  if (!open) return null

  return createPortal(
    <MentionMenu
      selectedIdx={selectedIdx}
      position={position}
      currentQuery={query}
      onSelect={insertMention}
      onHover={setSelectedIdx}
      onClose={() => setOpen(false)}
      onItemsChange={setItemsCount}
    />,
    document.body
  )
}
