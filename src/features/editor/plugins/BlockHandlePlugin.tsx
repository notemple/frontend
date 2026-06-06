import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect, useRef, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  $getNodeByKey,
  $createParagraphNode,
  $isElementNode,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $parseSerializedNode,
  $getNearestNodeFromDOMNode,
  $isRootNode,
  type LexicalNode,
  ElementNode,
} from "lexical"
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { ColorPicker } from '../../../shared/ui/ColorPicker';
// ─── Types ────────────────────────────────────────────────────────────────────

// --- MONKEY PATCH FOR ELEMENT NODE STYLES ---
// Lexical's ElementNode does not serialize `__style` by default.
// We patch it here globally so that block background colors are permanent.
if (!('__patchedElementNode' in ElementNode.prototype)) {
  Object.defineProperty(ElementNode.prototype, '__patchedElementNode', { value: true, enumerable: false });

  const originalExportJSON = ElementNode.prototype.exportJSON;
  ElementNode.prototype.exportJSON = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = originalExportJSON.call(this) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any).__style) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      json.style = (this as any).__style;
    }
    return json;
  };

  const originalUpdateFromJSON = ElementNode.prototype.updateFromJSON;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ElementNode.prototype.updateFromJSON = function (serializedNode: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = originalUpdateFromJSON.call(this, serializedNode) as any;
    if (serializedNode.style) {
      node.setStyle(serializedNode.style);
    }
    return node;
  };
}
// --------------------------------------------

interface HandleState {
  top: number
  left: number
  nodeKey: string
}

type TurnIntoType = "paragraph" | "h1" | "h2" | "h3" | "h4" | "bullet" | "number" | "quote"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="block-handle-tooltip"
      role="tooltip"
    >
      {children}
    </div>
  )
}

// ─── AddButton ────────────────────────────────────────────────────────────────

function AddButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="block-handle-btn-wrapper" style={{ position: "relative" }}>
      <button
        id="block-handle-add"
        className="block-handle-btn"
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Add block (Alt-Click to add above)"
        tabIndex={-1}
      >
        {/* Plus icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1.75V12.25M1.75 7H12.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
      {showTooltip && (
        <Tooltip>
          <span>Click to add below, Alt+Click to add above</span>
        </Tooltip>
      )}
    </div>
  )
}

// ─── DragHandle Button ────────────────────────────────────────────────────────

function DragHandleButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="block-handle-btn-wrapper" style={{ position: "relative" }}>
      <button
        id="block-handle-drag"
        className="block-handle-btn"
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Block options"
        aria-haspopup="menu"
        tabIndex={-1}
      >
        {/* Six-dot grid */}
        <svg width="10" height="15" viewBox="0 0 10 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="2" cy="2.5" r="1.5" fill="currentColor" />
          <circle cx="2" cy="7.5" r="1.5" fill="currentColor" />
          <circle cx="2" cy="12.5" r="1.5" fill="currentColor" />
          <circle cx="8" cy="2.5" r="1.5" fill="currentColor" />
          <circle cx="8" cy="7.5" r="1.5" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {showTooltip && (
        <Tooltip>
          <span>Click for options</span>
          <span className="block-handle-tooltip-hint">Drag to reorder</span>
        </Tooltip>
      )}
    </div>
  )
}

// ─── Color Palette ────────────────────────────────────────────────────────────

const COLORS = [
  { label: "Default", value: "default", bg: "transparent", text: "var(--foreground)" },
  { label: "Gray", value: "gray", bg: "#6b7280", text: "#fff" },
  { label: "Brown", value: "brown", bg: "#92400e", text: "#fff" },
  { label: "Orange", value: "orange", bg: "#f97316", text: "#fff" },
  { label: "Yellow", value: "yellow", bg: "#eab308", text: "#000" },
  { label: "Green", value: "green", bg: "#22c55e", text: "#000" },
  { label: "Blue", value: "blue", bg: "#3b82f6", text: "#fff" },
  { label: "Purple", value: "purple", bg: "#a855f7", text: "#fff" },
  { label: "Pink", value: "pink", bg: "#ec4899", text: "#fff" },
  { label: "Red", value: "red", bg: "#ef4444", text: "#fff" },
]

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface MenuProps {
  position: { top: number; left: number }
  nodeKey: string
  onClose: () => void
  onDuplicate: () => void
  onDelete: () => void
  onTurnInto: (type: TurnIntoType) => void
  onCopyLink: () => void
  onMoveToTop: () => void
  onMoveToBottom: () => void
  lastEdited: Date
  selectedColor: string
  onColorSelect: (color: string) => void
}

function BlockContextMenu({
  position,
  nodeKey,
  onClose,
  onDuplicate,
  onDelete,
  onTurnInto,
  onCopyLink,
  onMoveToTop,
  onMoveToBottom,
  lastEdited,
  selectedColor,
  onColorSelect,
}: MenuProps) {
  const [editor] = useLexicalComposerContext()
  const [search, setSearch] = useState("")
  const [turnIntoOpen, setTurnIntoOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Auto-focus search
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("mousedown", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [onClose])

  // Sync selectedColor when colorOpen changes
  useEffect(() => {
    if (colorOpen && nodeKey) {
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if (node && $isElementNode(node)) {
          const style = node.getStyle();
          const match = style.match(/background:\s*([^;]+)/i);
          let currentBg = match ? match[1].trim() : "transparent";
          const matchHex = currentBg.match(/#(?:[0-9a-fA-F]{3,8})/);
          if (matchHex) {
            currentBg = matchHex[0];
          }
          onColorSelect(currentBg);
        }
      });
    }
  }, [colorOpen, nodeKey, editor, onColorSelect]);

  const menuItems = [
    {
      id: "turn-into",
      label: "Turn into",
      icon: <TurnIntoIcon />,
      hasArrow: true,
      keywords: ["turn", "convert", "heading", "paragraph", "text"],
      action: () => setTurnIntoOpen((o) => !o),
    },
    {
      id: "color",
      label: "Color",
      icon: <ColorIcon />,
      hasArrow: true,
      keywords: ["color", "background", "text", "highlight"],
      action: () => setColorOpen((o) => !o),
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <DuplicateIcon />,
      shortcut: "Ctrl+D",
      keywords: ["duplicate", "copy", "clone"],
      action: () => { onDuplicate(); onClose() },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <DeleteIcon />,
      shortcut: "Del",
      keywords: ["delete", "remove"],
      danger: true,
      action: () => { onDelete(); onClose() },
    },
    {
      id: "separator",
      label: "",
      icon: null,
      keywords: [],
      action: () => { },
      isSeparator: true,
    },
    {
      id: "copy-link",
      label: "Copy link to block",
      icon: <LinkIcon />,
      shortcut: "Alt+⌘+L",
      keywords: ["copy", "link", "url"],
      action: () => { onCopyLink(); onClose() },
    },
    {
      id: "move-top",
      label: "Move to top",
      icon: <MoveTopIcon />,
      keywords: ["move", "top", "first"],
      action: () => { onMoveToTop(); onClose() },
    },
    {
      id: "move-bottom",
      label: "Move to bottom",
      icon: <MoveBottomIcon />,
      keywords: ["move", "bottom", "last"],
      action: () => { onMoveToBottom(); onClose() },
    },
  ]

  const filtered = search.trim()
    ? menuItems.filter((item) => {
      if (item.isSeparator) return false
      const q = search.toLowerCase()
      return (
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      )
    })
    : menuItems

  // Adjust menu position so it stays in viewport
  const viewportHeight = window.innerHeight
  const menuHeight = 340 // approximate
  const top = position.top + menuHeight > viewportHeight
    ? Math.max(8, position.top - menuHeight)
    : position.top

  // Clamp left so menu doesn't overflow right edge
  const left = Math.min(position.left, window.innerWidth - 260)

  return (
    <div
      ref={menuRef}
      className="block-context-menu block-options-menu"
      style={{ top, left }}
      role="menu"
      aria-label="Block options"
    >
      {/* Search */}
      <div className="block-context-menu-search">
        <SearchIcon />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search actions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block-context-menu-search-input"
        />
      </div>

      {/* Section label */}
      {!search && (
        <div className="block-context-menu-section-label">Text</div>
      )}

      {/* Menu items */}
      <div className="block-context-menu-items">
        {filtered.map((item) => {
          if (item.isSeparator) {
            return (
              <div
                key={item.id}
                className="h-px bg-[var(--border)] my-1 mx-2"
              />
            )
          }
          return (
            <div key={item.id} style={{ position: "relative" }}>
              <button
                className={`block-context-menu-item${item.danger ? " danger" : ""}`}
                onClick={item.action}
                role="menuitem"
                aria-haspopup={item.hasArrow ? "menu" : undefined}
              >
                <span className="block-context-menu-item-icon">{item.icon}</span>
                <span className="block-context-menu-item-label">{item.label}</span>
                {item.shortcut && (
                  <span className="block-context-menu-item-shortcut">{item.shortcut}</span>
                )}
                {item.hasArrow && (
                  <span className="block-context-menu-item-arrow">
                    <ChevronRightIcon />
                  </span>
                )}
              </button>

              {/* Turn into submenu */}
              {item.id === "turn-into" && turnIntoOpen && (
                <div className="block-context-submenu">
                  <div className="block-context-menu-section-label" style={{ padding: "4px 8px 2px" }}>Turn into</div>
                  {[
                    { label: "Text", type: "paragraph" as TurnIntoType, icon: <TextIcon /> },
                    { label: "Heading 1", type: "h1" as TurnIntoType, icon: <H1Icon /> },
                    { label: "Heading 2", type: "h2" as TurnIntoType, icon: <H2Icon /> },
                    { label: "Heading 3", type: "h3" as TurnIntoType, icon: <H3Icon /> },
                    { label: "Bulleted List", type: "bullet" as TurnIntoType, icon: <BulletIcon /> },
                    { label: "Numbered List", type: "number" as TurnIntoType, icon: <NumberIcon /> },
                    { label: "Quote", type: "quote" as TurnIntoType, icon: <QuoteIcon /> },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      className="block-context-menu-item"
                      onClick={() => { onTurnInto(opt.type); onClose() }}
                      role="menuitem"
                    >
                      <span className="block-context-menu-item-icon">{opt.icon}</span>
                      <span className="block-context-menu-item-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Color submenu */}
              {item.id === "color" && colorOpen && (
                <div className="block-context-submenu block-context-submenu-color">
                  <div className="block-context-menu-section-label" style={{ padding: "4px 8px 2px" }}>Color</div>
                  <ColorPicker
                    currentColor={selectedColor}
                    onChange={(color) => {
                      onColorSelect(color);
                      setColorOpen(false);
                      onClose();
                    }}
                    useTransparentBg={true}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="block-context-menu-footer">
        Last edited {formatTimeAgo(lastEdited)}
      </div>
    </div>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  )
}
function TurnIntoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h8M2 8h5M2 12h7" />
      <path d="M12 5l2.5 3L12 11" strokeWidth="1.5" />
    </svg>
  )
}
function ColorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5v11M2.5 8h11" strokeWidth="1" />
    </svg>
  )
}
function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5a3.536 3.536 0 005 0l2-2a3.536 3.536 0 00-5-5L7 4" />
      <path d="M9.5 6.5a3.536 3.536 0 00-5 0l-2 2a3.536 3.536 0 005 5L9 12" />
    </svg>
  )
}
function DuplicateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" />
    </svg>
  )
}
function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
    </svg>
  )
}
function MoveTopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2h12M8 14V5M4 9l4-4 4 4" />
    </svg>
  )
}
function MoveBottomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14h12M8 2v9M4 7l4 4 4-4" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2l4 4-4 4" />
    </svg>
  )
}
function TextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M8 4v8M5 12h6" />
    </svg>
  )
}
function H1Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <text x="1" y="13" fontFamily="system-ui" fontWeight="700" fontSize="11">H1</text>
    </svg>
  )
}
function H2Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <text x="1" y="13" fontFamily="system-ui" fontWeight="700" fontSize="11">H2</text>
    </svg>
  )
}
function H3Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <text x="1" y="13" fontFamily="system-ui" fontWeight="700" fontSize="11">H3</text>
    </svg>
  )
}

function BulletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <circle cx="3.5" cy="4.5" r="1.2" />
      <rect x="7" y="3.8" width="7" height="1.4" rx="0.5" />
      <circle cx="3.5" cy="8.5" r="1.2" />
      <rect x="7" y="7.8" width="7" height="1.4" rx="0.5" />
      <circle cx="3.5" cy="12.5" r="1.2" />
      <rect x="7" y="11.8" width="7" height="1.4" rx="0.5" />
    </svg>
  )
}
function NumberIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <text x="1" y="6" fontFamily="system-ui" fontWeight="600" fontSize="7">1</text>
      <rect x="7" y="4" width="7" height="1.4" rx="0.5" />
      <text x="1" y="11" fontFamily="system-ui" fontWeight="600" fontSize="7">2</text>
      <rect x="7" y="9" width="7" height="1.4" rx="0.5" />
      <text x="1" y="15" fontFamily="system-ui" fontWeight="600" fontSize="7">3</text>
      <rect x="7" y="13" width="7" height="1.4" rx="0.5" />
    </svg>
  )
}
function QuoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.9 }}>
      <path d="M3.5 4h3v3h-2l1 2.5h-2L4.5 7h-1V4zm6 0h3v3h-2l1 2.5h-2L10.5 7h-1V4z" />
    </svg>
  )
}

// ─── Main plugin ──────────────────────────────────────────────────────────────

export default function BlockHandlePlugin({
  isNested = false,
}: {
  isNested?: boolean
}): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [handle, setHandle] = useState<HandleState | null>(null)
  const handleRef = useRef<HandleState | null>(null)
  useEffect(() => {
    handleRef.current = handle
  }, [handle])
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('transparent');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastEditedRef = useRef<Date>(new Date())
  // FIX 7d: toast state
  const [toast, setToast] = useState<string | null>(null)

  // Track last edit time and apply block styles to the DOM
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      lastEditedRef.current = new Date()

      // Lexical's ParagraphNode/HeadingNode doesn't apply `style` to the DOM natively.
      // We manually apply it here after every update so that the color renders.
      editorState.read(() => {
        const rootDOM = editor.getRootElement();
        if (!rootDOM) return;

        const applyStyles = (node: LexicalNode) => {
          if ($isElementNode(node)) {
            const el = editor.getElementByKey(node.getKey());
            if (el) {
              const style = node.getStyle();
              const match = style.match(/background:\s*([^;]+)/i);
              const color = match ? match[1].trim() : "";
              if (color && color !== "transparent" && color !== "default") {
                el.style.background = color;
                el.style.borderRadius = "4px";
                el.style.transition = "background 0.2s ease";
              } else {
                el.style.background = "";
                el.style.borderRadius = "";
              }
            }
            node.getChildren().forEach(applyStyles);
          }
        };
        $getRoot().getChildren().forEach(applyStyles);
      });
    })
  }, [editor])

  // Sync body class for column resize handle visibility
  useEffect(() => {
    if (handle !== null || menuOpen) {
      document.body.classList.add("has-active-block-handle")
    } else {
      document.body.classList.remove("has-active-block-handle")
    }
    return () => {
      document.body.classList.remove("has-active-block-handle")
    }
  }, [handle, menuOpen])

  // Mouse tracking for handle position
  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return

    const onMouseMove = (e: MouseEvent) => {
      if (menuOpen) return

      const target = e.target as HTMLElement | null
      if (!target) return

      // 1. If mouse is over the gutter buttons, keep them visible
      if (target.closest(".block-handle-group")) {
        clearTimeout(hideTimer.current)
        return
      }

      // 2. If we have an active handle, keep it visible while on the same vertical line
      if (handleRef.current) {
        const activeBlockEl = root.querySelector(
          `[data-lexical-node-key="${handleRef.current.nodeKey}"]`
        ) as HTMLElement | null
        if (activeBlockEl) {
          const rect = activeBlockEl.getBoundingClientRect()
          if (e.clientY >= rect.top - 2 && e.clientY <= rect.bottom + 2) {
            clearTimeout(hideTimer.current)
            return
          }
        }
      }

      // 3. If mouse is inside the editor, track the block
      if (root.contains(target)) {
        clearTimeout(hideTimer.current)

        if (e.buttons > 0) {
          setHandle(null)
          return
        }

        if (
          target.classList.contains("cursor-col-resize") ||
          target.closest(".cursor-col-resize")
        ) {
          setHandle(null)
          return
        }

        // Find the top-level block node child of the root editor
        let blockEl: HTMLElement | null = target
        while (blockEl && blockEl.parentElement !== root) {
          blockEl = blockEl.parentElement
        }

        if (!blockEl || blockEl === root) {
          scheduleHide()
          return
        }

        if (!isNested && blockEl.classList.contains("columns-outer-wrapper")) {
          scheduleHide()
          return
        }

        let key: string | null = null
        editor.read(() => {
          try {
            let node = $getNearestNodeFromDOMNode(target!)
            if (!node) return
            // Walk up to the direct child of root
            while (node.getParent() && !$isRootNode(node.getParent())) {
              node = node.getParent()!
            }
            key = node.getKey()
          } catch {
            // Element not in this editor's node map (decorator UI chrome etc.)
          }
        })

        if (!key) { scheduleHide(); return }

        const rect = blockEl.getBoundingClientRect()
        const rootRect = root.getBoundingClientRect()

        let leftPos = rect.left + 4
        if (isNested) {
          leftPos = rect.left - 30
        } else if (
          blockEl.classList.contains("lexical-table") ||
          blockEl.classList.contains("columns-outer-wrapper") ||
          blockEl.closest(".lexical-table") ||
          blockEl.closest(".columns-outer-wrapper")
        ) {
          leftPos = rect.left - 52
        }
        
        if (!blockEl.classList.contains("lexical-image-wrapper")) {
          leftPos = Math.max(rootRect.left - 56, leftPos)
        }

        const newTop = rect.top
        const newLeft = leftPos
        const newKey = key ?? ""

        setHandle((prev) => {
          if (
            prev &&
            prev.top === newTop &&
            prev.left === newLeft &&
            prev.nodeKey === newKey
          ) {
            return prev
          }
          return { top: newTop, left: newLeft, nodeKey: newKey }
        })
        return
      }

      // 3. If mouse is anywhere else, hide the gutter buttons
      scheduleHide()
    }

    const scheduleHide = () => {
      if (menuOpen) return
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setHandle(null), 300)
    }

    const onMouseDown = (e: MouseEvent) => {
      // If clicking inside the editor, hide the handles immediately
      if (root.contains(e.target as Node)) {
        setHandle(null)
      }
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mousedown", onMouseDown)

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mousedown", onMouseDown)
      clearTimeout(hideTimer.current)
    }
  }, [editor, menuOpen, isNested]);



  // ── Actions ──────────────────────────────────────────────────────────────────

  // Support Alt+Click to insert block above, click to insert below
  const handleAddBlock = useCallback((e: React.MouseEvent) => {
    const isAlt = e.altKey
    editor.update(() => {
      if (!handle?.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (!node) return
      const para = $createParagraphNode()
      if (isAlt) {
        node.insertBefore(para)
      } else {
        node.insertAfter(para)
      }
      para.selectEnd()
    })
    setHandle(null)
  }, [editor, handle])

  // FIX: fix openMenu coords — no scrollY/scrollX (fixed positioning)
  const openMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = e.currentTarget.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
      })
      setMenuOpen(true)
    },
    []
  )

  const handleDuplicate = useCallback(() => {
    editor.update(() => {
      if (!handle?.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (!node) return

      function deepClone(n: LexicalNode): LexicalNode {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const NodeClass = n.constructor as any
        const clone = NodeClass.clone(n)
        if ($isElementNode(n) && $isElementNode(clone)) {
          n.getChildren().forEach((child) => {
            clone.append(deepClone(child))
          })
        }
        return clone
      }

      const clone = deepClone(node)
      node.insertAfter(clone)
    })
    setMenuOpen(false)
    setHandle(null)
  }, [editor, handle])

  const handleColorSelect = useCallback((color: string) => {
    if (handle?.nodeKey) {
      editor.update(() => {
        const node = $getNodeByKey(handle.nodeKey);
        if (node && $isElementNode(node)) {
          if (color && color !== "transparent" && color !== "default") {
            node.setStyle(`background: color-mix(in srgb, ${color} 40%, transparent);`);
          } else {
            node.setStyle("");
          }
        }
      });
    }
    setSelectedColor(color);
  }, [editor, handle]);

  const handleDelete = useCallback(() => {
    editor.update(() => {
      if (!handle?.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (node) node.remove()
    })
    setMenuOpen(false)
    setHandle(null)
  }, [editor, handle])

  const handleTurnInto = useCallback(
    (type: TurnIntoType) => {
      setMenuOpen(false)
      setHandle(null)

      if (type === "bullet" || type === "number") {
        // Must select the node first, then dispatch the command outside update()
        editor.update(() => {
          if (!handle?.nodeKey) return
          const node = $getNodeByKey(handle.nodeKey)
          if (!node) return
          node.selectEnd()
        })
        setTimeout(() => {
          if (type === "bullet") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        }, 0)
        return
      }

      editor.update(() => {
        if (!handle?.nodeKey) return
        const node = $getNodeByKey(handle.nodeKey)
        if (!node || !$isElementNode(node)) return

        let newNode
        if (type === "paragraph") {
          newNode = $createParagraphNode()
        } else if (type === "quote") {
          newNode = $createQuoteNode()
        } else {
          newNode = $createHeadingNode(type as "h1" | "h2" | "h3" | "h4")
        }

        node.getChildren().forEach((child) => newNode.append(child))
        node.replace(newNode)
        newNode.selectEnd()
      })
    },
    [editor, handle]
  )

  // FIX 7d: copy link + toast
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.href.split("#")[0]}#block-${handle?.nodeKey ?? ""}`
    navigator.clipboard.writeText(url).catch(() => {/* ignore */ })
    setToast("Link copied")
    setTimeout(() => setToast(null), 2000)
  }, [handle])

  // FIX 7c: move to top
  const handleMoveToTop = useCallback(() => {
    editor.update(() => {
      if (!handle?.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (!node) return
      const parent = node.getParent()
      if (!parent) return
      const firstChild = parent.getFirstChild()
      if (firstChild && firstChild !== node) {
        firstChild.insertBefore(node)
      }
    })
    setMenuOpen(false)
    setHandle(null)
  }, [editor, handle])

  // FIX 7c: move to bottom
  const handleMoveToBottom = useCallback(() => {
    editor.update(() => {
      if (!handle?.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (!node) return
      const parent = node.getParent()
      if (!parent) return
      const lastChild = parent.getLastChild()
      if (lastChild && lastChild !== node) {
        lastChild.insertAfter(node)
      }
    })
    setMenuOpen(false)
    setHandle(null)
  }, [editor, handle])

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false)
    setHandle(null)
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!handle) return null

  return createPortal(
    <>
      {/* Gutter button group */}
      <div
        className="block-handle-group"
        style={{
          position: "fixed",
          // Adjust top/left to compensate for the padding so the buttons remain in the same position
          top: handle.top - 6, // +4 offset - 10px padding
          left: handle.left - 24, // left offset - 24px padding
          padding: "10px 24px",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "2px",
          userSelect: "none",
        }}
        onMouseEnter={() => {
          clearTimeout(hideTimer.current)
        }}
        onMouseLeave={() => {
          if (!menuOpen) {
            clearTimeout(hideTimer.current)
            hideTimer.current = setTimeout(() => setHandle(null), 300)
          }
        }}
      >
        <AddButton onClick={handleAddBlock} />
        <DragHandleButton onClick={openMenu} />
      </div>

      {/* Context menu */}
      {menuOpen && handle && (
        <BlockContextMenu
          position={menuPosition}
          nodeKey={handle.nodeKey}
          onClose={handleCloseMenu}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onTurnInto={handleTurnInto}
          onCopyLink={handleCopyLink}
          onMoveToTop={handleMoveToTop}
          onMoveToBottom={handleMoveToBottom}
          lastEdited={lastEditedRef.current}
          selectedColor={selectedColor}
          onColorSelect={handleColorSelect}
        />
      )}

      {/* FIX 7d: copy link toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 20000,
          }}
          className="
            px-3 py-2 rounded-lg text-xs font-medium
            bg-[var(--card-bg)] border border-[var(--card-border)]
            text-[var(--foreground)]
            shadow-[0_4px_16px_rgba(0,0,0,0.4)]
            animate-in fade-in slide-in-from-bottom-2 duration-200
          "
        >
          {toast}
        </div>
      )}
    </>,
    document.body
  )
}
