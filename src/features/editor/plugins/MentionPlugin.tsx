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
  const [position, setPosition] = useState({ top: 0, bottom: 0, left: 0 })
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [itemsCount, setItemsCount] = useState(0)
  const [triggerType, setTriggerType] = useState<"mention" | "doc-only">("mention")

  // Track the exact position and trigger type so insertMention can delete precisely
  const triggerRef = useRef<{ nodeKey: string; offset: number; type: "mention" | "doc-only" } | null>(null)

  // Open, position, and filter menu when "@" or "[[" is typed
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
        const lastDoubleBracketIdx = textBeforeCursor.lastIndexOf("[[")

        let triggerIndex = -1
        let type: "mention" | "doc-only" = "mention"

        if (lastAtIdx !== -1 && lastAtIdx > lastDoubleBracketIdx) {
          triggerIndex = lastAtIdx
          type = "mention"
        } else if (lastDoubleBracketIdx !== -1) {
          triggerIndex = lastDoubleBracketIdx
          type = "doc-only"
        }

        // Close if no trigger found before cursor
        if (triggerIndex === -1) {
          if (open) setOpen(false)
          return
        }

        // Trigger must be preceded by whitespace or at start of node
        const charBefore = triggerIndex > 0 ? textBeforeCursor[triggerIndex - 1] : null
        const isValidTrigger = charBefore === null || /\s/.test(charBefore)
        if (!isValidTrigger) {
          if (open) setOpen(false)
          return
        }

        const triggerLen = type === "mention" ? 1 : 2
        const queryText = textBeforeCursor.slice(triggerIndex + triggerLen)

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
          top: rect.top,
          bottom: rect.bottom,
          left: rect.width > 0 ? rect.left : (editorRect?.left ?? 100),
        })

        // Track the trigger position
        triggerRef.current = {
          nodeKey: anchor.key,
          offset: triggerIndex,
          type,
        }

        setTriggerType(type)
        setQuery(queryText)
        setOpen(true)
      })
    })
  }, [editor, open])

  const insertMention = useCallback(
    (payload: { type: "doc" | "task" | "date" | "collection-item"; id: string; title: string }) => {
      setOpen(false)

      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const anchor = sel.anchor.getNode()
        if (!$isTextNode(anchor)) return

        const currentType = triggerRef.current?.type ?? "mention"
        const triggerStr = currentType === "mention" ? "@" : "[["
        const atPos = triggerRef.current?.offset ?? anchor.getTextContent().lastIndexOf(triggerStr)
        if (atPos === -1) return

        // Delete trigger symbol to the current cursor position
        anchor.spliceText(atPos, sel.anchor.offset - atPos, "")

        if (payload.type === "task") {
          const topLevelElement = anchor.getTopLevelElementOrThrow()
          const taskNode = $createTaskNode(payload.id)

          const paragraphNode = $createParagraphNode()
          topLevelElement.insertAfter(paragraphNode)
          paragraphNode.select()

          topLevelElement.replace(taskNode)
        } else {
          // Create and insert PageLinkNode reference
          const mentionNode = $createPageLinkNode(payload.id, payload.title)
          sel.insertNodes([mentionNode])
        }
      })

      triggerRef.current = null
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
      triggerType={triggerType}
    />,
    document.body
  )
}
