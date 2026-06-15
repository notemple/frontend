import { useFloating, flip, shift, offset as floatingOffset, autoUpdate, type Placement, type ComputePositionReturn } from "@floating-ui/react"
import { useCallback, useLayoutEffect, useRef, useState, type RefCallback, type RefObject } from "react"

const VIEWPORT_PADDING = 8

export interface PopupPositionOptions {
  /** Preferred placement relative to the trigger */
  placement?: Placement
  /** Gap in px between trigger and popup */
  offset?: number
  /** Whether to flip to the opposite side when there's not enough space */
  flip?: boolean
  /** Whether to shift horizontally to stay within viewport */
  shift?: boolean
  /** Whether the popup is open (enables autoUpdate) */
  open?: boolean
  /** Max height of the popup for flip calculations */
  maxHeight?: number
  /** Max width of the popup for flip calculations */
  maxWidth?: number
}

/**
 * Centralized positioning rule for all popups in the editor:
 * 1. Preferred: Open below the trigger, fully visible
 * 2. Flip: If not enough space below, open above
 * 3. Shift: Clamp to viewport edges (min 8px from edges)
 * 4. Fallback: Use whichever side has more room, clamped to viewport
 */
export function usePortalPosition({
  placement = "bottom-start",
  offset: gap = 8,
  flip: enableFlip = true,
  shift: enableShift = true,
  open = true,
  maxHeight,
  maxWidth,
}: PopupPositionOptions = {}) {
  const referenceRef = useRef<HTMLElement | null>(null)
  const floatingRef = useRef<HTMLElement | null>(null)

  const middleware = [
    floatingOffset(gap),
    ...(enableFlip
      ? [
          flip({
            fallbackAxisSideDirection: "none",
            crossAxis: false,
            padding: VIEWPORT_PADDING,
            ...(maxHeight ? { boundary: undefined } : {}),
          }),
        ]
      : []),
    ...(enableShift
      ? [
          shift({
            padding: VIEWPORT_PADDING,
            crossAxis: true,
          }),
        ]
      : []),
  ]

  const { refs, floatingStyles, placement: resolvedPlacement, update } = useFloating({
    placement,
    open,
    whileElementsMounted: autoUpdate,
    middleware,
  })

  const setReference: RefCallback<HTMLElement> = useCallback(
    (node) => {
      referenceRef.current = node
      refs.setReference(node)
    },
    [refs]
  )

  const setFloating: RefCallback<HTMLElement> = useCallback(
    (node) => {
      floatingRef.current = node
      refs.setFloating(node)
    },
    [refs]
  )

  // Force update when open state changes to recalculate position
  useLayoutEffect(() => {
    if (open) {
      update()
    }
  }, [open, update])

  return {
    refs: {
      reference: setReference,
      floating: setFloating,
      referenceRef,
      floatingRef,
    },
    floatingStyles: {
      ...floatingStyles,
      position: "absolute" as const,
    },
    placement: resolvedPlacement,
    update,
  }
}

// ─── Pure function for imperative use (editor menus with caret rects) ──────────

interface RectLike {
  top: number
  bottom: number
  left: number
  width?: number
  right?: number
}

interface PurePositionOptions {
  preferredPlacement?: "bottom" | "top"
  offset?: number
  menuWidth: number
  menuHeight: number
  viewportWidth?: number
  viewportHeight?: number
  /** Center horizontally on the trigger instead of left-aligning */
  centerHorizontally?: boolean
}

export interface PurePositionResult {
  top: number
  left: number
  placement: "bottom" | "top"
}

/**
 * Pure function to calculate popup position from a trigger rect.
 * Encapsulates the centralized rule without React dependencies.
 */
export function getPopupPosition(
  triggerRect: RectLike,
  options: PurePositionOptions
): PurePositionResult {
  const {
    preferredPlacement = "bottom",
    offset: gap = 8,
    menuWidth,
    menuHeight,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
  } = options

  const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING
  const spaceAbove = triggerRect.top - VIEWPORT_PADDING

  // Determine vertical placement
  let placement: "bottom" | "top" = preferredPlacement
  let top: number

  if (preferredPlacement === "bottom") {
    if (spaceBelow >= menuHeight) {
      placement = "bottom"
      top = triggerRect.bottom + gap
    } else if (spaceAbove >= menuHeight) {
      placement = "top"
      top = triggerRect.top - menuHeight - gap
    } else {
      // Neither side has enough space — use whichever has more room
      placement = spaceBelow >= spaceAbove ? "bottom" : "top"
      if (placement === "bottom") {
        top = triggerRect.bottom + gap
      } else {
        top = triggerRect.top - menuHeight - gap
      }
    }
  } else {
    // preferredPlacement === "top"
    if (spaceAbove >= menuHeight) {
      placement = "top"
      top = triggerRect.top - menuHeight - gap
    } else if (spaceBelow >= menuHeight) {
      placement = "bottom"
      top = triggerRect.bottom + gap
    } else {
      placement = spaceAbove >= spaceBelow ? "top" : "bottom"
      if (placement === "top") {
        top = triggerRect.top - menuHeight - gap
      } else {
        top = triggerRect.bottom + gap
      }
    }
  }

  // Horizontal position: center or left-align, clamped to viewport
  let left: number
  if (options.centerHorizontally) {
    left = triggerRect.left + (triggerRect.width ?? 0) / 2 - menuWidth / 2
  } else {
    left = triggerRect.left
  }
  left = Math.max(VIEWPORT_PADDING, Math.min(left, viewportWidth - menuWidth - VIEWPORT_PADDING))

  // Clamp vertical position to viewport
  top = Math.max(VIEWPORT_PADDING, Math.min(top, viewportHeight - menuHeight - VIEWPORT_PADDING))

  return { top, left, placement }
}

// ─── Hook wrapper for editor menus (combines ref + rect measurement) ───────────

export interface EditorMenuPositionOptions extends Omit<PurePositionOptions, "menuWidth" | "menuHeight"> {
  /** The trigger rect from DOM selection/caret */
  triggerRect: RectLike | null
  /** Whether the menu is open */
  open: boolean
  /** Center horizontally on the trigger instead of left-aligning */
  centerHorizontally?: boolean
  /** Fallback max height if menu measurement fails */
  maxHeight?: number
  /** Fallback max width if menu measurement fails */
  maxWidth?: number
}

export interface EditorMenuPositionReturn {
  /** Ref to attach to the menu container for measurement */
  menuRef: RefCallback<HTMLDivElement>
  /** Calculated styles to apply to the menu */
  style: React.CSSProperties
  /** The resolved placement */
  placement: "bottom" | "top"
}

/**
 * Hook for editor floating menus that position from a caret/selection rect.
 * Measures the menu after render, then calculates optimal position.
 */
export function useEditorMenuPosition({
  triggerRect,
  open,
  preferredPlacement = "bottom",
  offset: gap = 8,
  maxHeight = 350,
  maxWidth = 300,
  centerHorizontally = false,
}: EditorMenuPositionOptions): EditorMenuPositionReturn {
  const menuRefInternal = useRef<HTMLDivElement | null>(null)
  const [menuSize, setMenuSize] = useState<{ width: number; height: number } | null>(null)
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999, zIndex: 9999 })
  const [resolvedPlacement, setResolvedPlacement] = useState<"bottom" | "top">(preferredPlacement)

  const setMenuRef: RefCallback<HTMLDivElement> = useCallback((node) => {
    menuRefInternal.current = node
    if (node) {
      const rect = node.getBoundingClientRect()
      setMenuSize({ width: rect.width || maxWidth, height: rect.height || maxHeight })
    }
  }, [maxWidth, maxHeight])

  useLayoutEffect(() => {
    if (!open || !triggerRect || !menuSize) return

    const result = getPopupPosition(triggerRect, {
      preferredPlacement,
      offset: gap,
      menuWidth: menuSize.width,
      menuHeight: menuSize.height,
      centerHorizontally,
    })

    setStyle({
      position: "fixed",
      top: result.top,
      left: result.left,
      zIndex: 9999,
    })
    setResolvedPlacement(result.placement)
  }, [open, triggerRect, menuSize, preferredPlacement, gap])

  return {
    menuRef: setMenuRef,
    style,
    placement: resolvedPlacement,
  }
}
