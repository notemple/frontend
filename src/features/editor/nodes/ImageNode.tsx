import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"

export type SerializedImageNode = Spread<
  { src: string; alt: string; width?: number; height?: number },
  SerializedLexicalNode
>

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string
  __alt: string
  __width?: number
  __height?: number

  static getType(): string { return "image" }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key)
  }

  constructor(src: string, alt: string, width?: number, height?: number, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__alt = alt
    this.__width = width
    this.__height = height
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "lexical-image-wrapper"
    return el
  }

  updateDOM(): boolean { return false }

  static importJSON(json: SerializedImageNode): ImageNode {
    return $createImageNode(json.src, json.alt, json.width, json.height)
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
      version: 1,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <div className="lexical-image-wrapper">
        <img
          src={this.__src}
          alt={this.__alt}
          style={{
            width: this.__width ? `${this.__width}px` : "100%",
            height: this.__height ? `${this.__height}px` : "auto",
            display: "block",
            borderRadius: "0.25rem",
            maxWidth: "100%",
          }}
        />
      </div>
    )
  }

  isInline(): boolean { return false }
  isKeyboardSelectable(): boolean { return true }
}

export function $createImageNode(
  src: string,
  alt: string,
  width?: number,
  height?: number
): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, alt, width, height))
}

export function $isImageNode(node: unknown): node is ImageNode {
  return node instanceof ImageNode
}
