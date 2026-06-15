import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement, $getNodeByKey } from "lexical"
import type { ReactNode } from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import * as Icons from "@phosphor-icons/react"
import katex from "katex"
import { getPopupPosition } from "../../../shared/hooks/usePortalPosition"

export type SerializedEquationNode = Spread<
  { equation: string; inline: boolean },
  SerializedLexicalNode
>

function renderLatex(latex: string, displayMode: boolean): string {
  if (!latex.trim()) return ""
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    })
  } catch {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: "ignore",
      })
    } catch {
      return `<span class="katex-error">${latex}</span>`
    }
  }
}

function EquationPopoverEditor({
  nodeKey,
  equation,
  inline,
  editor,
  onClose,
}: {
  nodeKey: string
  equation: string
  inline: boolean
  editor: LexicalEditor
  onClose: () => void
}) {
  const [editValue, setEditValue] = useState(equation)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const recalcPosition = useCallback(() => {
    const node = document.querySelector(`[data-equation-key="${nodeKey}"]`)
    const popover = popoverRef.current
    if (!node || !popover) return

    const triggerRect = node.getBoundingClientRect()
    const popoverRect = popover.getBoundingClientRect()

    const { top, left } = getPopupPosition(triggerRect, {
      preferredPlacement: "bottom",
      offset: 8,
      menuWidth: popoverRect.width,
      menuHeight: popoverRect.height,
      centerHorizontally: true,
    })

    setPopoverPos({ top, left })
  }, [nodeKey])

  useEffect(() => {
    recalcPosition()
  }, [recalcPosition])

  // Reposition popover when editor scrolls or viewport resizes
  useEffect(() => {
    const scrollContainer = document.querySelector('.editor-scroll-area') as HTMLElement | null
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', recalcPosition, { passive: true })
    }
    window.addEventListener('resize', recalcPosition)
    return () => {
      scrollContainer?.removeEventListener('scroll', recalcPosition)
      window.removeEventListener('resize', recalcPosition)
    }
  }, [recalcPosition])

  // Reposition when popover size changes (textarea grows/shrinks)
  useEffect(() => {
    const popover = popoverRef.current
    if (!popover) return
    const ro = new ResizeObserver(recalcPosition)
    ro.observe(popover)
    return () => ro.disconnect()
  }, [recalcPosition])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        handleConfirm()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [editValue])

  const handleConfirm = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed !== equation) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && "setEquation" in node) {
          ;(node as any).setEquation(trimmed)
        }
      })
    }
    onClose()
  }, [editValue, equation, editor, nodeKey, onClose])

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) {
        const prev = node.getPreviousSibling()
        if (prev && typeof (prev as any).selectEnd === "function") {
          ;(prev as any).selectEnd()
        } else {
          const next = node.getNextSibling()
          if (next && typeof (next as any).selectStart === "function") {
            ;(next as any).selectStart()
          } else {
            const parent = node.getParent()
            if (parent) parent.selectEnd()
          }
        }
        node.remove()
      }
    })
    onClose()
  }, [editor, nodeKey, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleConfirm()
    }
  }

  const previewHtml = editValue.trim()
    ? renderLatex(editValue, !inline)
    : `<span style="color: var(--muted-foreground); font-style: italic; font-size: 0.8125rem;">Type LaTeX...</span>`

  return createPortal(
    <div
      ref={popoverRef}
      className="equation-popover"
      style={{ top: popoverPos.top, left: popoverPos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="equation-popover-header">
        <span>{inline ? "Inline Equation" : "Block Equation"}</span>
        <span style={{ fontSize: "0.6875rem", fontWeight: 400, opacity: 0.6 }}>
          Esc to confirm · Cmd+Enter to save
        </span>
      </div>
      <div className="equation-popover-body">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter LaTeX expression..."
          spellCheck={false}
          rows={3}
        />
        <div
          className="equation-popover-preview"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
      <div className="equation-popover-footer">
        <button
          type="button"
          onClick={handleDelete}
          className="equation-popover-btn equation-popover-btn--danger"
        >
          <Icons.Trash size={13} weight="bold" />
          Delete
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="equation-popover-btn equation-popover-btn--primary"
        >
          <Icons.Check size={13} weight="bold" />
          Confirm
        </button>
      </div>
    </div>,
    document.body
  )
}

function EquationComponent({
  nodeKey,
  equation,
  inline,
  editor,
  autoFocus,
}: {
  nodeKey: string
  equation: string
  inline: boolean
  editor: LexicalEditor
  autoFocus?: boolean
}) {
  const [isEditing, setIsEditing] = useState(autoFocus ?? false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setIsEditing(true)
    }
  }, [autoFocus])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleClose = useCallback(() => {
    setIsEditing(false)
  }, [])

  const displayHtml = equation.trim()
    ? renderLatex(equation, !inline)
    : `<span style="color: var(--muted-foreground); font-style: italic; font-size: 0.8125rem;">Click to add equation...</span>`

  return (
    <>
      <div
        ref={containerRef}
        data-equation-key={nodeKey}
        className={inline ? "lexical-equation--inline" : "lexical-equation--block"}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />
      {isEditing && (
        <EquationPopoverEditor
          nodeKey={nodeKey}
          equation={equation}
          inline={inline}
          editor={editor}
          onClose={handleClose}
        />
      )}
    </>
  )
}

export class EquationNode extends DecoratorNode<ReactNode> {
  __equation: string
  __inline: boolean
  __autoFocus?: boolean

  static getType(): string { return "equation" }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key, node.__autoFocus)
  }

  constructor(equation = "", inline = false, key?: NodeKey, autoFocus?: boolean) {
    super(key)
    this.__equation = equation
    this.__inline = inline
    this.__autoFocus = autoFocus
  }

  getEquation(): string {
    return this.__equation
  }

  setEquation(equation: string): void {
    const writable = this.getWritable()
    writable.__equation = equation
  }

  getInline(): boolean {
    return this.__inline
  }

  setInline(inline: boolean): void {
    const writable = this.getWritable()
    writable.__inline = inline
  }

  getAutoFocus(): boolean {
    return this.__autoFocus ?? false
  }

  createDOM(): HTMLElement {
    const el = this.__inline
      ? document.createElement("span")
      : document.createElement("div")
    el.className = this.__inline ? "lexical-equation--inline" : "lexical-equation--block"
    return el
  }

  updateDOM(): boolean { return false }

  static importJSON(json: SerializedEquationNode): EquationNode {
    return $createEquationNode(json.equation, json.inline)
  }

  exportJSON(): SerializedEquationNode {
    return {
      type: "equation",
      equation: this.__equation,
      inline: this.__inline,
      version: 1,
    }
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <EquationComponent
        nodeKey={this.__key}
        equation={this.__equation}
        inline={this.__inline}
        editor={editor}
        autoFocus={this.__autoFocus}
      />
    )
  }

  isInline(): boolean { return this.__inline }
  isKeyboardSelectable(): boolean { return true }
}

export function $createEquationNode(equation = "", inline = false, autoFocus?: boolean): EquationNode {
  return $applyNodeReplacement(new EquationNode(equation, inline, undefined, autoFocus))
}

export function $isEquationNode(node: unknown): node is EquationNode {
  return node instanceof EquationNode
}
