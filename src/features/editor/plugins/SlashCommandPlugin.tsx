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

  // Open menu when "/" is typed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/") return
      const domSel = window.getSelection()
      if (!domSel || domSel.rangeCount === 0) return

      const range = domSel.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      })
      setQuery("")
      setSelectedIdx(0)
      setOpen(true)
    }

    return editor.registerRootListener((rootEl, prevRootEl) => {
      prevRootEl?.removeEventListener("keydown", handleKeyDown)
      rootEl?.addEventListener("keydown", handleKeyDown)
    })
  }, [editor])

  // Update query + handle keyboard nav while open
  useEffect(() => {
    if (!open) return

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (filtered[selectedIdx]) executeCommand(filtered[selectedIdx])
        return
      }
      if (e.key === "Backspace") {
        setQuery((q) => {
          const next = q.slice(0, -1)
          if (next === "" && q === "") setOpen(false)
          return next
        })
        return
      }
      // Printable characters update the query
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setQuery((q) => q + e.key)
        setSelectedIdx(0)
      }
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => window.removeEventListener("keyup", handleKeyUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered, selectedIdx])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = () => setOpen(false)
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

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
