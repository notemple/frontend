import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import Fuse from "fuse.js"
import { slashCommands, calloutSubmenuCommands, equationSubmenuCommands, type SlashCommand } from "./slashCommandList"
import SlashCommandMenu, { CATEGORY_ORDER } from "../components/SlashCommandMenu"

export default function SlashCommandPlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [menuMode, setMenuMode] = useState<"main" | "callout" | "equation">("main")
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState({ top: 0, bottom: 0, left: 0 })
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Track the exact slash position so executeCommand can delete precisely
  const slashStartRef = useRef<{ nodeKey: string; offset: number } | null>(null)

  const fuse = useRef(
    new Fuse(slashCommands, {
      keys: ["title", "keywords", "description"],
      threshold: 0.38,
      includeScore: true,
    })
  )

  const activeCommands = menuMode === "callout"
    ? calloutSubmenuCommands
    : menuMode === "equation"
      ? equationSubmenuCommands
      : slashCommands

  const unfiltered: SlashCommand[] = query.trim()
    ? (menuMode === "callout"
        ? calloutSubmenuCommands.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()) ||
            c.keywords.some((k) => k.includes(query.toLowerCase()))
          )
        : menuMode === "equation"
          ? equationSubmenuCommands.filter((c) =>
              c.title.toLowerCase().includes(query.toLowerCase()) ||
              c.keywords.some((k) => k.includes(query.toLowerCase()))
            )
          : fuse.current.search(query).map((r: { item: SlashCommand }) => r.item)
      )
    : activeCommands

  const filtered = menuMode === "callout" || menuMode === "equation"
    ? unfiltered
    : CATEGORY_ORDER.reduce<SlashCommand[]>((acc, cat) => {
        return acc.concat(unfiltered.filter((c) => c.category === cat))
      }, [])

  // Open, position, and filter menu when "/" is typed
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        const handleClose = () => {
          if (open) {
            setOpen(false)
            setMenuMode("main")
          }
        }

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          handleClose()
          return
        }

        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          handleClose()
          return
        }

        const textContent = node.getTextContent()
        const offset = anchor.offset

        // Only look at text before cursor
        const textBeforeCursor = textContent.slice(0, offset)
        const lastSlashIdx = textBeforeCursor.lastIndexOf("/")

        // Close if no "/" found before cursor
        if (lastSlashIdx === -1) {
          handleClose()
          return
        }

        // FIX 2: slash must be at start of node, or preceded by whitespace
        const charBefore = lastSlashIdx > 0 ? textBeforeCursor[lastSlashIdx - 1] : null
        const isValidTrigger = charBefore === null || /\s/.test(charBefore)
        if (!isValidTrigger) {
          handleClose()
          return
        }

        const queryText = textBeforeCursor.slice(lastSlashIdx + 1)

        // Close if query contains a space or newline (user typed prose, not a command)
        if (queryText.includes(" ") || queryText.includes("\n")) {
          handleClose()
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
          left: rect.width > 0
            ? rect.left
            : (editorRect?.left ?? 100),
        })

        // FIX 3: track the slash start for precise deletion
        slashStartRef.current = {
          nodeKey: anchor.key,
          offset: lastSlashIdx,
        }

        setQuery(queryText)
        setSelectedIdx(0)
        setOpen(true)
      })
    })
  }, [editor, open])

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      if (command.submenu && menuMode === "main") {
        if (command.title === "Callout") {
          setMenuMode("callout")
        } else if (command.title === "Math Equation") {
          setMenuMode("equation")
        }
        setQuery("")
        setSelectedIdx(0)
        return
      }

      setOpen(false)
      setMenuMode("main")

      // FIX 3: delete from the tracked slash position to current cursor
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const anchor = sel.anchor.getNode()
        if (!$isTextNode(anchor)) return

        const slashPos = slashStartRef.current?.offset ?? anchor.getTextContent().lastIndexOf("/")
        if (slashPos === -1) return

        // Delete from slash position to current cursor offset
        anchor.spliceText(slashPos, sel.anchor.offset - slashPos, "")
      })

      slashStartRef.current = null
      // Run command synchronously — no setTimeout needed
      command.onSelect(editor)
    },
    [editor, menuMode]
  )

  // Handle keyboard navigation while open
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setMenuMode("main")
        return
      }
      if (e.key === "Backspace" && (menuMode === "callout" || menuMode === "equation") && query === "") {
        e.preventDefault()
        e.stopPropagation()
        setMenuMode("main")
        setSelectedIdx(0)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i + 1) % Math.max(filtered.length, 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIdx((i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        if (filtered[selectedIdx]) executeCommand(filtered[selectedIdx])
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, filtered, selectedIdx, executeCommand, menuMode, query])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = () => {
      setOpen(false)
      setMenuMode("main")
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

  // FIX 6: keep menu open even with 0 results (shows empty state)
  if (!open) return null

  return createPortal(
    <SlashCommandMenu
      commands={filtered}
      selectedIdx={selectedIdx}
      position={position}
      currentQuery={query}
      onSelect={(cmd) => executeCommand(cmd)}
      onHover={(idx) => setSelectedIdx(idx)}
      onClose={() => {
        setOpen(false)
        setMenuMode("main")
      }}
    />,
    document.body
  )
}
