import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export type SerializedToggleNode = Spread<
  { title: string; open: boolean },
  SerializedLexicalNode
>

export class ToggleNode extends DecoratorNode<ReactNode> {
  __title: string
  __open: boolean

  static getType(): string { return "toggle" }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(node.__title, node.__open, node.__key)
  }

  constructor(title = "Toggle", open = false, key?: NodeKey) {
    super(key)
    this.__title = title
    this.__open = open
  }

  createDOM(): HTMLElement {
    const el = document.createElement("details")
    el.className = "lexical-toggle"
    if (this.__open) el.setAttribute("open", "")
    return el
  }

  updateDOM(prevNode: ToggleNode, dom: HTMLElement): boolean {
    if (prevNode.__open !== this.__open) {
      if (this.__open) {
        dom.setAttribute("open", "")
      } else {
        dom.removeAttribute("open")
      }
    }
    return false
  }

  static importJSON(json: SerializedToggleNode): ToggleNode {
    return $createToggleNode(json.title, json.open)
  }

  exportJSON(): SerializedToggleNode {
    return {
      type: "toggle",
      title: this.__title,
      open: this.__open,
      version: 1,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <details className="lexical-toggle">
        <summary className="lexical-toggle__summary">{this.__title}</summary>
        <div className="lexical-toggle__content" />
      </details>
    )
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createToggleNode(title = "Toggle", open = false): ToggleNode {
  return $applyNodeReplacement(new ToggleNode(title, open))
}

export function $isToggleNode(node: unknown): node is ToggleNode {
  return node instanceof ToggleNode
}
