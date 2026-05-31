/**
 * EditorDndContext
 *
 * Provides a dnd-kit DndContext that wraps the editor area.
 * Drag logic:
 *  - PointerSensor with 5px activation distance (feels intentional, not accidental)
 *  - onDragStart  → fade source block, snapshot HTML for overlay
 *  - onDragMove   → track cursor Y, update insertion indicator via fixed positioning
 *  - onDragEnd    → commit reorder via ProseMirror transaction
 *
 * The DragOverlay and drop indicator both use fixed/portal positioning so they are
 * never clipped by overflow:hidden or z-index stacking contexts inside the editor.
 */

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Editor } from '@tiptap/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveDragInfo {
  blockIndex: number;
  blockElement: HTMLElement;
  overlayHtml: string;
  editorFontFamily: string;
  editorFontSize: string;
  editorColor: string;
  editorBgColor: string;
  editorWidth: number;
}

interface IndicatorState {
  visible: boolean;
  /** Viewport-space Y (used with position:fixed) */
  clientTop: number;
  /** Viewport-space X */
  clientLeft: number;
  width: number;
}

interface EditorDndContextProps {
  editor: Editor;
  children: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Helper to walk up ancestors and find the actual background color of the element */
function getElementBackgroundColor(el: HTMLElement): string {
  let current: HTMLElement | null = el;
  while (current) {
    const bg = window.getComputedStyle(current).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgba(0,0,0,0)') {
      return bg;
    }
    current = current.parentElement;
  }
  return 'var(--background)';
}

/** Returns the ordered list of draggable top-level ProseMirror blocks. */
function getEditorBlocks(): HTMLElement[] {
  const pm = document.querySelector('.ProseMirror');
  if (!pm) return [];
  return Array.from(pm.children).filter(
    (el) => !(el as HTMLElement).classList.contains('block-handle-container')
  ) as HTMLElement[];
}

/** Collect top-level ProseMirror block positions from the doc. */
function collectBlockPositions(editor: Editor): { from: number; to: number }[] {
  const positions: { from: number; to: number }[] = [];
  editor.state.doc.forEach((node, offset) => {
    positions.push({ from: offset, to: offset + node.nodeSize });
  });
  return positions;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DropIndicatorProps {
  state: IndicatorState;
}

const DropIndicator = React.memo(({ state }: DropIndicatorProps) => {
  if (!state.visible) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: state.clientTop,
        left: state.clientLeft,
        width: state.width,
        height: 2,
        zIndex: 9999,
        borderRadius: 2,
        background: 'var(--color-primary, #7c3aed)',
        pointerEvents: 'none',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'top',
      }}
    />
  );
});
DropIndicator.displayName = 'DropIndicator';

interface DragBlockProps {
  html: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  backgroundColor: string;
  width: number;
}

const DragBlock = React.memo(({ html, fontFamily, fontSize, color, backgroundColor, width }: DragBlockProps) => (
  <div
    aria-hidden="true"
    style={{
      opacity: 0.92,
      background: backgroundColor || 'var(--background)',
      color: color || 'inherit',
      width: width ? `${width}px` : 'auto',
      borderRadius: 6,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      padding: '2px 0',
      pointerEvents: 'none',
      willChange: 'transform',
      transform: 'translate3d(0, 0, 0)',
      fontFamily: fontFamily || 'inherit',
      fontSize: fontSize || 'inherit',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
    className="prose prose-sm sm:prose w-full max-w-none tiptap ProseMirror"
    dangerouslySetInnerHTML={{ __html: html }}
  />
));
DragBlock.displayName = 'DragBlock';

// ─── Main Context ─────────────────────────────────────────────────────────────

export const EditorDndContext = ({ editor, children }: EditorDndContextProps) => {
  const [indicator, setIndicator] = useState<IndicatorState>({
    visible: false, clientTop: 0, clientLeft: 0, width: 0,
  });
  const [isActiveDrag, setIsActiveDrag] = useState(false);
  const [overlayHtml, setOverlayHtml] = useState('');
  const [overlayFontFamily, setOverlayFontFamily] = useState('');
  const [overlayFontSize, setOverlayFontSize] = useState('');
  const [overlayColor, setOverlayColor] = useState('');
  const [overlayBgColor, setOverlayBgColor] = useState('');
  const [overlayWidth, setOverlayWidth] = useState<number>(0);

  // Refs for values needed inside callbacks without triggering re-renders
  const activeDragRef = useRef<ActiveDragInfo | null>(null);
  const overIndexRef = useRef<number>(-1);
  const overPositionRef = useRef<'above' | 'below'>('below');
  const dragStartClientYRef = useRef(0);
  const lastXRef = useRef(0);
  const tiltRef = useRef(0);

  // 5px activation distance — feels intentional, prevents accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Indicator logic ─────────────────────────────────────────────────────────

  const updateIndicator = useCallback((clientY: number, skipIndex: number) => {
    const blocks = getEditorBlocks();
    if (blocks.length === 0) return;

    let bestIndex = -1;
    let bestDist = Infinity;
    let insertPos: 'above' | 'below' = 'below';

    for (let i = 0; i < blocks.length; i++) {
      if (i === skipIndex) continue;
      const rect = blocks[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
        insertPos = clientY < mid ? 'above' : 'below';
      }
    }

    // Suppress indicator for positions equivalent to the current location
    const isNoOp =
      bestIndex < 0 ||
      bestIndex === skipIndex ||
      (insertPos === 'above' && bestIndex === skipIndex + 1) ||
      (insertPos === 'below' && bestIndex === skipIndex - 1);

    if (isNoOp) {
      overIndexRef.current = -1;
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }

    overIndexRef.current = bestIndex;
    overPositionRef.current = insertPos;

    const pm = document.querySelector('.ProseMirror');
    const pmRect = pm ? pm.getBoundingClientRect() : null;

    const targetRect = blocks[bestIndex].getBoundingClientRect();
    const lineClientTop =
      insertPos === 'above' ? targetRect.top - 1 : targetRect.bottom + 1;

    setIndicator({
      visible: true,
      clientTop: lineClientTop,
      clientLeft: pmRect ? pmRect.left : targetRect.left,
      width: pmRect ? pmRect.width : targetRect.width,
    });
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Restore every block that may have been faded
    getEditorBlocks().forEach((b) => {
      b.style.opacity = '';
      b.style.transition = '';
    });
    activeDragRef.current = null;
    overIndexRef.current = -1;
    setIsActiveDrag(false);
    setOverlayHtml('');
    setOverlayWidth(0);
    lastXRef.current = 0;
    tiltRef.current = 0;
    setIndicator({ visible: false, clientTop: 0, clientLeft: 0, width: 0 });
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { blockIndex, activeElement } = (event.active.data.current ?? {}) as {
      blockIndex?: number;
      activeElement?: HTMLElement | null;
    };

    if (blockIndex === undefined || blockIndex < 0 || !activeElement) return;

    // Store drag start pointer position so we can reconstruct cursor Y in onDragMove
    dragStartClientYRef.current = (event.activatorEvent as PointerEvent).clientY;

    // Compute editor font info for the overlay so it inherits the right typeface
    const computed = window.getComputedStyle(activeElement);

    // Snapshot source block HTML
    const html = activeElement.outerHTML;
    const fontFamily = computed.fontFamily;
    const fontSize = computed.fontSize;
    const color = computed.color;
    const bgColor = getElementBackgroundColor(activeElement);
    const width = activeElement.getBoundingClientRect().width;

    // Gently fade the source block (it stays in place as a placeholder)
    activeElement.style.opacity = '0.22';
    activeElement.style.transition = 'opacity 120ms ease';

    activeDragRef.current = {
      blockIndex,
      blockElement: activeElement,
      overlayHtml: html,
      editorFontFamily: fontFamily,
      editorFontSize: fontSize,
      editorColor: color,
      editorBgColor: bgColor,
      editorWidth: width,
    };

    setOverlayHtml(html);
    setOverlayFontFamily(fontFamily);
    setOverlayFontSize(fontSize);
    setOverlayColor(color);
    setOverlayBgColor(bgColor);
    setOverlayWidth(width);
    setIsActiveDrag(true);

    // Apply wobbly elastic spring entry scale immediately on start
    setTimeout(() => {
      const overlayEl = document.querySelector('[data-dnd-overlay]') as HTMLElement;
      if (overlayEl) {
        const dragBlock = overlayEl.firstElementChild as HTMLElement;
        if (dragBlock) {
          dragBlock.style.transform = 'scale(1.025)';
          dragBlock.style.transition = 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)'; // Wobbly elastic spring entry
        }
      }
    }, 0);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const info = activeDragRef.current;
    if (!info) return;
    const currentY = dragStartClientYRef.current + event.delta.y;
    updateIndicator(currentY, info.blockIndex);

    // Calculate mouse velocity on X axis to skew/tilt the block
    const deltaX = event.delta.x - lastXRef.current;
    lastXRef.current = event.delta.x;
    
    // Smoothly interpolate the tilt (max 4.5 degrees)
    const targetTilt = Math.max(-4.5, Math.min(4.5, deltaX * 0.15));
    tiltRef.current = tiltRef.current * 0.82 + targetTilt * 0.18;
    
    // Update the transform of the overlay's child directly in DOM for smooth wobbly 60fps movement
    const overlayEl = document.querySelector('[data-dnd-overlay]') as HTMLElement;
    if (overlayEl) {
      const dragBlock = overlayEl.firstElementChild as HTMLElement;
      if (dragBlock) {
        dragBlock.style.transform = `scale(1.025) rotate(${tiltRef.current}deg) skewX(${tiltRef.current * 0.4}deg)`;
        dragBlock.style.transition = 'transform 80ms cubic-bezier(0.25, 0.8, 0.25, 1)';
      }
    }
  }, [updateIndicator]);

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    const info = activeDragRef.current;
    const fromIndex = info?.blockIndex ?? -1;
    const toIndex = overIndexRef.current;
    const toPosition = overPositionRef.current;

    // Run cleanup before PM dispatch so the UI snaps immediately
    cleanup();

    if (fromIndex < 0 || toIndex < 0) return;

    const positions = collectBlockPositions(editor);
    if (fromIndex >= positions.length || toIndex >= positions.length) return;

    const src = positions[fromIndex];
    const nodeSize = src.to - src.from;
    const slice = editor.state.doc.slice(src.from, src.to);

    let tr = editor.state.tr;
    let destPos = 0;

    if (fromIndex > toIndex) {
      // ── Moving UP ──
      // Insert at destination first, then delete the original (which has shifted +nodeSize)
      destPos =
        toPosition === 'above' ? positions[toIndex].from : positions[toIndex].to;
      tr = tr.insert(destPos, slice.content);
      tr = tr.delete(src.from + nodeSize, src.to + nodeSize);
    } else {
      // ── Moving DOWN ──
      // Delete original first, then insert at the now-shifted destination
      const rawDest =
        toPosition === 'above' ? positions[toIndex].from : positions[toIndex].to;
      tr = tr.delete(src.from, src.to);
      // After deletion everything >= src.from shifts by -nodeSize
      destPos = rawDest - nodeSize;
      tr = tr.insert(destPos, slice.content);
    }

    // Don't clean up if the moved block itself is an empty paragraph
    const isMovedBlockEmptyParagraph =
      slice.content.firstChild &&
      slice.content.firstChild.type.name === 'paragraph' &&
      slice.content.firstChild.content.size === 0;

    if (!isMovedBlockEmptyParagraph) {
      // 1. Clean up empty paragraphs immediately following the dropped block
      const $after = tr.doc.resolve(destPos + nodeSize);
      if ($after.nodeAfter && $after.nodeAfter.type.name === 'paragraph' && $after.nodeAfter.content.size === 0) {
        tr = tr.delete(destPos + nodeSize, destPos + nodeSize + $after.nodeAfter.nodeSize);
      }

      // 2. Clean up empty paragraphs immediately preceding the dropped block
      const $before = tr.doc.resolve(destPos);
      if ($before.nodeBefore && $before.nodeBefore.type.name === 'paragraph' && $before.nodeBefore.content.size === 0) {
        tr = tr.delete(destPos - $before.nodeBefore.nodeSize, destPos);
      }
    }

    editor.view.dispatch(tr);
  }, [editor, cleanup]);

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={cleanup}
      >
        {children}

        {/* DragOverlay must live inside DndContext, rendered in a portal to prevent coordinate offsets */}
        {createPortal(
          <DragOverlay dropAnimation={null} zIndex={9998} className="dnd-drag-overlay">
            {isActiveDrag && overlayHtml ? (
              <DragBlock
                html={overlayHtml}
                fontFamily={overlayFontFamily}
                fontSize={overlayFontSize}
                color={overlayColor}
                backgroundColor={overlayBgColor}
                width={overlayWidth}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Drop indicator — rendered in a portal directly under document.body to ensure fixed coordinate space alignment */}
      {createPortal(<DropIndicator state={indicator} />, document.body)}
    </>
  );
};
