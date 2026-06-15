import { useCallback, useLayoutEffect, useRef, useState, type RefCallback, type RefObject } from "react"

const VIEWPORT_PADDING = 8

interface ContextMenuPositionOptions {
  /** Mouse event coordinates */
  x: number
  y: number
  /** Whether the menu is open */
  open: boolean
  /** Estimated menu dimensions before measurement */
  estimatedWidth?: number
  estimatedHeight?: number
}

export interface ContextMenuPositionReturn {
  /** Ref callback to attach to the menu container for measurement */
  menuRef: RefCallback<HTMLDivElement>
  /** Ref object to access the menu DOM element (for outside-click detection etc.) */
  menuRefObject: RefObject<HTMLDivElement | null>
  /** Calculated styles to apply to the menu */
  style: React.CSSProperties
}

/**
 * Centralized positioning rule for context menus:
 * 1. Show at cursor position
 * 2. If menu overflows right edge, align to right of cursor
 * 3. If menu overflows bottom edge, align to bottom of cursor
 * 4. Clamp to viewport with 8px padding
 */
export function useContextMenuPosition({
  x,
  y,
  open,
  estimatedWidth = 200,
  estimatedHeight = 250,
}: ContextMenuPositionOptions): ContextMenuPositionReturn {
  const menuRefInternal = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: estimatedWidth,
    height: estimatedHeight,
  })
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: y,
    left: x,
    zIndex: 9999,
  })

  const setMenuRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    menuRefInternal.current = node
    if (node) {
      const rect = node.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    const { width, height } = size
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    // Horizontal: try at cursor, clamp to viewport
    let left = x
    if (left + width > viewportW - VIEWPORT_PADDING) {
      left = x - width // Flip to left of cursor
    }
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING
    }

    // Vertical: try at cursor, clamp to viewport
    let top = y
    if (top + height > viewportH - VIEWPORT_PADDING) {
      top = y - height // Flip to above cursor
    }
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING
    }

    setStyle({
      position: "fixed",
      top,
      left,
      zIndex: 9999,
    })
  }, [x, y, open, size])

  return {
    menuRef: setMenuRef,
    menuRefObject: menuRefInternal,
    style,
  }
}
