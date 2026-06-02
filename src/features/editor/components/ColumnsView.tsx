import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Plus, Trash, Columns } from '@phosphor-icons/react';

export const ColumnsView = ({ node, editor, getPos }: NodeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [handlePositions, setHandlePositions] = useState<number[]>([]);
  const [columnsList, setColumnsList] = useState<HTMLElement[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  
  const activeResizeRef = useRef<{
    handleIndex: number;
    initialMouseX: number;
    initialLeftColWidthPercent: number;
    initialRightColWidthPercent: number;
    leftColElement: HTMLElement;
    rightColElement: HTMLElement;
  } | null>(null);

  // Measure DOM children widths and position overlay resize handles between columns
  const updateHandles = useCallback(() => {
    if (!containerRef.current) return;
    const columns = Array.from(containerRef.current.querySelectorAll('.templnote-column')) as HTMLElement[];
    setColumnsList(columns);
    
    if (columns.length <= 1) {
      setHandlePositions([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const positions: number[] = [];

    for (let i = 0; i < columns.length - 1; i++) {
      const colRect = columns[i].getBoundingClientRect();
      // Position handle perfectly in the middle gap between column i and column i+1
      const handleX = colRect.right - containerRect.left;
      positions.push(handleX);
    }
    setHandlePositions(positions);
  }, []);

  useEffect(() => {
    updateHandles();

    window.addEventListener('resize', updateHandles);

    // Watch DOM mutations internally (children additions/deletions/renders) to keep handles in sync
    const observer = new MutationObserver(updateHandles);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', updateHandles);
      observer.disconnect();
    };
  }, [node, updateHandles]);

  // Synchronize all column node widths in ProseMirror attributes if any are missing or uninitialized
  const initAllWidths = useCallback(() => {
    if (typeof getPos !== 'function' || !containerRef.current) return;
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return;

    const columns = Array.from(containerRef.current.querySelectorAll('.templnote-column')) as HTMLElement[];
    const containerWidth = containerRef.current.getBoundingClientRect().width;

    let tr = editor.state.tr;
    let currentPos = parentPos + 1;

    parentNode.forEach((childNode, offset, index) => {
      if (index < columns.length) {
        const colPx = columns[index].getBoundingClientRect().width;
        const colPercent = (colPx / containerWidth) * 100;
        tr = tr.setNodeMarkup(currentPos, undefined, {
          ...childNode.attrs,
          width: colPercent,
        });
      }
      currentPos += childNode.nodeSize;
    });

    editor.view.dispatch(tr);
  }, [editor, getPos]);

  const startResize = (event: React.MouseEvent, handleIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (!containerRef.current || typeof getPos !== 'function') return;

    const columns = Array.from(containerRef.current.querySelectorAll('.templnote-column')) as HTMLElement[];
    if (columns.length <= handleIndex + 1) return;

    const leftCol = columns[handleIndex];
    const rightCol = columns[handleIndex + 1];

    const containerWidth = containerRef.current.getBoundingClientRect().width;

    // Check if any columns are missing width configurations
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    let hasMissingWidth = false;
    parentNode?.forEach(child => {
      if (child.attrs.width === null) hasMissingWidth = true;
    });

    if (hasMissingWidth) {
      initAllWidths();
    }

    // Capture starting state percentages
    const leftWidthPx = leftCol.getBoundingClientRect().width;
    const rightWidthPx = rightCol.getBoundingClientRect().width;

    const leftWidthPercent = (leftWidthPx / containerWidth) * 100;
    const rightWidthPercent = (rightWidthPx / containerWidth) * 100;

    activeResizeRef.current = {
      handleIndex,
      initialMouseX: event.clientX,
      initialLeftColWidthPercent: leftWidthPercent,
      initialRightColWidthPercent: rightWidthPercent,
      leftColElement: leftCol,
      rightColElement: rightCol,
    };

    setIsResizing(true);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResize = (event: MouseEvent) => {
    if (!activeResizeRef.current || !containerRef.current) return;
    const { initialMouseX, initialLeftColWidthPercent, initialRightColWidthPercent, leftColElement, rightColElement } = activeResizeRef.current;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const deltaX = event.clientX - initialMouseX;
    const deltaPercent = (deltaX / containerWidth) * 100;

    let newLeftPercent = initialLeftColWidthPercent + deltaPercent;
    let newRightPercent = initialRightColWidthPercent - deltaPercent;

    // Enforce solid minimum column width percentage (12%) to preserve visibility
    const MIN_COLUMN_WIDTH = 12;
    if (newLeftPercent < MIN_COLUMN_WIDTH) {
      const diff = MIN_COLUMN_WIDTH - newLeftPercent;
      newLeftPercent = MIN_COLUMN_WIDTH;
      newRightPercent -= diff;
    }
    if (newRightPercent < MIN_COLUMN_WIDTH) {
      const diff = MIN_COLUMN_WIDTH - newRightPercent;
      newRightPercent = MIN_COLUMN_WIDTH;
      newLeftPercent -= diff;
    }

    // Snapping guidelines at 25%, 33.33%, 50%, 66.66%, 75%
    const snapPoints = [25, 33.33, 50, 66.66, 75];
    const SNAP_THRESHOLD = 2; // snap when within 2%
    for (const snapPoint of snapPoints) {
      if (Math.abs(newLeftPercent - snapPoint) < SNAP_THRESHOLD) {
        newLeftPercent = snapPoint;
        newRightPercent = (initialLeftColWidthPercent + initialRightColWidthPercent) - newLeftPercent;
        break;
      }
    }

    // Direct DOM manipulation guarantees extremely responsive 60fps scrolling/resizing feedback
    leftColElement.style.width = `${newLeftPercent}%`;
    rightColElement.style.width = `${newRightPercent}%`;
  };

  const stopResize = () => {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setIsResizing(false);

    if (!activeResizeRef.current || typeof getPos !== 'function') {
      activeResizeRef.current = null;
      return;
    }

    const { handleIndex, leftColElement, rightColElement } = activeResizeRef.current;
    const finalLeftPercent = parseFloat(leftColElement.style.width);
    const finalRightPercent = parseFloat(rightColElement.style.width);

    activeResizeRef.current = null;

    // Dispatch a single ProseMirror transaction committing both column widths
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return;

    let tr = editor.state.tr;
    let currentPos = parentPos + 1;

    parentNode.forEach((childNode, offset, index) => {
      if (index === handleIndex) {
        tr = tr.setNodeMarkup(currentPos, undefined, {
          ...childNode.attrs,
          width: finalLeftPercent,
        });
      } else if (index === handleIndex + 1) {
        tr = tr.setNodeMarkup(currentPos, undefined, {
          ...childNode.attrs,
          width: finalRightPercent,
        });
      }
      currentPos += childNode.nodeSize;
    });

    editor.view.dispatch(tr);
    updateHandles();
  };

  // Helper to find absolute position of column index
  const getColumnPos = (targetIndex: number) => {
    if (typeof getPos !== 'function') return null;
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return null;

    let currentPos = parentPos + 1;
    let targetPos = -1;
    let targetNode = null;

    parentNode.forEach((childNode, offset, idx) => {
      if (idx === targetIndex) {
        targetPos = currentPos;
        targetNode = childNode;
      }
      currentPos += childNode.nodeSize;
    });

    return { pos: targetPos, node: targetNode };
  };
  // Presets system cycling
  const cyclePresets = () => {
    if (typeof getPos !== 'function') return;
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return;

    if (parentNode.childCount !== 2) {
      // 3+ columns: toggle between equal widths and 'auto'
      const isAllAuto = parentNode.child(0).attrs.width === 'auto';
      const childCount = parentNode.childCount;
      const targetWidth = isAllAuto ? (100 / childCount) : 'auto';

      let tr = editor.state.tr;
      let currentPos = parentPos + 1;
      parentNode.forEach((childNode) => {
        tr = tr.setNodeMarkup(currentPos, undefined, {
          ...childNode.attrs,
          width: targetWidth,
        });
        currentPos += childNode.nodeSize;
      });
      editor.view.dispatch(tr);
      setTimeout(updateHandles, 0);
      return;
    }

    // 2 Columns cycle: Equal (50/50), Adaptive (auto/auto), Left heavy (66/34), Right heavy (34/66), Left wide (75/25), Right wide (25/75), 40/60, 60/40
    const firstCol = parentNode.child(0);
    const isCurrentAuto = firstCol.attrs.width === 'auto';

    const presets = [
      [50, 50],
      ['auto', 'auto'],
      [66.66, 33.33],
      [33.33, 66.66],
      [75, 25],
      [25, 75],
      [40, 60],
      [60, 40]
    ];

    let closestIdx = 0;
    if (isCurrentAuto) {
      closestIdx = 1;
    } else {
      const currentWidth = firstCol.attrs.width !== null ? parseFloat(firstCol.attrs.width) : 50;
      let minDiff = Infinity;
      presets.forEach((preset, idx) => {
        if (preset[0] === 'auto') return;
        const diff = Math.abs((preset[0] as number) - currentWidth);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
    }

    const nextIdx = (closestIdx + 1) % presets.length;
    const nextPreset = presets[nextIdx];

    let tr = editor.state.tr;
    let currentPos = parentPos + 1;
    parentNode.forEach((childNode, offset, index) => {
      tr = tr.setNodeMarkup(currentPos, undefined, {
        ...childNode.attrs,
        width: nextPreset[index],
      });
      currentPos += childNode.nodeSize;
    });

    editor.view.dispatch(tr);
    setTimeout(updateHandles, 0);
  };

  const addColumnAt = (targetIndex: number) => {
    if (typeof getPos !== 'function') return;
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return;

    const colInfo = getColumnPos(targetIndex);
    if (!colInfo || colInfo.pos === -1 || !colInfo.node) return;

    const insertPos = colInfo.pos + colInfo.node.nodeSize;
    const newColumn = editor.state.schema.nodes.column.createAndFill();
    if (newColumn) {
      let tr = editor.state.tr.insert(insertPos, newColumn);
      const newChildCount = parentNode.childCount + 1;
      const equalWidth = 100 / newChildCount;

      const updatedParent = tr.doc.nodeAt(parentPos);
      if (updatedParent) {
        let currentPos = parentPos + 1;
        updatedParent.forEach((childNode) => {
          tr = tr.setNodeMarkup(currentPos, undefined, {
            ...childNode.attrs,
            width: equalWidth,
          });
          currentPos += childNode.nodeSize;
        });
      }
      editor.view.dispatch(tr);
      setTimeout(updateHandles, 0);
    }
  };

  const deleteColumnAt = (targetIndex: number) => {
    if (typeof getPos !== 'function') return;
    const parentPos = getPos();
    const parentNode = editor.state.doc.nodeAt(parentPos);
    if (!parentNode) return;

    const colInfo = getColumnPos(targetIndex);
    if (!colInfo || colInfo.pos === -1 || !colInfo.node) return;

    let tr = editor.state.tr;
    if (parentNode.childCount <= 1) {
      // unwraps by deleting entire columns node
      tr = tr.delete(parentPos, parentPos + parentNode.nodeSize);
    } else {
      tr = tr.delete(colInfo.pos, colInfo.pos + colInfo.node.nodeSize);
      const newChildCount = parentNode.childCount - 1;
      const equalWidth = 100 / newChildCount;

      const updatedParent = tr.doc.nodeAt(parentPos);
      if (updatedParent) {
        let currentPos = parentPos + 1;
        updatedParent.forEach((childNode) => {
          tr = tr.setNodeMarkup(currentPos, undefined, {
            ...childNode.attrs,
            width: equalWidth,
          });
          currentPos += childNode.nodeSize;
        });
      }
    }
    editor.view.dispatch(tr);
    setTimeout(updateHandles, 0);
  };

  return (
    <NodeViewWrapper className="relative group/columns w-full">
      {/* Column Count Badge top left */}
      <div className="absolute -top-3.5 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 opacity-0 group-hover/columns:opacity-100 transition-opacity duration-150 pointer-events-none select-none z-30">
        {node.childCount} cols
      </div>

      {/* Snap guidelines */}
      {isResizing && [25, 33.33, 50, 66.66, 75].map((percent) => (
        <div
          key={percent}
          className="absolute top-0 bottom-0 pointer-events-none z-10 border-l border-dashed border-purple-500/30"
          style={{ left: `${percent}%` }}
        />
      ))}

      {/* Absolute floating overlay resize handles */}
      {handlePositions.map((pos, idx) => (
        <div
          key={idx}
          className="column-resize-handle absolute top-0 bottom-0 cursor-col-resize z-20 transition-all select-none hover:bg-purple-500/50 flex items-center justify-center"
          style={{ left: `${pos}px`, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => startResize(e, idx)}
        >
          {/* Subtly show the handle grab dots on hover */}
          <div className="w-[4px] h-[20px] rounded-full bg-purple-500/30 flex flex-col gap-[2px] items-center justify-center py-1 opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-[1.5px] h-[1.5px] rounded-full bg-purple-400" />
            <div className="w-[1.5px] h-[1.5px] rounded-full bg-purple-400" />
            <div className="w-[1.5px] h-[1.5px] rounded-full bg-purple-400" />
          </div>
        </div>
      ))}

      {/* Actual inner columns DOM rendered inside flex card wrapper */}
      <div ref={containerRef} className="w-full">
        <NodeViewContent className="templnote-columns flex gap-4 w-full" />
      </div>

      {/* Column Toolbars via React Portals inside individual columns */}
      {columnsList.map((colEl, idx) => {
        return createPortal(
          <div
            key={idx}
            className="column-toolbar absolute top-2 right-2 flex items-center gap-1 bg-background/90 border border-border/40 text-muted-foreground/60 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30 select-none shadow-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => cyclePresets()}
              className="w-5 h-5 rounded-sm hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              title="Cycle column layout presets (Equal, 1/3+2/3, 2/3+1/3, etc.)"
            >
              <Columns size={12} weight="bold" />
            </button>
            <button
              onClick={() => addColumnAt(idx)}
              className="w-5 h-5 rounded-sm hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              title="Add column to the right"
            >
              <Plus size={12} weight="bold" />
            </button>
            <button
              onClick={() => deleteColumnAt(idx)}
              className="w-5 h-5 rounded-sm hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              title="Delete column"
            >
              <Trash size={12} weight="bold" />
            </button>
          </div>,
          colEl
        );
      })}
    </NodeViewWrapper>
  );
};
