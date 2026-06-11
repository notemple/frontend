import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export class HorizontalRuleNode extends DecoratorNode<ReactNode> {
  static getType(): string { return "horizontalrule" }

  static clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "lexical-hr-wrapper"
    return el
  }

  updateDOM(): boolean { return false }

  static importJSON(_json: SerializedLexicalNode): HorizontalRuleNode {
    return $createHorizontalRuleNode()
  }

  exportJSON(): SerializedLexicalNode {
    return {
      type: "horizontalrule",
      version: 1,
    }
  }

  decorate(): ReactNode {
    return (
      <div
        contentEditable={false}
        className="w-full border-t border-black/15 dark:border-white/15"
        style={{
          margin: "1.5rem 0",
        }}
      />
    )
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return $applyNodeReplacement(new HorizontalRuleNode())
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode
}
