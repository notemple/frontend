import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export type SerializedEquationNode = Spread<
  { equation: string; inline: boolean },
  SerializedLexicalNode
>

export class EquationNode extends DecoratorNode<ReactNode> {
  __equation: string
  __inline: boolean

  static getType(): string { return "equation" }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key)
  }

  constructor(equation = "", inline = false, key?: NodeKey) {
    super(key)
    this.__equation = equation
    this.__inline = inline
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

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <span className={this.__inline ? "lexical-equation--inline" : "lexical-equation--block"}>
        <code>{this.__equation}</code>
      </span>
    )
  }

  isInline(): boolean { return this.__inline }
  isKeyboardSelectable(): boolean { return true }
}

export function $createEquationNode(equation = "", inline = false): EquationNode {
  return $applyNodeReplacement(new EquationNode(equation, inline))
}

export function $isEquationNode(node: unknown): node is EquationNode {
  return node instanceof EquationNode
}
