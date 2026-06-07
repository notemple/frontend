import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from "lexical"
import { TextNode, $applyNodeReplacement } from "lexical"
import { useDocumentStore } from "@/features/documents/store"
import { getColorStyle, getFolderActiveHexColor } from "@/shared/lib/utils"

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
    super(title, key)
    this.__documentId = documentId
    this.__title = title
    this.__mode = 1 // IS_TOKEN
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = super.createDOM(config)
    el.setAttribute("data-document-id", this.__documentId)
    el.setAttribute("contenteditable", "false")
    
    this.applyCardStyles(el)
    return el
  }

  updateDOM(
    prevNode: this,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const updated = super.updateDOM(prevNode, dom, config)
    
    dom.setAttribute("contenteditable", "false")

    if (
      prevNode.__documentId !== this.__documentId ||
      prevNode.__title !== this.__title
    ) {
      dom.setAttribute("data-document-id", this.__documentId)
    }
    this.applyCardStyles(dom)
    return updated
  }

  applyCardStyles(el: HTMLElement): void {
    const doc = useDocumentStore.getState().documents[this.__documentId]
    const folderColors = useDocumentStore.getState().folderColors || {}
    const folderColor = doc?.folderId ? (folderColors[doc.folderId] || null) : null
    const resolvedHexColor =
      doc?.cardColor ||
      folderColor ||
      getFolderActiveHexColor(this.__documentId, {}, this.__title || "Untitled")

    const customStyle = getColorStyle(resolvedHexColor)

    if (customStyle) {
      el.style.backgroundColor = customStyle.bg
      el.style.borderColor = customStyle.border
      el.style.setProperty("--folder-text-light", customStyle["--folder-text-light"])
      el.style.setProperty("--folder-text-dark", customStyle["--folder-text-dark"])
    }

    const classes = ["lexical-page-link", "folder-element"]
    if (doc?.icon) {
      el.setAttribute("data-emoji", doc.icon)
      classes.push("has-custom-emoji")
    } else {
      el.removeAttribute("data-emoji")
      classes.push("has-default-icon")
      if (this.__documentId.startsWith("daily-note-")) {
        classes.push("is-date")
      } else {
        const docType = doc?.type || "page"
        if (docType === "book") {
          classes.push("is-book")
        } else if (docType === "person") {
          classes.push("is-person")
        }
      }
    }

    el.className = classes.join(" ")
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
  return $applyNodeReplacement(new PageLinkNode(documentId, title)).setMode("token")
}

export function $isPageLinkNode(
  node: LexicalNode | null | undefined
): node is PageLinkNode {
  return node instanceof PageLinkNode
}
