import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical"
import { ElementNode, $applyNodeReplacement } from "lexical"

export type SerializedCalloutNode = Spread<
  { calloutType: "info" | "warning" | "success" | "error" },
  SerializedElementNode
>

export class CalloutNode extends ElementNode {
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

  createDOM(config: EditorConfig): HTMLElement {
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
      ...super.exportJSON(),
      type: "callout",
      calloutType: this.__calloutType,
      version: 1,
    }
  }

  isInline(): boolean { return false }
}

export function $createCalloutNode(
  calloutType: "info" | "warning" | "success" | "error" = "info"
): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(calloutType))
}

export function $isCalloutNode(node: unknown): node is CalloutNode {
  return node instanceof CalloutNode
}

