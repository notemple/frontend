import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export type SerializedCalloutNode = Spread<
  { calloutType: "info" | "warning" | "success" | "error" },
  SerializedLexicalNode
>

export class CalloutNode extends DecoratorNode<ReactNode> {
  __calloutType: "info" | "warning" | "success" | "error"

  static getType(): string { return "callout" }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__key)
  }

  constructor(
    calloutType: "info" | "warning" | "success" | "error" = "info",
    key?: NodeKey
  ) {
    super(key)
    this.__calloutType = calloutType
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = `lexical-callout lexical-callout--${this.__calloutType}`
    return el
  }

  updateDOM(prevNode: CalloutNode, dom: HTMLElement): boolean {
    if (prevNode.__calloutType !== this.__calloutType) {
      dom.className = `lexical-callout lexical-callout--${this.__calloutType}`
    }
    return false
  }

  static importJSON(json: SerializedCalloutNode): CalloutNode {
    return $createCalloutNode(json.calloutType)
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: "callout",
      calloutType: this.__calloutType,
      version: 1,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <div className={`lexical-callout lexical-callout--${this.__calloutType}`}>
        <div className="lexical-callout__content" />
      </div>
    )
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createCalloutNode(
  calloutType: "info" | "warning" | "success" | "error" = "info"
): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(calloutType))
}

export function $isCalloutNode(node: unknown): node is CalloutNode {
  return node instanceof CalloutNode
}
