import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement } from "lexical"
import type { ReactNode } from "react"
import { useState, useRef, useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNodeByKey } from "lexical"

export type SerializedImageNode = Spread<
  { src: string; alt: string; width?: number; height?: number },
  SerializedLexicalNode
>

function ImageComponent({
  nodeKey,
  src,
  alt,
  width: initialWidth,
  height: initialHeight,
}: {
  nodeKey: NodeKey
  src: string
  alt: string
  width?: number
  height?: number
}) {
  const [editor] = useLexicalComposerContext()
  const targetWidth = initialWidth ?? 720
  const [width, setWidth] = useState<number>(targetWidth)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isInColumn, setIsInColumn] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspectRatio, setAspectRatio] = useState<number | null>(() => {
    if (initialWidth && initialHeight) {
      return initialWidth / initialHeight
    }
    return null
  })

  // Detect column ancestor on mount
  useEffect(() => {
    const colAncestor = containerRef.current?.closest('[data-type="column"]') || 
                        containerRef.current?.closest('.column-block')
    setIsInColumn(!!colAncestor)
  }, [])

  // Helper to compute max allowed width based on layout
  const getMaxAllowedWidth = (): number => {
    const colAncestor = containerRef.current?.closest('[data-type="column"]') || 
                        containerRef.current?.closest('.column-block')
    if (colAncestor) {
      return colAncestor.getBoundingClientRect().width
    }
    // Let it grow up to 90vw in the main editor
    return window.innerWidth * 0.9
  }

  // Handle window resizing and layout changes
  useEffect(() => {
    if (isResizing) return

    const handleResize = () => {
      const maxW = getMaxAllowedWidth()
      setWidth(Math.min(targetWidth, maxW))
    }

    // Run once layout is stable
    const timer = setTimeout(handleResize, 100)

    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [targetWidth, isInColumn, isResizing])

  // Sync parent wrapper style on every render/update to keep it sized and centered with the image
  useEffect(() => {
    const wrapper = containerRef.current?.parentElement
    if (wrapper) {
      if (isInColumn) {
        wrapper.style.width = `${width}px`
        wrapper.style.maxWidth = "100%"
        wrapper.style.margin = "0 auto"
        wrapper.style.padding = ""
        wrapper.style.marginLeft = ""
        wrapper.style.marginRight = ""
        if (!isLoaded && aspectRatio) {
          const contentWidth = width
          wrapper.style.height = `${contentWidth / aspectRatio}px`
        } else {
          wrapper.style.height = ""
        }
      } else {
        wrapper.style.width = `${width}px`
        wrapper.style.maxWidth = "90vw"
        wrapper.style.padding = "0px"
        wrapper.style.marginLeft = `calc(50% - ${width / 2}px - 56px)`
        wrapper.style.marginRight = `calc(50% - ${width / 2}px)`
        if (!isLoaded && aspectRatio) {
          const contentWidth = Math.max(0, width - 56)
          wrapper.style.height = `${contentWidth / aspectRatio}px`
        } else {
          wrapper.style.height = ""
        }
      }
    }
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    document.body.style.cursor = "col-resize"
    
    const imgEl = containerRef.current?.querySelector("img")
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : null
    if (!imgRect) return

    // Find horizontal center X coordinate of the image
    const centerX = imgRect.left + imgRect.width / 2
    
    const maxAllowedWidth = getMaxAllowedWidth()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const distanceFromCenter = Math.abs(moveEvent.clientX - centerX)
      let newWidth = distanceFromCenter * 2
      if (newWidth < 150) newWidth = 150
      if (newWidth > maxAllowedWidth) newWidth = maxAllowedWidth
      setWidth(newWidth)
    }

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false)
      document.body.style.cursor = ""
      
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)

      const distanceFromCenter = Math.abs(upEvent.clientX - centerX)
      let finalWidth = distanceFromCenter * 2
      if (finalWidth < 150) finalWidth = 150
      if (finalWidth > maxAllowedWidth) finalWidth = maxAllowedWidth

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setWidth(finalWidth)
          if (aspectRatio) {
            const contentWidth = isInColumn ? finalWidth : Math.max(0, finalWidth - 56)
            node.setHeight(contentWidth / aspectRatio)
          }
        }
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={containerRef}
      className="lexical-image-container group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "block",
        maxWidth: isInColumn ? "100%" : "90vw",
        width: "100%",
        padding: "0px",
        boxSizing: "border-box",
      }}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          const img = e.currentTarget
          const naturalRatio = img.naturalWidth / img.naturalHeight
          setAspectRatio(naturalRatio)
          setIsLoaded(true)
          
          if (initialWidth === undefined) {
            const maxW = getMaxAllowedWidth()
            const defaultWidth = Math.min(img.naturalWidth, maxW)
            setWidth(defaultWidth)
            if (editor.isEditable()) {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if ($isImageNode(node)) {
                  node.setWidth(defaultWidth)
                  const contentWidth = isInColumn ? defaultWidth : Math.max(0, defaultWidth - 56)
                  node.setHeight(contentWidth / naturalRatio)
                }
              })
            }
          } else if (initialHeight === undefined && editor.isEditable()) {
            editor.update(() => {
              const node = $getNodeByKey(nodeKey)
              if ($isImageNode(node)) {
                const contentWidth = isInColumn ? initialWidth : Math.max(0, initialWidth - 56)
                node.setHeight(contentWidth / naturalRatio)
              }
            })
          }
        }}
        className="select-none rounded-md border border-zinc-200/20 transition-shadow duration-200"
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          display: "block",
          boxShadow: isResizing ? "0 0 0 2px rgba(168, 85, 247, 0.4)" : "none",
        }}
      />
      
      {/* Left draggable resize handle - reveals on hover */}
      <div
        className={`
          absolute top-0 left-0 w-3 h-full z-30
          cursor-col-resize
          flex items-center justify-center
          transition-opacity duration-200
          ${isHovered || isResizing ? "opacity-100" : "opacity-0"}
        `}
        onMouseDown={handleMouseDown}
        style={{
          left: "-6px", // Center the handle on the border edge
        }}
      >
        {/* Visual indicator bar */}
        <div className="w-1.5 h-16 rounded-full bg-purple-500 hover:bg-purple-600 shadow-md border border-purple-400/25 transition-colors" />
      </div>

      {/* Right draggable resize handle - reveals on hover */}
      <div
        className={`
          absolute top-0 right-0 w-3 h-full z-30
          cursor-col-resize
          flex items-center justify-center
          transition-opacity duration-200
          ${isHovered || isResizing ? "opacity-100" : "opacity-0"}
        `}
        onMouseDown={handleMouseDown}
        style={{
          right: "-6px", // Center the handle on the border edge
        }}
      >
        {/* Visual indicator bar */}
        <div className="w-1.5 h-16 rounded-full bg-purple-500 hover:bg-purple-600 shadow-md border border-purple-400/25 transition-colors" />
      </div>
    </div>
  )
}

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

  getWidth(): number | undefined {
    return this.getLatest().__width
  }

  setWidth(width: number | undefined): void {
    const writable = this.getWritable()
    writable.__width = width
  }

  getHeight(): number | undefined {
    return this.getLatest().__height
  }

  setHeight(height: number | undefined): void {
    const writable = this.getWritable()
    writable.__height = height
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <ImageComponent
        nodeKey={this.__key}
        src={this.__src}
        alt={this.__alt}
        width={this.__width}
        height={this.__height}
      />
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

