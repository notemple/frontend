import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import { EMOJIS } from "@/shared/lib/emojis"
import EmojiPickerMenu from "../components/EmojiPickerMenu"

export default function EmojiPickerPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Track the exact : position so insertEmoji can delete precisely
  const triggerRef = useRef<{ nodeKey: string; offset: number } | null>(null)

  // Filter emojis based on query
  const filteredEmojis = query.trim()
    ? EMOJIS.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10)
    : EMOJIS.slice(0, 10)

  // Open, position, and filter menu when ":" is typed
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
        const lastColonIdx = textBeforeCursor.lastIndexOf(":")

        // Close if no ":" found before cursor
        if (lastColonIdx === -1) {
          if (open) setOpen(false)
          return
        }

        // Trigger must be preceded by whitespace or at start of node
        const charBefore = lastColonIdx > 0 ? textBeforeCursor[lastColonIdx - 1] : null
        const isValidTrigger = charBefore === null || /\s/.test(charBefore)
        if (!isValidTrigger) {
          if (open) setOpen(false)
          return
        }

        const queryText = textBeforeCursor.slice(lastColonIdx + 1)

        // Close if query contains a space or newline or is too long (user typed normal text, not a shortcode)
        if (queryText.includes(" ") || queryText.includes("\n") || queryText.length > 20) {
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

        // Track the trigger position
        triggerRef.current = {
          nodeKey: anchor.key,
          offset: lastColonIdx,
        }

        setQuery(queryText)
        setOpen(true)
      })
    })
  }, [editor, open])

  const insertEmoji = useCallback(
    (emojiChar: string) => {
      setOpen(false)

      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const anchor = sel.anchor.getNode()
        if (!$isTextNode(anchor)) return

        const colonPos = triggerRef.current?.offset ?? anchor.getTextContent().lastIndexOf(":")
        if (colonPos === -1) return

        // Delete from ":" symbol to the current cursor position
        anchor.spliceText(colonPos, sel.anchor.offset - colonPos, "")

        // Insert the emoji character
        sel.insertText(emojiChar)
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
        setSelectedIdx((i) => (i + 1) % Math.max(filteredEmojis.length, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i - 1 + Math.max(filteredEmojis.length, 1)) % Math.max(filteredEmojis.length, 1))
        return
      }
      if (e.key === "Enter" && filteredEmojis[selectedIdx]) {
        e.preventDefault()
        e.stopPropagation()
        insertEmoji(filteredEmojis[selectedIdx].char)
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, filteredEmojis, selectedIdx, insertEmoji])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = () => setOpen(false)
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

  if (!open) return null

  return createPortal(
    <EmojiPickerMenu
      selectedIdx={selectedIdx}
      position={position}
      emojis={filteredEmojis}
      onSelect={insertEmoji}
      onHover={setSelectedIdx}
    />,
    document.body
  )
}
