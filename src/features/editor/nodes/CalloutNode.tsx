import React, { useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement, $getNodeByKey } from "lexical"
import EmojiPicker from "emoji-picker-react"
import { createPortal } from "react-dom"

export type CalloutType = "info" | "warning" | "success" | "error" | "note" | "tip" | "important" | "caution" | "custom"

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType
    emoji: string
    title: string
    titleModified?: boolean
    content: string
  },
  SerializedLexicalNode
>

function extractTextFromSerializedNodes(nodes?: any[]): string {
  if (!nodes) return ""
  return nodes
    .map((node) => {
      if (node.text) return node.text
      if (node.children) return extractTextFromSerializedNodes(node.children)
      return ""
    })
    .join("\n")
}

function CalloutComponent({
  nodeKey,
  calloutType,
  emoji,
  title,
  titleModified,
  content,
  editor,
  autoFocus,
}: {
  nodeKey: string
  calloutType: CalloutType
  emoji: string
  title: string
  titleModified: boolean
  content: string
  editor: LexicalEditor
  autoFocus?: boolean
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const emojiRef = useRef<HTMLSpanElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && bodyRef.current) {
      bodyRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(bodyRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }, [autoFocus])

  useEffect(() => {
    if (!isPickerOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [isPickerOpen])

  const handleTitleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.innerText.trim()
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isCalloutNode(node)) {
        const defaultTitle = CalloutNode.getDefaultTitle(node.getCalloutType())
        if (text === "" || text === defaultTitle) {
          node.setTitle(defaultTitle, false)
        } else {
          node.setTitle(text, true)
        }
      }
    })
  }

  const handleContentBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isCalloutNode(node)) {
        node.setContent(text)
      }
    })
  }

  const selectEmoji = (newEmoji: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isCalloutNode(node)) {
        node.setEmoji(newEmoji)
      }
    })
    setIsPickerOpen(false)
  }

  const handleDeleteCallout = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) {
        const prevSibling = node.getPreviousSibling()
        if (prevSibling && typeof (prevSibling as any).selectEnd === "function") {
          ;(prevSibling as any).selectEnd()
        } else {
          const nextSibling = node.getNextSibling()
          if (nextSibling && typeof (nextSibling as any).selectStart === "function") {
            ;(nextSibling as any).selectStart()
          } else {
            const parent = node.getParent()
            if (parent) {
              parent.selectEnd()
            }
          }
        }
        node.remove()
      }
    })
  }

  const handleTitleFocus = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (!titleModified) {
      const range = document.createRange()
      range.selectNodeContents(e.currentTarget)
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }

  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  useEffect(() => {
    if (isPickerOpen && emojiRef.current) {
      const rect = emojiRef.current.getBoundingClientRect()
      const top = rect.bottom + window.scrollY + 6
      const left = Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 370))
      setPickerPos({ top, left })
    }
  }, [isPickerOpen])

  const defaultTitle = CalloutNode.getDefaultTitle(calloutType)
  const displayTitle = titleModified ? title : defaultTitle
  const isDefaultCallout = calloutType === "note"

  return (
    <div className={`lexical-callout lexical-callout--${calloutType}`}>
      <div className="lexical-callout-header">
        <span
          ref={emojiRef}
          className={`lexical-callout-emoji ${isDefaultCallout ? "lexical-callout-emoji--disabled" : ""}`}
          onClick={() => {
            if (!isDefaultCallout) {
              setIsPickerOpen(!isPickerOpen)
            }
          }}
        >
          {emoji}
        </span>
        <span
          className={`lexical-callout-title ${!titleModified ? "lexical-callout-title--placeholder" : ""} ${isDefaultCallout ? "lexical-callout-title--readonly" : ""}`}
          contentEditable={!isDefaultCallout}
          suppressContentEditableWarning
          data-placeholder={defaultTitle}
          onBlur={handleTitleBlur}
          onFocus={handleTitleFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              e.currentTarget.blur()
            } else if (e.key === "Backspace") {
              const text = e.currentTarget.innerText.trim()
              if (text === "") {
                e.preventDefault()
                handleDeleteCallout()
              }
            }
          }}
        >
          {displayTitle}
        </span>
      </div>
      <div
        ref={bodyRef}
        className="lexical-callout-body"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleContentBlur}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            const text = e.currentTarget.innerText.trim()
            if (text === "") {
              e.preventDefault()
              handleDeleteCallout()
            }
          }
        }}
      >
        {content}
      </div>

      {isPickerOpen && createPortal(
        <div
          ref={pickerRef}
          className="fixed z-[99999] p-1 bg-white dark:bg-[#1f1f22] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${pickerPos.top}px`,
            left: `${pickerPos.left}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <EmojiPicker
            onEmojiClick={(emojiData) => selectEmoji(emojiData.emoji)}
            theme={
              document.documentElement.classList.contains("dark")
                ? "dark" as any
                : "light" as any
            }
          />
        </div>,
        document.body
      )}
    </div>
  )
}

export class CalloutNode extends DecoratorNode<ReactNode> {
  __calloutType: CalloutType
  __emoji: string
  __title: string
  __titleModified: boolean
  __content: string
  __autoFocus?: boolean

  static getType(): string { return "callout" }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(
      node.__calloutType,
      node.__emoji,
      node.__title,
      node.__titleModified,
      node.__content,
      node.__key,
      node.__autoFocus
    )
  }

  static getDefaultEmoji(type: CalloutType): string {
    switch (type) {
      case "custom":
        return "⚙️"
      case "tip":
      case "success":
        return "💡"
      case "important":
        return "💜"
      case "warning":
        return "⚠️"
      case "caution":
      case "error":
        return "🚨"
      case "note":
      case "info":
      default:
        return "ℹ"
    }
  }

  static getDefaultTitle(type: CalloutType): string {
    switch (type) {
      case "custom":
        return "Callout"
      case "tip":
      case "success":
        return "Tip"
      case "important":
        return "Important"
      case "warning":
        return "Warning"
      case "caution":
      case "error":
        return "Caution"
      case "note":
      case "info":
      default:
        return "Note"
    }
  }

  constructor(
    calloutType: CalloutType = "note",
    emoji?: string,
    title?: string,
    titleModified?: boolean,
    content?: string,
    key?: NodeKey,
    autoFocus?: boolean
  ) {
    super(key)
    this.__calloutType = calloutType
    this.__emoji = emoji || CalloutNode.getDefaultEmoji(calloutType)
    this.__titleModified = titleModified ?? (title !== undefined && title !== CalloutNode.getDefaultTitle(calloutType))
    this.__title = title || CalloutNode.getDefaultTitle(calloutType)
    this.__content = content || ""
    this.__autoFocus = autoFocus
  }

  getCalloutType(): CalloutType {
    return this.__calloutType
  }

  getEmoji(): string {
    return this.__emoji
  }

  setEmoji(emoji: string): void {
    const writable = this.getWritable()
    writable.__emoji = emoji
  }

  getTitle(): string {
    return this.__title
  }

  getTitleModified(): boolean {
    return this.__titleModified
  }

  setTitle(title: string, modified = true): void {
    const writable = this.getWritable()
    writable.__title = title
    writable.__titleModified = modified
  }

  getContent(): string {
    return this.__content
  }

  setContent(content: string): void {
    const writable = this.getWritable()
    writable.__content = content
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "lexical-callout-wrapper"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <CalloutComponent
        nodeKey={this.__key}
        calloutType={this.__calloutType}
        emoji={this.__emoji}
        title={this.__title}
        titleModified={this.__titleModified}
        content={this.__content}
        editor={editor}
        autoFocus={this.__autoFocus}
      />
    )
  }

  static importJSON(json: any): CalloutNode {
    const content = json.content || extractTextFromSerializedNodes(json.children)
    return $createCalloutNode(json.calloutType, json.emoji, json.title, json.titleModified, content)
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: "callout",
      calloutType: this.__calloutType,
      emoji: this.__emoji,
      title: this.__title,
      titleModified: this.__titleModified,
      content: this.__content,
      version: 1,
    }
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createCalloutNode(
  calloutType: CalloutType = "note",
  emoji?: string,
  title?: string,
  titleModified?: boolean,
  content?: string,
  autoFocus?: boolean
): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(calloutType, emoji, title, titleModified, content, undefined, autoFocus))
}

export function $isCalloutNode(node: unknown): node is CalloutNode {
  return node instanceof CalloutNode
}
