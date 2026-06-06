import type {
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical"
import { ElementNode, $applyNodeReplacement } from "lexical"

export type SerializedColumnNode = Spread<
  { width: number },
  SerializedElementNode
>

export class ColumnNode extends ElementNode {
  __width: number

  static getType(): string { return "column" }

  static clone(node: ColumnNode): ColumnNode {
    return new ColumnNode(node.__width, node.__key)
  }

  constructor(width: number, key?: NodeKey) {
    super(key)
    this.__width = width
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("data-type", "column")
    el.className = "column-block"
    // Inline style is the source of truth for width.
    // CSS classes cannot be trusted due to the global !important overrides
    // in src/index.css. Inline styles always win.
    el.style.cssText = `
      width: ${this.__width}%;
      flex: 0 0 ${this.__width}%;
      min-width: 0;
      min-height: 80px;
      position: relative;
      box-sizing: border-box;
    `.trim()
    return el
  }

  updateDOM(prevNode: ColumnNode, dom: HTMLElement): boolean {
    if (prevNode.__width !== this.__width) {
      dom.style.width = `${this.__width}%`
      dom.style.flex = `0 0 ${this.__width}%`
    }
    return false
  }

  static importJSON(json: SerializedColumnNode): ColumnNode {
    return $createColumnNode(json.width)
  }

  exportJSON(): SerializedColumnNode {
    return {
      ...super.exportJSON(),
      type: "column",
      width: this.__width,
      version: 1,
    }
  }

  getWidth(): number {
    return this.getLatest().__width
  }

  setWidth(width: number): this {
    const writable = this.getWritable()
    writable.__width = width
    return writable
  }

  isShadowRoot(): boolean { return true }
  isInline(): boolean { return false }
  canBeEmpty(): boolean { return false }
  canInsertTextBefore(): boolean { return false }
  canInsertTextAfter(): boolean { return false }
}

export function $createColumnNode(width: number): ColumnNode {
  return $applyNodeReplacement(new ColumnNode(width))
}

export function $isColumnNode(
  node: LexicalNode | null | undefined
): node is ColumnNode {
  return node instanceof ColumnNode
}
