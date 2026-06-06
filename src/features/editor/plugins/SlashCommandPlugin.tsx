import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import Fuse from "fuse.js"
import { slashCommands, type SlashCommand } from "./slashCommandList"
import SlashCommandMenu from "../components/SlashCommandMenu"

export default function SlashCommandPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [selectedIdx, setSelectedIdx] = useState(0)

  const fuse = useRef(
    new Fuse(slashCommands, {
      keys: ["title", "keywords", "description"],
      threshold: 0.38,
      includeScore: true,
    })
  )

  const filtered: SlashCommand[] = query.trim()
    ? fuse.current.search(query).map((r: { item: SlashCommand }) => r.item)
    : slashCommands

  // Open, position, and filter menu when "/" is typed
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
        
        // Only slice up to the cursor position
        const textBeforeCursor = textContent.slice(0, offset)
        const lastSlashIdx = textBeforeCursor.lastIndexOf("/")

        // Close if no "/" is found in front of the cursor
        if (lastSlashIdx === -1) {
          if (open) setOpen(false)
          return
        }

        // Check if "/" is at the start of the line or preceded by whitespace
        if (lastSlashIdx > 0 && !/\s/.test(textBeforeCursor[lastSlashIdx - 1])) {
          if (open) setOpen(false)
          return
        }

        const queryText = textBeforeCursor.slice(lastSlashIdx + 1)
        
        // If the query contains space or starts with space, or has newlines, close it.
        if (queryText.includes("\n") || queryText.startsWith(" ")) {
          if (open) setOpen(false)
          return
        }

        // Get caret position from the DOM now that "/" is rendered
        const domSelection = window.getSelection()
        if (!domSelection || domSelection.rangeCount === 0) return
        const domRange = domSelection.getRangeAt(0)
        const rect = domRange.getBoundingClientRect()

        const editorEl = editor.getRootElement()
        const editorRect = editorEl?.getBoundingClientRect()

        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left > 0
            ? rect.left + window.scrollX
            : (editorRect?.left ?? 0) + window.scrollX + 96,
        })
        setQuery(queryText)
        setSelectedIdx(0)
        setOpen(true)
      })
    })
  }, [editor, open])

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      setOpen(false)

      // Delete the "/" + query text before executing
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const anchor = sel.anchor.getNode()
        if (!$isTextNode(anchor)) return
        const text = anchor.getTextContent()
        const slashIdx = text.lastIndexOf("/")
        if (slashIdx !== -1) {
          // Replace node text content using spliceText which is available on TextNode
          anchor.spliceText(slashIdx, text.length - slashIdx, "")
        }
      })

      // Run the command after the deletion flushes
      setTimeout(() => command.onSelect(editor), 0)
    },
    [editor]
  )

  // Handle keyboard navigation while open
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => (i + 1) % filtered.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (filtered[selectedIdx]) executeCommand(filtered[selectedIdx])
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, filtered, selectedIdx, executeCommand])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = () => setOpen(false)
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

  if (!open || filtered.length === 0) return null

  return createPortal(
    <SlashCommandMenu
      commands={filtered}
      selectedIdx={selectedIdx}
      position={position}
      onSelect={(cmd) => executeCommand(cmd)}
      onHover={(idx) => setSelectedIdx(idx)}
      onClose={() => setOpen(false)}
    />,
    document.body
  )
}
