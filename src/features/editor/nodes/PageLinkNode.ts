import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from "lexical"
import { TextNode, $applyNodeReplacement } from "lexical"

export type SerializedPageLinkNode = Spread<
  { documentId: string; title: string },
  SerializedTextNode
>

export class PageLinkNode extends TextNode {
  __documentId: string
  __title: string

  static getType(): string { return "page-link" }

  static clone(node: PageLinkNode): PageLinkNode {
    return new PageLinkNode(node.__documentId, node.__title, node.__key)
  }

  constructor(documentId: string, title: string, key?: NodeKey) {
    super(`[[${title}]]`, key)
    this.__documentId = documentId
    this.__title = title
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = super.createDOM(config)
    el.className = "lexical-page-link"
    el.setAttribute("data-document-id", this.__documentId)
    return el
  }

  updateDOM(
    prevNode: this,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const updated = super.updateDOM(prevNode, dom, config)
    if (prevNode.__documentId !== this.__documentId) {
      dom.setAttribute("data-document-id", this.__documentId)
    }
    return updated
  }

  static importJSON(json: SerializedPageLinkNode): PageLinkNode {
    const node = $createPageLinkNode(json.documentId, json.title)
    node.setFormat(json.format)
    node.setDetail(json.detail)
    node.setMode(json.mode)
    node.setStyle(json.style)
    return node
  }

  exportJSON(): SerializedPageLinkNode {
    return {
      ...super.exportJSON(),
      type: "page-link",
      documentId: this.__documentId,
      title: this.__title,
    }
  }

  isToken(): boolean { return true }
  canInsertTextBefore(): boolean { return false }
  canInsertTextAfter(): boolean { return false }
}

export function $createPageLinkNode(documentId: string, title: string): PageLinkNode {
  return $applyNodeReplacement(new PageLinkNode(documentId, title))
}

export function $isPageLinkNode(
  node: LexicalNode | null | undefined
): node is PageLinkNode {
  return node instanceof PageLinkNode
}
