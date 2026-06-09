import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode, $getNodeByKey } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import EmojiPickerMenu from "../components/EmojiPickerMenu"

export default function EmojiPickerPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, bottom: 0, left: 0 })

  // Track the exact trigger position and offset so insertEmoji can delete precisely
  const triggerRef = useRef<{ nodeKey: string; offset: number; endOffset: number } | null>(null)

  // Open and position menu when ":" is typed
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
          top: rect.top,
          bottom: rect.bottom,
          left: rect.width > 0 ? rect.left : (editorRect?.left ?? 100),
        })

        // Track the trigger position and current cursor position (endOffset)
        triggerRef.current = {
          nodeKey: anchor.key,
          offset: lastColonIdx,
          endOffset: offset,
        }

        setOpen(true)
      })
    })
  }, [editor, open])

  const insertEmoji = useCallback(
    (emojiChar: string) => {
      setOpen(false)

      editor.update(() => {
        const trigger = triggerRef.current
        if (!trigger) return

        const node = $getNodeByKey(trigger.nodeKey)
        if (!$isTextNode(node)) return

        // Delete from ":" symbol to the tracked endOffset and splice emojiChar
        const deleteLen = trigger.endOffset - trigger.offset
        node.spliceText(trigger.offset, deleteLen, emojiChar)

        // Reset the selection inside the text node right after the inserted emoji
        node.select(trigger.offset + emojiChar.length, trigger.offset + emojiChar.length)
      })

      triggerRef.current = null
    },
    [editor]
  )

  // Handle keyboard Escape to close while open
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open])

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
      position={position}
      onSelect={insertEmoji}
    />,
    document.body
  )
}
