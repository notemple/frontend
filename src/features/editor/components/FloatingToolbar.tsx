import * as Icons from "@phosphor-icons/react"
import { type LexicalEditor, $getSelection, $isRangeSelection, $createParagraphNode, FORMAT_TEXT_COMMAND, type TextFormatType, FORMAT_ELEMENT_COMMAND, type ElementFormatType } from "lexical"
import { $setBlocksType } from "@lexical/selection"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { $createEquationNode } from "../nodes/EquationNode"
import { useState, useRef, useEffect } from "react"
import type { RefCallback, CSSProperties } from "react"

interface Props {
  editor: LexicalEditor
  menuRef: RefCallback<HTMLDivElement>
  menuStyle: CSSProperties
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  isCode: boolean
  isLink: boolean
  blockType: string
  elementFormat: ElementFormatType
  onClose: () => void
}

const BLOCK_TYPES = [
  { id: "paragraph", label: "Normal Text", icon: "TextT" },
  { id: "h1", label: "Heading 1", icon: "TextHOne" },
  { id: "h2", label: "Heading 2", icon: "TextHTwo" },
  { id: "h3", label: "Heading 3", icon: "TextHThree" },
  { id: "bullet", label: "Bullet List", icon: "ListBullets" },
  { id: "number", label: "Numbered List", icon: "ListNumbers" },
  { id: "check", label: "Todo List", icon: "CheckSquare" },
  { id: "quote", label: "Quote", icon: "Quotes" },
  { id: "code", label: "Code Block", icon: "Code" },
]

export default function FloatingToolbar({
  editor,
  menuRef,
  menuStyle,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  isCode,
  isLink,
  blockType,
  elementFormat,
  onClose,
}: Props) {
  const [showBlockDropdown, setShowBlockDropdown] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus link input when it is shown
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [showLinkInput])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBlockDropdown(false)
      }
    }
    if (showBlockDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBlockDropdown])

  const currentBlock = BLOCK_TYPES.find((t) => t.id === blockType) || BLOCK_TYPES[0]
  const BlockIcon = (Icons as any)[currentBlock.icon] || Icons.TextT

  const setBlock = (type: string) => {
    setShowBlockDropdown(false)
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (type === "paragraph") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          $setBlocksType(selection, () => $createParagraphNode())
        } else if (type === "h1" || type === "h2" || type === "h3") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          $setBlocksType(selection, () => $createHeadingNode(type))
        } else if (type === "quote") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          $setBlocksType(selection, () => $createQuoteNode())
        } else if (type === "code") {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
          $setBlocksType(selection, () => $createCodeNode())
        } else if (type === "bullet") {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        } else if (type === "number") {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        } else if (type === "check") {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
        }
      }
    })
  }

  const handleLinkSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (linkUrl.trim()) {
      let url = linkUrl.trim()
      if (!/^https?:\/\//i.test(url) && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
        url = `https://${url}`
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
    setShowLinkInput(false)
    setLinkUrl("")
  }

  const handleRemoveLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    setShowLinkInput(false)
    setLinkUrl("")
  }

  const insertMath = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent()
        const mathNode = $createEquationNode(text || "f(x) =", true, true)
        selection.insertNodes([mathNode])
      }
    })
  }

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const formats: TextFormatType[] = ["bold", "italic", "underline", "strikethrough", "code"]
        formats.forEach((format) => {
          if (selection.hasFormat(format)) {
            selection.toggleFormat(format)
          }
        })
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
      }
    })
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] flex flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/95 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-200 select-none p-2.5 gap-2 w-[220px]"
      style={menuStyle}
      onMouseDown={(e) => {
        // Prevent loss of focus in Lexical editor
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {showLinkInput ? (
        <form onSubmit={handleLinkSubmit} className="flex items-center gap-1.5 w-full">
          <input
            ref={linkInputRef}
            type="text"
            placeholder="Paste or type URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 bg-[var(--muted)] text-[var(--foreground)] text-xs rounded border border-[var(--border)] px-2 py-1 outline-none min-w-0"
          />
          <button
            type="submit"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors cursor-pointer select-none"
            title="Confirm Link"
          >
            <Icons.Check size={14} weight="bold" />
          </button>
          {isLink && (
            <button
              type="button"
              onClick={handleRemoveLink}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer select-none"
              title="Remove Link"
            >
              <Icons.Trash size={14} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer select-none"
            title="Cancel"
          >
            <Icons.X size={14} weight="bold" />
          </button>
        </form>
      ) : (
        <>
          {/* Row 1: Block Type Selection Dropdown */}
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowBlockDropdown(!showBlockDropdown)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--muted)] hover:bg-[rgba(168,85,247,0.1)] text-[var(--foreground)] transition-colors border border-[var(--border)] cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <BlockIcon size={14} weight="duotone" className="text-purple-400" />
                <span className="truncate">{currentBlock.label}</span>
              </div>
              <Icons.CaretDown size={12} weight="bold" className="opacity-60" />
            </button>

            {showBlockDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[10000] max-h-[220px] overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_4px_16px_rgba(0,0,0,0.4)] py-1">
                {BLOCK_TYPES.map((type) => {
                  const IconComp = (Icons as any)[type.icon] || Icons.TextT
                  const isSelected = type.id === blockType
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBlock(type.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe] font-semibold"
                          : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <IconComp size={14} weight="duotone" className={isSelected ? "text-purple-400" : "opacity-60"} />
                      <span>{type.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="h-[1px] bg-[var(--border)] opacity-60 w-full" />

          {/* Row 2: Formatting controls */}
          <div className="flex items-center justify-between w-full gap-1">
            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isBold
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Bold"
            >
              <Icons.TextB size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isItalic
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Italic"
            >
              <Icons.TextItalic size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isUnderline
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Underline"
            >
              <Icons.TextUnderline size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={clearFormatting}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer select-none"
              title="Clear Formatting"
            >
              <Icons.TextTSlash size={16} weight="bold" />
            </button>
          </div>

          {/* Row 3: Strikethrough, Code, Link, Math */}
          <div className="flex items-center justify-between w-full gap-1">
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isLink
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Insert Link"
            >
              <Icons.Link size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isStrikethrough
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Strikethrough"
            >
              <Icons.TextStrikethrough size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                isCode
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Inline Code"
            >
              <Icons.CodeSimple size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={insertMath}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer select-none"
              title="Inline Math Equation"
            >
              <Icons.MathOperations size={16} weight="bold" />
            </button>
          </div>

          <div className="h-[1px] bg-[var(--border)] opacity-60 w-full" />

          {/* Row 4: Alignment controls */}
          <div className="flex items-center justify-between w-full gap-1">
            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                elementFormat === "left" || elementFormat === "start" || elementFormat === ""
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Align Left"
            >
              <Icons.TextAlignLeft size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                elementFormat === "center"
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Align Center"
            >
              <Icons.TextAlignCenter size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                elementFormat === "right" || elementFormat === "end"
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Align Right"
            >
              <Icons.TextAlignRight size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer select-none ${
                elementFormat === "justify"
                  ? "bg-[rgba(168,85,247,0.15)] border-purple-500/30 text-[#d8b4fe]"
                  : "bg-transparent border-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
              title="Justify"
            >
              <Icons.TextAlignJustify size={16} weight="bold" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
