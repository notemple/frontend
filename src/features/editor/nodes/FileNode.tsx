import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export type SerializedFileNode = Spread<
  { url: string; name: string; size?: number; mimeType?: string },
  SerializedLexicalNode
>

export class FileNode extends DecoratorNode<ReactNode> {
  __url: string
  __name: string
  __size?: number
  __mimeType?: string

  static getType(): string { return "file" }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__url, node.__name, node.__size, node.__mimeType, node.__key)
  }

  constructor(url: string, name: string, size?: number, mimeType?: string, key?: NodeKey) {
    super(key)
    this.__url = url
    this.__name = name
    this.__size = size
    this.__mimeType = mimeType
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "lexical-file-block"
    return el
  }

  updateDOM(): boolean { return false }

  static importJSON(json: SerializedFileNode): FileNode {
    return $createFileNode(json.url, json.name, json.size, json.mimeType)
  }

  exportJSON(): SerializedFileNode {
    return {
      type: "file",
      url: this.__url,
      name: this.__name,
      size: this.__size,
      mimeType: this.__mimeType,
      version: 1,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <div className="lexical-file-block">
        <a href={this.__url} download={this.__name} className="lexical-file-link">
          📎 {this.__name}
          {this.__size != null && (
            <span className="lexical-file-size">
              {" "}({Math.round(this.__size / 1024)}KB)
            </span>
          )}
        </a>
      </div>
    )
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createFileNode(
  url: string,
  name: string,
  size?: number,
  mimeType?: string
): FileNode {
  return $applyNodeReplacement(new FileNode(url, name, size, mimeType))
}

export function $isFileNode(node: unknown): node is FileNode {
  return node instanceof FileNode
}
