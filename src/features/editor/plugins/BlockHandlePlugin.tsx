import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { $getNodeByKey, $createParagraphNode } from "lexical"
import { DotsSixVertical, Plus } from "@phosphor-icons/react"

interface HandleState {
  top: number
  left: number
  nodeKey: string
}

export default function BlockHandlePlugin(): ReactNode {
  const [editor] = useLexicalComposerContext()
  const [handle, setHandle] = useState<HandleState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return

    const onMouseMove = (e: MouseEvent) => {
      clearTimeout(hideTimer.current)

      // Walk up from the hovered element to find a direct child of the
      // lexical root — that is the top-level block
      let target = e.target as HTMLElement | null
      while (target && target.parentElement !== root) {
        target = target.parentElement
      }
      if (!target || target === root) {
        scheduleHide()
        return
      }

      const key = target.getAttribute("data-lexical-node-key") ??
        // Lexical sets __key on the DOM node — walk children to find it
        (() => {
          let found: string | null = null
          root.querySelectorAll("[data-lexical-node-key]").forEach((el) => {
            if (el === target || el.contains(target!)) found =
              (el as HTMLElement).getAttribute("data-lexical-node-key")
          })
          return found
        })()

      const rect = target.getBoundingClientRect()
      const rootRect = root.getBoundingClientRect()

      setHandle({
        top: rect.top + window.scrollY,
        left: rootRect.left + window.scrollX - 56, // 56px into the left gutter
        nodeKey: key ?? "",
      })
    }

    const scheduleHide = () => {
      hideTimer.current = setTimeout(() => setHandle(null), 300)
    }

    const onMouseLeave = () => scheduleHide()

    root.addEventListener("mousemove", onMouseMove)
    root.addEventListener("mouseleave", onMouseLeave)

    return () => {
      root.removeEventListener("mousemove", onMouseMove)
      root.removeEventListener("mouseleave", onMouseLeave)
      clearTimeout(hideTimer.current)
    }
  }, [editor])

  if (!handle) return null

  const handleAddBlock = () => {
    editor.update(() => {
      if (!handle.nodeKey) return
      const node = $getNodeByKey(handle.nodeKey)
      if (!node) return
      const para = $createParagraphNode()
      node.insertAfter(para)
      para.selectEnd()
    })
    setHandle(null)
  }

  return createPortal(
    <div
      className="block-handle-group flex items-center gap-0.5"
      style={{
        position: "fixed",
        top: handle.top + 2,
        left: handle.left,
        zIndex: 50,
      }}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={() => {
        hideTimer.current = setTimeout(() => setHandle(null), 300)
      }}
    >
      {/* Add block button */}
      <button
        onClick={handleAddBlock}
        className="block-handle-btn opacity-0 group-hover:opacity-100
          w-5 h-5 flex items-center justify-center rounded
          text-[var(--muted-foreground)] hover:text-[var(--foreground)]
          hover:bg-[var(--muted)] transition-all duration-150"
        title="Add block below"
      >
        <Plus size={13} weight="bold" />
      </button>

      {/* Drag handle */}
      <div
        className="block-handle-btn
          w-5 h-5 flex items-center justify-center rounded cursor-grab
          text-[var(--muted-foreground)] hover:text-[var(--foreground)]
          hover:bg-[var(--muted)] transition-all duration-150"
        title="Drag to move · Click to open menu"
      >
        <DotsSixVertical size={13} weight="bold" />
      </div>
    </div>,
    document.body
  )
}
