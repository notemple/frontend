import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { 
  $getNearestNodeFromDOMNode, 
  $createParagraphNode, 
  $isElementNode,
  $copyNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
} from "lexical"
import type { LexicalNode } from "lexical"
import { 
  TableCellNode, 
  $insertTableRowAtSelection, 
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
  $isTableRowNode,
  $isTableCellNode,
  $findTableNode,
  $isTableNode
} from "@lexical/table"
import { TAG_COLOR_PRESETS } from "@/shared/constants/colors"
import { useDocumentStore } from "../../documents/store"

interface HoveredCellInfo {
  cellDOM: HTMLElement
  tableDOM: HTMLTableElement
  cellNodeKey: string
}

interface CoordsInfo {
  tableTop: number
  tableLeft: number
  tableWidth: number
  tableHeight: number
  
  cellTop: number
  cellLeft: number
  cellWidth: number
  cellHeight: number
  
  colIndex: number
  rowIndex: number
  
  firstCellDOM: HTMLElement
  lastCellDOM: HTMLElement
}

interface CellCoordsInfo {
  top: number
  left: number
  width: number
  height: number
  cellNodeKey: string
}

interface MenuState {
  type: 'row' | 'column' | 'cell'
  index: number
  top: number
  left: number
}

interface TooltipState {
  text: string
  top: number
  left: number
}

// Helper function to recursively duplicate nodes using Lexical's $copyNode
function duplicateNodeRecursive(node: LexicalNode): LexicalNode {
  const copy = $copyNode(node)
  if ($isElementNode(node) && $isElementNode(copy)) {
    node.getChildren().forEach((child) => {
      copy.append(duplicateNodeRecursive(child))
    })
  }
  return copy
}

const COLOR_OPTIONS = [
  { name: 'Default', value: null, hex: 'transparent' },
  ...TAG_COLOR_PRESETS.map((preset) => ({
    name: preset.name,
    value: preset.bg,
    hex: preset.hex,
  })),
]

// Monkey-patch TableCellNode.prototype.createDOM
const originalCreateDOM = TableCellNode.prototype.createDOM;
// @ts-ignore
TableCellNode.prototype.createDOM = function (
  this: any,
  config: any
): HTMLElement {
  const dom = originalCreateDOM.call(this, config);
  console.log('[TableHoverActions] createDOM called - key:', this.getKey(), 'bg:', this.__backgroundColor, 'styleAttr:', dom.getAttribute('style'));
  if (this.__backgroundColor) {
    dom.style.backgroundColor = this.__backgroundColor;
  }
  return dom;
};

// Monkey-patch TableCellNode.prototype.updateDOM to correctly apply style updates in Lexical's DOM reconciliation loop
const originalUpdateDOM = TableCellNode.prototype.updateDOM;
// @ts-ignore
TableCellNode.prototype.updateDOM = function (
  this: any,
  prevNode: any,
  dom: HTMLElement,
  config: any
): boolean {
  const result = (originalUpdateDOM as any).call(this, prevNode, dom, config);
  
  if (dom) {
    if (this.__backgroundColor) {
      dom.style.backgroundColor = this.__backgroundColor;
    } else {
      dom.style.removeProperty('background-color');
    }
    console.log('[TableHoverActions] updateDOM called - key:', this.getKey(), 'bg:', this.__backgroundColor, 'styleAttr:', dom.getAttribute('style'));
  }
  
  return result;
};

// Monkey-patch TableCellNode.prototype.setBackgroundColor to also update the node's style attribute
const originalSetBackgroundColor = TableCellNode.prototype.setBackgroundColor;
// @ts-ignore
TableCellNode.prototype.setBackgroundColor = function (
  this: any,
  newBackgroundColor: null | string
): any {
  const self = originalSetBackgroundColor.call(this, newBackgroundColor);
  const currentStyle = self.getStyle() || '';
  const widthMatch = currentStyle.match(/width:\s*([^;]+)/);
  const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
  const widthStr = widthMatch ? `width: ${widthMatch[1]}; ` : '';
  const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';

  if (newBackgroundColor) {
    self.setStyle(`${widthStr}${heightStr}background-color: ${newBackgroundColor}`);
  } else {
    self.setStyle(`${widthStr}${heightStr}`.trim());
  }
  return self;
};

export default function TableHoverActionsPlugin({ documentId }: { documentId?: string }): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext()
  const doc = useDocumentStore(state => documentId ? state.documents[documentId] : null)
  const isWidePage = doc?.pageWidth === 'wide'
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null)
  const [coords, setCoords] = useState<CoordsInfo | null>(null)
  const [activeMenu, setActiveMenu] = useState<MenuState | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Selected cell state
  const [activeCellDOM, setActiveCellDOM] = useState<HTMLElement | null>(null)
  const [cellCoords, setCellCoords] = useState<CellCoordsInfo | null>(null)
  
  // Color submenu state
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [submenuTop, setSubmenuTop] = useState(0)
  const [submenuLeft, setSubmenuLeft] = useState(0)
  
  const [activeResizeGuide, setActiveResizeGuide] = useState<{
    type: 'table-right' | 'column' | 'row';
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  // Listen for mouse movement over the table cells
  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const handleMouseMove = (event: MouseEvent) => {
      const rootElement = editor.getRootElement()
      if (!rootElement) return

      const target = event.target as HTMLElement
      
      // If we are currently interacting with active menus, tooltips or overlays, don't trigger updates
      if (
        target.closest('.table-control-menu') || 
        target.closest('.table-control-submenu') || 
        target.closest('.table-control-overlay') || 
        target.closest('.table-control-tooltip')
      ) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        return
      }
      
      // If a menu is open, freeze the overlay in place
      if (activeMenu) {
        return
      }
      
      const cellDOM = target.closest('td, th') as HTMLElement
      if (cellDOM) {
        const tableDOM = cellDOM.closest('table') as HTMLTableElement
        if (tableDOM && rootElement.contains(tableDOM)) {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
          }
          
          let cellNodeKey = ''
          editor.read(() => {
            const node = $getNearestNodeFromDOMNode(cellDOM)
            if (node) {
              cellNodeKey = node.getKey()
            }
          })
          
          if (cellNodeKey) {
            setHoveredCell({ cellDOM, tableDOM, cellNodeKey })
            return
          }
        }
      }
      
      // Start hide timeout if we are not hovering a cell
      if (!hideTimeoutRef.current) {
        hideTimeoutRef.current = setTimeout(() => {
          setHoveredCell(null)
          hideTimeoutRef.current = null
        }, 300)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [editor, activeMenu])

  // Listen for focus and selection inside table cells (select state)
  useEffect(() => {
    const container = document.querySelector('.templnote-editor-wrapper') as HTMLElement
    if (!container) return

    const updateActiveCell = () => {
      // 1. Check if there are elements with `.lexical-table-cell-selected`
      const selectedCells = container.querySelectorAll('.lexical-table-cell-selected')
      if (selectedCells.length > 0) {
        setActiveCellDOM(selectedCells[selectedCells.length - 1] as HTMLElement)
        return
      }

      // 2. Check Lexical selection to see if cursor is inside a table cell
      let focusedCellDOM: HTMLElement | null = null
      editor.read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          let parent: LexicalNode | null = anchorNode
          while (parent !== null) {
            if (parent instanceof TableCellNode) {
              const cellDOM = editor.getElementByKey(parent.getKey())
              if (cellDOM) {
                focusedCellDOM = cellDOM
              }
              break
            }
            parent = parent.getParent()
          }
        }
      })

      if (focusedCellDOM) {
        setActiveCellDOM(focusedCellDOM)
        return
      }

      // 3. Otherwise check if focus is inside a cell
      const activeEl = document.activeElement
      const cellDOM = activeEl?.closest('td, th') as HTMLElement
      if (cellDOM && editor.getRootElement()?.contains(cellDOM)) {
        setActiveCellDOM(cellDOM)
        return
      }

      // 4. Otherwise if focus is in menu or overlay, keep current
      if (
        activeEl?.closest('.table-control-menu') || 
        activeEl?.closest('.table-control-submenu') || 
        activeEl?.closest('.table-control-overlay')
      ) {
        return
      }

      setActiveCellDOM(null)
    }

    const unregisterUpdate = editor.registerUpdateListener(() => {
      updateActiveCell()
    })

    const handleFocusIn = () => {
      setTimeout(updateActiveCell, 0)
    }
    const handleFocusOut = () => {
      setTimeout(updateActiveCell, 100)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    document.addEventListener('selectionchange', handleFocusIn)
    document.addEventListener('mousedown', handleFocusIn)
    document.addEventListener('mouseup', handleFocusIn)
    document.addEventListener('keydown', handleFocusIn)
    document.addEventListener('keyup', handleFocusIn)
    
    updateActiveCell()

    return () => {
      unregisterUpdate()
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      document.removeEventListener('selectionchange', handleFocusIn)
      document.removeEventListener('mousedown', handleFocusIn)
      document.removeEventListener('mouseup', handleFocusIn)
      document.removeEventListener('keydown', handleFocusIn)
      document.removeEventListener('keyup', handleFocusIn)
    }
  }, [editor])

  // If page is set to wide, automatically reset the table to fit the parent column width
  useEffect(() => {
    if (isWidePage) {
      editor.update(() => {
        const root = editor.getRootElement();
        if (!root) return;
        const tables = root.querySelectorAll('table');
        tables.forEach(tableDOM => {
          const tableNode = $getNearestNodeFromDOMNode(tableDOM);
          if (tableNode && $isTableNode(tableNode)) {
            tableNode.setStyle('width: 100%; margin-left: auto; margin-right: auto;');
            tableNode.setColWidths([]);
            tableNode.getChildren().forEach(row => {
              if ($isTableRowNode(row)) {
                row.getChildren().forEach(cell => {
                  if ($isTableCellNode(cell)) {
                    cell.setWidth(undefined);
                    const currentStyle = cell.getStyle() || '';
                    const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
                    const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';
                    cell.setStyle(`${heightStr}background-color: ${cell.getBackgroundColor() || ''}`);
                  }
                });
              }
            });
          }
        });
      });
    }
  }, [isWidePage, editor]);

  // Track position changes and container sizing for hovered cell
  useEffect(() => {
    if (!hoveredCell) {
      setCoords(null)
      return
    }

    const container = document.querySelector('.templnote-editor-wrapper') as HTMLElement
    if (!container) return
    containerRef.current = container

    const updateCoords = () => {
      const { cellDOM, tableDOM } = hoveredCell
      
      // Verify element is still in DOM
      if (!cellDOM.isConnected || !tableDOM.isConnected) {
        setHoveredCell(null)
        return
      }

      const cellRect = cellDOM.getBoundingClientRect()
      const tableRect = tableDOM.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      
      // Determine indices
      const rowDOM = cellDOM.parentElement as HTMLTableRowElement
      if (!rowDOM) return
      
      const cells = Array.from(rowDOM.cells)
      const colIndex = cells.indexOf(cellDOM as HTMLTableCellElement)
      
      const rows = Array.from(tableDOM.rows)
      const rowIndex = rows.indexOf(rowDOM)

      setCoords({
        tableTop: tableRect.top - containerRect.top + container.scrollTop,
        tableLeft: tableRect.left - containerRect.left + container.scrollLeft,
        tableWidth: tableRect.width,
        tableHeight: tableRect.height,
        
        cellTop: cellRect.top - containerRect.top + container.scrollTop,
        cellLeft: cellRect.left - containerRect.left + container.scrollLeft,
        cellWidth: cellRect.width,
        cellHeight: cellRect.height,
        
        colIndex,
        rowIndex,
        
        firstCellDOM: rowDOM.cells[0],
        lastCellDOM: rowDOM.cells[rowDOM.cells.length - 1],
      })
    }

    updateCoords()

    container.addEventListener('scroll', updateCoords)
    window.addEventListener('resize', updateCoords)
    return () => {
      container.removeEventListener('scroll', updateCoords)
      window.removeEventListener('resize', updateCoords)
    }
  }, [hoveredCell])

  // Track position changes and container sizing for active (focused) cell
  useEffect(() => {
    if (!activeCellDOM) {
      setCellCoords(null)
      return
    }

    const container = document.querySelector('.templnote-editor-wrapper') as HTMLElement
    if (!container) return
    containerRef.current = container

    const updateCellCoords = () => {
      if (!activeCellDOM.isConnected) {
        setActiveCellDOM(null)
        return
      }

      const rect = activeCellDOM.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      
      let cellNodeKey = ''
      editor.read(() => {
        const node = $getNearestNodeFromDOMNode(activeCellDOM)
        if (node) {
          cellNodeKey = node.getKey()
        }
      })

      setCellCoords({
        top: rect.top - containerRect.top + container.scrollTop,
        left: rect.left - containerRect.left + container.scrollLeft,
        width: rect.width,
        height: rect.height,
        cellNodeKey,
      })
    }

    updateCellCoords()

    container.addEventListener('scroll', updateCellCoords)
    window.addEventListener('resize', updateCellCoords)
    return () => {
      container.removeEventListener('scroll', updateCellCoords)
      window.removeEventListener('resize', updateCellCoords)
    }
  }, [activeCellDOM, editor])

  // Click outside menu listener
  useEffect(() => {
    if (!activeMenu) return
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('.table-control-menu') && 
        !target.closest('.table-control-submenu') && 
        !target.closest('.table-column-handle') && 
        !target.closest('.table-row-handle')
      ) {
        setActiveMenu(null)
        setSubmenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [activeMenu])

  // Resizing logic for columns, rows, and table width (symmetrically)
  useEffect(() => {
    let isDragging = false;
    let dragInfo: {
      type: 'table-right' | 'column' | 'row';
      startX: number;
      startY: number;
      tableDOM: HTMLTableElement;
      cellDOM: HTMLElement;
      index: number;
      initialTableWidth: number;
      initialColWidths: number[];
      initialRowHeight: number;
      initialCellRight: number;
      initialCellBottom: number;
      initialTableTop: number;
      initialTableLeft: number;
      initialTableHeight: number;
      initialTableLeftEdge: number;
      initialTableRightEdge: number;
      tableCenterX: number;
      containerLeft: number;
      parentCenterX: number;
      parentWidth: number;
      parentLeft: number;
      initialMarginLeft: number;
      initialRowHeights: number[];
      defaultRowHeight: number;
      defaultRowHeights: number[];
    } | null = null;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const container = document.querySelector('.templnote-editor-wrapper') as HTMLElement;
    if (!container) return;

    // Detect resizing zone and return info
    const getResizeInfo = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cellDOM = target.closest('td, th') as HTMLElement;
      if (!cellDOM) return null;
      const tableDOM = cellDOM.closest('table') as HTMLTableElement;
      if (!tableDOM || !rootElement.contains(tableDOM)) return null;

      const rect = cellDOM.getBoundingClientRect();
      const distanceToRight = Math.abs(rect.right - e.clientX);
      const distanceToBottom = Math.abs(rect.bottom - e.clientY);

      const rowDOM = cellDOM.parentElement as HTMLTableRowElement;
      if (!rowDOM) return null;

      const isLastColumn = cellDOM.nextElementSibling === null;
      
      const threshold = 8; // detection zone width in pixels

      const candidates: { type: 'table-right' | 'column' | 'row', distance: number, index: number }[] = [];

      if (isLastColumn && distanceToRight < threshold) {
        candidates.push({ type: 'table-right', distance: distanceToRight, index: rowDOM.cells.length - 1 });
      }
      if (distanceToRight < threshold && !isLastColumn) {
        const cells = Array.from(rowDOM.cells);
        const colIndex = cells.indexOf(cellDOM as HTMLTableCellElement);
        candidates.push({ type: 'column', distance: distanceToRight, index: colIndex });
      }
      if (distanceToBottom < threshold) {
        const rows = Array.from(tableDOM.rows);
        const rowIndex = rows.indexOf(rowDOM);
        candidates.push({ type: 'row', distance: distanceToBottom, index: rowIndex });
      }

      if (candidates.length === 0) return null;

      // Sort by proximity: closest edge wins!
      candidates.sort((a, b) => a.distance - b.distance);
      const closest = candidates[0];

      return { type: closest.type, cellDOM, tableDOM, index: closest.index };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragInfo) {
        const dx = e.clientX - dragInfo.startX;
        const dy = e.clientY - dragInfo.startY;

        if (dragInfo.type === 'column') {
          // Calculate max delta based on adjacent column constraints
          const maxDelta = dragInfo.initialColWidths[dragInfo.index + 1] - 30;
          const minDelta = 30 - dragInfo.initialColWidths[dragInfo.index];
          const delta = Math.max(minDelta, Math.min(maxDelta, dx));

          const newColWidth = dragInfo.initialColWidths[dragInfo.index] + delta;
          const newNextColWidth = dragInfo.initialColWidths[dragInfo.index + 1] - delta;

          // Update DOM of all cells in the column and the next column
          const rows = Array.from(dragInfo.tableDOM.rows);
          rows.forEach((row) => {
            const cell = row.cells[dragInfo.index];
            const nextCell = row.cells[dragInfo.index + 1];
            if (cell) cell.style.width = `${newColWidth}px`;
            if (nextCell) nextCell.style.width = `${newNextColWidth}px`;
          });

          // Guide position remains relative to the initial table position (which is fixed)
          setActiveResizeGuide({
            type: 'column',
            left: dragInfo.initialCellRight + delta - 1,
            top: dragInfo.initialTableTop,
            width: 3,
            height: dragInfo.initialTableHeight,
          });
        } else if (dragInfo.type === 'row') {
          const newRowHeight = Math.max(dragInfo.defaultRowHeight, dragInfo.initialRowHeight + dy);
          const rowDOM = dragInfo.cellDOM.parentElement as HTMLTableRowElement;
          if (rowDOM) {
            rowDOM.style.height = `${newRowHeight}px`;
            Array.from(rowDOM.cells).forEach((cell) => {
              cell.style.height = `${newRowHeight}px`;
            });
          }

          // Update guide position without triggering layout reflow
          const actualRowDelta = newRowHeight - dragInfo.initialRowHeight;
          setActiveResizeGuide({
            type: 'row',
            left: dragInfo.initialTableLeft,
            top: dragInfo.initialCellBottom + actualRowDelta - 1,
            width: dragInfo.initialTableWidth,
            height: 3,
          });
        } else if (dragInfo.type === 'table-right') {
          const deltaX = e.clientX - dragInfo.startX;
          let newTableWidth = dragInfo.initialTableWidth + deltaX;

          const minWidth = Math.min(720, dragInfo.parentWidth);
          // Use the same max-width as the editor content column (720px narrow / 90% wide)
          const contentColumn = dragInfo.tableDOM.closest('.editor-content-column') as HTMLElement;
          const maxWidth = contentColumn
            ? parseFloat(getComputedStyle(contentColumn).maxWidth) || dragInfo.parentWidth
            : dragInfo.parentWidth;

          newTableWidth = Math.max(minWidth, Math.min(maxWidth, newTableWidth));

          const wChange = newTableWidth - dragInfo.initialTableWidth;
          const scale = newTableWidth / dragInfo.initialTableWidth;

          dragInfo.tableDOM.style.width = `${newTableWidth}px`;

          // Update column widths proportionally (with 30px min width)
          const rows = Array.from(dragInfo.tableDOM.rows);
          rows.forEach((row) => {
            Array.from(row.cells).forEach((cell, idx) => {
              const newColWidth = Math.max(30, dragInfo.initialColWidths[idx] * scale);
              cell.style.width = `${newColWidth}px`;
            });
          });

          // Update guide position at the new right edge
          const guideLeft = dragInfo.initialTableRightEdge + wChange - dragInfo.containerLeft + container.scrollLeft - 2;

          setActiveResizeGuide({
            type: 'table-right',
            left: guideLeft,
            top: dragInfo.initialTableTop,
            width: 5,
            height: dragInfo.initialTableHeight,
          });
        }
        return;
      }

      // Cursor & Guide updates when hovering (only non-drag calls getBoundingClientRect)
      const containerRect = container.getBoundingClientRect();
      const info = getResizeInfo(e);
      if (info) {
        if (info.type === 'table-right') {
          document.body.style.cursor = 'ew-resize';
        } else if (info.type === 'column') {
          document.body.style.cursor = 'col-resize';
        } else if (info.type === 'row') {
          document.body.style.cursor = 'row-resize';
        }

        // Compute guide dimensions
        const tableRect = info.tableDOM.getBoundingClientRect();
        const cellRect = info.cellDOM.getBoundingClientRect();

        let top = 0;
        let left = 0;
        let width = 0;
        let height = 0;

        if (info.type === 'column') {
          left = cellRect.right - containerRect.left + container.scrollLeft - 1;
          top = tableRect.top - containerRect.top + container.scrollTop;
          width = 3;
          height = tableRect.height;
        } else if (info.type === 'row') {
          left = tableRect.left - containerRect.left + container.scrollLeft;
          top = cellRect.bottom - containerRect.top + container.scrollTop - 1;
          width = tableRect.width;
          height = 3;
        } else if (info.type === 'table-right') {
          left = tableRect.right - containerRect.left + container.scrollLeft - 2;
          top = tableRect.top - containerRect.top + container.scrollTop;
          width = 5;
          height = tableRect.height;
        }

        setActiveResizeGuide({
          type: info.type,
          top,
          left,
          width,
          height,
        });
      } else {
        const cur = document.body.style.cursor;
        if (cur === 'ew-resize' || cur === 'col-resize' || cur === 'row-resize') {
          document.body.style.cursor = '';
        }
        setActiveResizeGuide(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      const info = getResizeInfo(e);
      if (!info) return;

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      setIsResizing(true);
      
      const containerRect = container.getBoundingClientRect();
      const cellRect = info.cellDOM.getBoundingClientRect();
      const tableRect = info.tableDOM.getBoundingClientRect();

      const initialTableWidth = tableRect.width;
      
      // Get column widths from the first row DOM
      const firstRow = info.tableDOM.rows[0];
      const initialColWidths = firstRow 
        ? Array.from(firstRow.cells).map(cell => cell.getBoundingClientRect().width)
        : [];
      
      const rowDOM = info.cellDOM.parentElement as HTMLTableRowElement;
      const initialRowHeight = rowDOM ? rowDOM.getBoundingClientRect().height : 0;

      const initialCellRight = cellRect.right - containerRect.left + container.scrollLeft;
      const initialCellBottom = cellRect.bottom - containerRect.top + container.scrollTop;
      const initialTableTop = tableRect.top - containerRect.top + container.scrollTop;
      const initialTableLeft = tableRect.left - containerRect.left + container.scrollLeft;
      const initialTableHeight = tableRect.height;
      const initialTableLeftEdge = tableRect.left - containerRect.left + container.scrollLeft;
      const initialTableRightEdge = tableRect.right - containerRect.left + container.scrollLeft;

      const parentDOM = info.tableDOM.parentElement || rootElement;
      const parentRect = parentDOM.getBoundingClientRect();
      const parentCenterX = parentRect.left + parentRect.width / 2;
      const parentWidth = parentRect.width;
      const parentLeft = parentRect.left;

      const tableCenterX = tableRect.left + tableRect.width / 2;
      const containerLeft = containerRect.left;

      const initialMarginLeft = parseFloat(window.getComputedStyle(info.tableDOM).marginLeft) || 0;
      const initialRowHeights = Array.from(info.tableDOM.rows).map(row => row.getBoundingClientRect().height);

      // Measure natural (default) heights for all rows in the table
      const defaultRowHeights = Array.from(info.tableDOM.rows).map((row) => {
        const rowDOM = row as HTMLTableRowElement;
        const originalRowStyleHeight = rowDOM.style.height;
        const rowCells = Array.from(rowDOM.cells);
        const originalCellHeights = rowCells.map(cell => cell.style.height);
        
        rowDOM.style.height = '';
        rowCells.forEach(cell => cell.style.height = '');
        
        const naturalHeight = rowDOM.getBoundingClientRect().height;
        
        rowDOM.style.height = originalRowStyleHeight;
        rowCells.forEach((cell, idx) => cell.style.height = originalCellHeights[idx]);
        
        return naturalHeight;
      });

      const defaultRowHeight = rowDOM ? defaultRowHeights[Array.from(info.tableDOM.rows).indexOf(rowDOM)] : 37;

      dragInfo = {
        type: info.type,
        startX: e.clientX,
        startY: e.clientY,
        tableDOM: info.tableDOM,
        cellDOM: info.cellDOM,
        index: info.index,
        initialTableWidth,
        initialColWidths,
        initialRowHeight,
        initialCellRight,
        initialCellBottom,
        initialTableTop,
        initialTableLeft,
        initialTableHeight,
        initialTableLeftEdge,
        initialTableRightEdge,
        tableCenterX,
        containerLeft,
        parentCenterX,
        parentWidth,
        parentLeft,
        initialMarginLeft,
        initialRowHeights,
        defaultRowHeight,
        defaultRowHeights,
      };

      // For table-right resize, lock the left edge by setting explicit margin
      if (info.type === 'table-right') {
        info.tableDOM.style.marginLeft = `${initialTableLeftEdge - containerRect.left + container.scrollLeft}px`;
        info.tableDOM.style.marginRight = '0';
      }

      document.body.style.userSelect = 'none';
      if (info.type === 'table-right') {
        document.body.style.cursor = 'ew-resize';
      } else if (info.type === 'column') {
        document.body.style.cursor = 'col-resize';
      } else if (info.type === 'row') {
        document.body.style.cursor = 'row-resize';
      }

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !dragInfo) return;

      isDragging = false;
      setIsResizing(false);
      setActiveResizeGuide(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const drag = dragInfo;
      dragInfo = null;

      // Commit to Lexical State
      editor.update(() => {
        const tableNode = $getNearestNodeFromDOMNode(drag.tableDOM);
        if (!tableNode || !$isTableNode(tableNode)) return;

        if (drag.type === 'column') {
          const finalColWidth = Math.max(30, parseFloat(drag.cellDOM.style.width) || drag.initialColWidths[drag.index]);
          const finalNextColWidth = Math.max(30, (drag.initialColWidths[drag.index] + drag.initialColWidths[drag.index + 1]) - finalColWidth);

          const colWidths = [...(tableNode.getColWidths() || [])];
          if (colWidths.length === 0) {
            drag.initialColWidths.forEach((w, i) => colWidths[i] = w);
          }
          colWidths[drag.index] = finalColWidth;
          colWidths[drag.index + 1] = finalNextColWidth;
          tableNode.setColWidths(colWidths);

          // Update widths on cell nodes
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              const cells = row.getChildren();
              const cell = cells[drag.index];
              const nextCell = cells[drag.index + 1];
              if ($isTableCellNode(cell)) {
                cell.setWidth(finalColWidth);
                const currentStyle = cell.getStyle() || '';
                const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
                const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';
                cell.setStyle(`width: ${finalColWidth}px; ${heightStr}background-color: ${cell.getBackgroundColor() || ''}`);
              }
              if ($isTableCellNode(nextCell)) {
                nextCell.setWidth(finalNextColWidth);
                const currentStyle = nextCell.getStyle() || '';
                const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
                const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';
                nextCell.setStyle(`width: ${finalNextColWidth}px; ${heightStr}background-color: ${nextCell.getBackgroundColor() || ''}`);
              }
            }
          });
        } else if (drag.type === 'row') {
          const finalRowHeight = Math.max(drag.defaultRowHeight, parseFloat(drag.cellDOM.parentElement?.style.height || '') || drag.initialRowHeight);
          const rows = tableNode.getChildren();
          const rowNode = rows[drag.index];
          if ($isTableRowNode(rowNode)) {
            rowNode.setStyle(`height: ${finalRowHeight}px`);
            rowNode.getChildren().forEach((cell) => {
              if ($isTableCellNode(cell)) {
                const widthStr = cell.getWidth() ? `width: ${cell.getWidth()}px; ` : '';
                cell.setStyle(`${widthStr}height: ${finalRowHeight}px; background-color: ${cell.getBackgroundColor() || ''}`);
              }
            });
          }
        } else if (drag.type === 'table-right') {
          drag.tableDOM.style.transform = '';
          const finalTableWidth = parseFloat(drag.tableDOM.style.width) || drag.initialTableWidth;
          const finalMarginLeft = parseFloat(drag.tableDOM.style.marginLeft) || 0;
          tableNode.setStyle(`width: ${finalTableWidth}px; margin-left: ${finalMarginLeft}px; margin-right: 0;`);

          const scale = finalTableWidth / drag.initialTableWidth;
          const colWidths: number[] = [];
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              row.getChildren().forEach((cell, idx) => {
                if ($isTableCellNode(cell)) {
                  const finalCellWidth = Math.max(30, drag.initialColWidths[idx] * scale);
                  cell.setWidth(finalCellWidth);

                  const currentStyle = cell.getStyle() || '';
                  const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
                  const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';
                  const bgMatch = currentStyle.match(/background-color:\s*([^;]+)/);
                  const bgStr = bgMatch ? `background-color: ${bgMatch[1]}; ` : '';
                  cell.setStyle(`width: ${finalCellWidth}px; ${heightStr}${bgStr}`);

                  if (idx >= colWidths.length) {
                    colWidths.push(finalCellWidth);
                  }
                }
              });
            }
          });
          tableNode.setColWidths(colWidths);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (document.body.style.cursor === 'ew-resize' || document.body.style.cursor === 'col-resize' || document.body.style.cursor === 'row-resize') {
        document.body.style.cursor = '';
      }
    };
  }, [editor]);

  if ((!coords && !cellCoords) || !containerRef.current) return null

  const container = containerRef.current

  // Helper actions

  // ROW ACTIONS
  const insertRowBelow = (index: number, dom: HTMLElement) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $insertTableRowAtSelection(true)
      }
    })
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const insertRowAbove = (index: number, dom: HTMLElement) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $insertTableRowAtSelection(false)
      }
    })
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const deleteRow = (index: number, dom: HTMLElement) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $deleteTableRowAtSelection()
      }
    })
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const clearRow = (index: number, dom: HTMLElement) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      if (cellNode) {
        const rowNode = cellNode.getParent()
        if ($isTableRowNode(rowNode)) {
          rowNode.getChildren().forEach((cell) => {
            if ($isTableCellNode(cell)) {
              cell.clear()
              cell.append($createParagraphNode())
            }
          })
        }
      }
    })
    setActiveMenu(null)
  }

  const duplicateRow = (index: number, dom: HTMLElement) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      if (cellNode) {
        const rowNode = cellNode.getParent()
        if ($isTableRowNode(rowNode)) {
          const duplicatedRow = duplicateNodeRecursive(rowNode)
          rowNode.insertAfter(duplicatedRow)
        }
      }
    })
    setActiveMenu(null)
  }

  const setRowBackgroundColor = (index: number, dom: HTMLElement, colorValue: string | null) => {
    console.log('[TableHoverActions] setRowBackgroundColor called:', { index, colorValue, domTagName: dom ? dom.tagName : 'no-dom' });
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(dom)
      console.log('[TableHoverActions] setRowBackgroundColor cellNode:', cellNode ? cellNode.getKey() : 'null', 'instanceof TableCellNode:', cellNode instanceof TableCellNode);
      if (cellNode instanceof TableCellNode) {
        const rowNode = cellNode.getParent()
        console.log('[TableHoverActions] setRowBackgroundColor rowNode:', rowNode ? rowNode.getKey() : 'null', 'isTableRowNode:', $isTableRowNode(rowNode));
        if (rowNode && $isTableRowNode(rowNode)) {
          rowNode.getChildren().forEach((child) => {
            if (child instanceof TableCellNode) {
              console.log('[TableHoverActions] setRowBackgroundColor child cell:', child.getKey(), 'setting to:', colorValue);
              child.setBackgroundColor(colorValue)
            }
          })
        }
      }
    })
    setActiveMenu(null)
    setSubmenuOpen(false)
  }

  const insertColumnAndAdjustWidths = (cellDOM: HTMLElement, isRight: boolean) => {
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(cellDOM);
      if (!(cellNode instanceof TableCellNode)) return;

      const tableNode = $findTableNode(cellNode);
      if (!tableNode || !$isTableNode(tableNode)) return;

      // 1. Get current column widths
      let colWidths = [...(tableNode.getColWidths() || [])];
      
      // If table has no colWidths, we can measure them from the DOM
      if (colWidths.length === 0) {
        const tableDOM = editor.getElementByKey(tableNode.getKey()) as HTMLTableElement;
        if (tableDOM) {
          const firstRow = tableDOM.rows[0];
          if (firstRow) {
            colWidths = Array.from(firstRow.cells).map(cell => cell.getBoundingClientRect().width);
          }
        }
      }

      const colCount = colWidths.length;
      
      // Select the cell and perform the standard insertion
      cellNode.select();
      $insertTableColumnAtSelection(isRight);

      // 2. Adjust widths: keep existing widths, give new column the neighbor's width
      if (colCount > 0) {
        const rowNode = cellNode.getParent();
        if ($isTableRowNode(rowNode)) {
          const cells = rowNode.getChildren();
          const currentIdx = cells.indexOf(cellNode);
          const insertIdx = isRight ? currentIdx + 1 : currentIdx;

          // Keep existing column widths, new column gets the neighbor's width
          const neighborWidth = colWidths[currentIdx] || 150;
          const newColWidths = [...colWidths];
          newColWidths.splice(insertIdx, 0, neighborWidth);

          // Update TableNode's column widths
          tableNode.setColWidths(newColWidths);

          // Update styles on all cell nodes to match the new widths
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              row.getChildren().forEach((cell, idx) => {
                if ($isTableCellNode(cell)) {
                  const finalWidth = newColWidths[idx] || neighborWidth;
                  cell.setWidth(finalWidth);

                  const currentStyle = cell.getStyle() || '';
                  const heightMatch = currentStyle.match(/height:\s*([^;]+)/);
                  const heightStr = heightMatch ? `height: ${heightMatch[1]}; ` : '';
                  const bgMatch = currentStyle.match(/background-color:\s*([^;]+)/);
                  const bgStr = bgMatch ? `background-color: ${bgMatch[1]}; ` : '';
                  
                  cell.setStyle(`width: ${finalWidth}px; ${heightStr}${bgStr}`);
                }
              });
            }
          });
        }
      }
    });
  };

  // COLUMN ACTIONS
  const insertColumnRight = (index: number) => {
    if (!hoveredCell) return
    insertColumnAndAdjustWidths(hoveredCell.cellDOM, true)
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const insertColumnLeft = (index: number) => {
    if (!hoveredCell) return
    insertColumnAndAdjustWidths(hoveredCell.cellDOM, false)
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const deleteColumn = (index: number) => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $deleteTableColumnAtSelection()
      }
    })
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const clearColumn = (index: number) => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if ($isTableCellNode(cellNode)) {
        const tableNode = $findTableNode(cellNode)
        if (tableNode) {
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              const cell = row.getChildren()[index]
              if ($isTableCellNode(cell)) {
                cell.clear()
                cell.append($createParagraphNode())
              }
            }
          })
        }
      }
    })
    setActiveMenu(null)
  }

  const alignColumn = (index: number, alignment: 'left' | 'center' | 'right') => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if ($isTableCellNode(cellNode)) {
        const tableNode = $findTableNode(cellNode)
        if (tableNode) {
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              const cell = row.getChildren()[index]
              if ($isTableCellNode(cell)) {
                cell.getChildren().forEach((child) => {
                  if ($isElementNode(child)) {
                    child.setFormat(alignment)
                  }
                })
              }
            }
          })
        }
      }
    })
    setActiveMenu(null)
  }

  const setColumnBackgroundColor = (index: number, colorValue: string | null) => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if ($isTableCellNode(cellNode)) {
        const tableNode = $findTableNode(cellNode)
        if (tableNode) {
          tableNode.getChildren().forEach((row) => {
            if ($isTableRowNode(row)) {
              const cell = row.getChildren()[index]
              if ($isTableCellNode(cell)) {
                cell.setBackgroundColor(colorValue)
              }
            }
          })
        }
      }
    })
    setActiveMenu(null)
    setSubmenuOpen(false)
  }

  // CELL ACTIONS
  const clearCell = (nodeKey: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isTableCellNode(node)) {
        node.clear()
        node.append($createParagraphNode())
      }
    })
    setActiveMenu(null)
  }

  const alignCell = (nodeKey: string, alignment: 'left' | 'center' | 'right') => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isTableCellNode(node)) {
        node.getChildren().forEach((child) => {
          if ($isElementNode(child)) {
            child.setFormat(alignment)
          }
        })
      }
    })
    setActiveMenu(null)
  }

  const setCellBackgroundColor = (cellKey: string, colorValue: string | null) => {
    editor.update(() => {
      const cellNode = $getNodeByKey(cellKey)
      if (cellNode instanceof TableCellNode) {
        cellNode.setBackgroundColor(colorValue)
      }
    })
    setActiveMenu(null)
    setSubmenuOpen(false)
  }

  // Quick Appending Buttons
  const appendColumn = () => {
    if (!coords) return
    insertColumnAndAdjustWidths(coords.lastCellDOM, true)
    setHoveredCell(null)
  }

  const appendRow = () => {
    if (!coords) return
    editor.update(() => {
      const tableDOM = hoveredCell?.tableDOM
      if (tableDOM) {
        const lastRow = tableDOM.rows[tableDOM.rows.length - 1]
        const cellDOM = lastRow.cells[coords.colIndex] || lastRow.cells[0]
        const lastRowCellNode = $getNearestNodeFromDOMNode(cellDOM)
        if (lastRowCellNode instanceof TableCellNode) {
          lastRowCellNode.select()
          $insertTableRowAtSelection(true)
        }
      }
    })
    setHoveredCell(null)
  }

  const handleRowMenuToggle = () => {
    if (!coords) return
    setSubmenuOpen(false)
    if (activeMenu?.type === 'row' && activeMenu.index === coords.rowIndex) {
      setActiveMenu(null)
    } else {
      setActiveMenu({
        type: 'row',
        index: coords.rowIndex,
        top: coords.cellTop,
        left: Math.max(8, coords.tableLeft - 180), // Position menu nicely to the left
      })
    }
  }

  const handleColMenuToggle = () => {
    if (!coords) return
    setSubmenuOpen(false)
    if (activeMenu?.type === 'column' && activeMenu.index === coords.colIndex) {
      setActiveMenu(null)
    } else {
      setActiveMenu({
        type: 'column',
        index: coords.colIndex,
        top: coords.tableTop - 6,
        left: coords.cellLeft + (coords.cellWidth / 2) - 85, // Centered menu
      })
    }
  }

  const handleCellMenuToggle = () => {
    if (!cellCoords) return
    setSubmenuOpen(false)
    if (activeMenu?.type === 'cell') {
      setActiveMenu(null)
    } else {
      setActiveMenu({
        type: 'cell',
        index: 0,
        top: cellCoords.top,
        left: cellCoords.left + cellCoords.width - 6,
      })
    }
  }

  const handleColorMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    setSubmenuLeft(rect.right - containerRect.left + container.scrollLeft - 4)
    setSubmenuTop(rect.top - containerRect.top + container.scrollTop - 4)
    setSubmenuOpen(!submenuOpen)
  }

  const renderTooltip = () => {
    if (!tooltip) return null
    return (
      <div 
        className="table-control-tooltip font-sans"
        style={{
          top: tooltip.top,
          left: tooltip.left,
        }}
      >
        {tooltip.text}
      </div>
    )
  }

  return createPortal(
    <>
      <div className="absolute inset-0 pointer-events-none select-none z-40" contentEditable={false}>
        
        {/* ROW HOVER CONTROLLER (Left center pill handle) */}
        {coords && !activeResizeGuide && !isResizing && (
          <div 
            className="table-row-handle table-control-overlay absolute pointer-events-auto"
            style={{
              top: coords.cellTop + (coords.cellHeight / 2) - 12,
              left: Math.max(4, coords.tableLeft - 6),
              width: 12,
              height: 24,
            }}
            onClick={handleRowMenuToggle}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = container.getBoundingClientRect()
              setTooltip({
                text: "Row actions",
                top: rect.top - containerRect.top + container.scrollTop - 32,
                left: rect.left - containerRect.left + container.scrollLeft - 25,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="table-row-handle-bar" />
          </div>
        )}

        {/* COLUMN HOVER CONTROLLER (Top center pill handle) */}
        {coords && !activeResizeGuide && !isResizing && (
          <div
            className="table-column-handle table-control-overlay absolute pointer-events-auto"
            style={{
              top: coords.tableTop - 6,
              left: coords.cellLeft + (coords.cellWidth / 2) - 12,
              width: 24,
              height: 12,
            }}
            onClick={handleColMenuToggle}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = container.getBoundingClientRect()
              setTooltip({
                text: "Column actions",
                top: rect.top - containerRect.top + container.scrollTop - 32,
                left: rect.left - containerRect.left + container.scrollLeft - 35,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="table-column-handle-bar" />
          </div>
        )}

        {/* CELL SELECT/FOCUS CONTROLLER (Right center pill handle of selected cell) */}
        {cellCoords && !activeResizeGuide && !isResizing && (
          <div 
            className="table-column-handle table-control-overlay absolute pointer-events-auto"
            style={{
              top: cellCoords.top + (cellCoords.height / 2) - 6,
              left: cellCoords.left + cellCoords.width - 12,
              width: 24,
              height: 12,
            }}
            onClick={handleCellMenuToggle}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = container.getBoundingClientRect()
              setTooltip({
                text: "Cell actions",
                top: rect.top - containerRect.top + container.scrollTop - 32,
                left: rect.left - containerRect.left + container.scrollLeft - 25,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="table-column-handle-bar" />
          </div>
        )}

        {/* RIGHT COLUMN APPEND PILL */}
        {coords && !activeResizeGuide && !isResizing && (
          <div
            className="table-append-column-bar table-control-overlay absolute pointer-events-auto"
            style={{
              top: coords.tableTop,
              left: coords.tableLeft + coords.tableWidth + 6,
              height: coords.tableHeight,
            }}
            onClick={appendColumn}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = container.getBoundingClientRect()
              setTooltip({
                text: "Click to add a new column\nDrag to add or remove columns",
                top: rect.top + (rect.height / 2) - containerRect.top + container.scrollTop - 44,
                left: rect.left - containerRect.left + container.scrollLeft - 180,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="table-append-column-btn">
              <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
                <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>
              </svg>
            </div>
          </div>
        )}

        {/* BOTTOM ROW APPEND PILL */}
        {coords && !activeResizeGuide && !isResizing && (
          <div
            className="table-append-row-bar table-control-overlay absolute pointer-events-auto"
            style={{
              top: coords.tableTop + coords.tableHeight + 6,
              left: coords.tableLeft,
              width: coords.tableWidth,
            }}
            onClick={appendRow}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = container.getBoundingClientRect()
              setTooltip({
                text: "Click to add a new row",
                top: rect.top - containerRect.top + container.scrollTop - 32,
                left: rect.left + (rect.width / 2) - containerRect.left + container.scrollLeft - 60,
              })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div className="table-append-row-btn">
              <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
                <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"/>
              </svg>
            </div>
          </div>
        )}

      </div>

      {/* RENDER DYNAMIC TOOLTIPS */}
      {renderTooltip()}

      {/* ROW CONTEXT MENU PORTAL */}
      {activeMenu && activeMenu.type === 'row' && coords && (
        <div 
          className="table-control-menu font-sans z-50 pointer-events-auto"
          style={{
            top: activeMenu.top + 24,
            left: activeMenu.left,
          }}
          contentEditable={false}
        >
          <div className="table-control-menu-label">Row {activeMenu.index + 1}</div>
          <button className="table-control-menu-item" onClick={() => insertRowAbove(activeMenu.index, coords.firstCellDOM)}>
            <span className="table-control-menu-item-icon">↑</span>
            <span>Insert Row Above</span>
          </button>
          <button className="table-control-menu-item" onClick={() => insertRowBelow(activeMenu.index, coords.firstCellDOM)}>
            <span className="table-control-menu-item-icon">↓</span>
            <span>Insert Row Below</span>
          </button>
          <button className="table-control-menu-item" onClick={() => duplicateRow(activeMenu.index, coords.firstCellDOM)}>
            <span className="table-control-menu-item-icon">❐</span>
            <span>Duplicate Row</span>
          </button>
          <button className="table-control-menu-item" onClick={() => clearRow(activeMenu.index, coords.firstCellDOM)}>
            <span className="table-control-menu-item-icon">⎚</span>
            <span>Clear Content</span>
          </button>
          <button className="table-control-menu-item" onClick={handleColorMenuToggle}>
            <span className="table-control-menu-item-icon">🎨</span>
            <span>Background Color</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>›</span>
          </button>
          <div className="table-control-menu-separator" />
          <button className="table-control-menu-item danger" onClick={() => deleteRow(activeMenu.index, coords.firstCellDOM)}>
            <span className="table-control-menu-item-icon">🗑</span>
            <span>Delete Row</span>
          </button>
        </div>
      )}

      {/* COLUMN CONTEXT MENU PORTAL */}
      {activeMenu && activeMenu.type === 'column' && (
        <div 
          className="table-control-menu font-sans z-50 pointer-events-auto"
          style={{
            top: activeMenu.top + 28,
            left: activeMenu.left,
          }}
          contentEditable={false}
        >
          <div className="table-control-menu-label">Column {activeMenu.index + 1}</div>
          <button className="table-control-menu-item" onClick={() => insertColumnLeft(activeMenu.index)}>
            <span className="table-control-menu-item-icon">←</span>
            <span>Insert Column Left</span>
          </button>
          <button className="table-control-menu-item" onClick={() => insertColumnRight(activeMenu.index)}>
            <span className="table-control-menu-item-icon">→</span>
            <span>Insert Column Right</span>
          </button>
          <button className="table-control-menu-item" onClick={() => clearColumn(activeMenu.index)}>
            <span className="table-control-menu-item-icon">⎚</span>
            <span>Clear Content</span>
          </button>
          <button className="table-control-menu-item" onClick={handleColorMenuToggle}>
            <span className="table-control-menu-item-icon">🎨</span>
            <span>Background Color</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>›</span>
          </button>
          
          <div className="table-control-menu-separator" />
          <div className="table-control-menu-label">Text Alignment</div>
          <button className="table-control-menu-item" onClick={() => alignColumn(activeMenu.index, 'left')}>
            <span className="table-control-menu-item-icon">≡</span>
            <span>Align Left</span>
          </button>
          <button className="table-control-menu-item" onClick={() => alignColumn(activeMenu.index, 'center')}>
            <span className="table-control-menu-item-icon">⇔</span>
            <span>Align Center</span>
          </button>
          <button className="table-control-menu-item" onClick={() => alignColumn(activeMenu.index, 'right')}>
            <span className="table-control-menu-item-icon">≓</span>
            <span>Align Right</span>
          </button>

          <div className="table-control-menu-separator" />
          <button className="table-control-menu-item danger" onClick={() => deleteColumn(activeMenu.index)}>
            <span className="table-control-menu-item-icon">🗑</span>
            <span>Delete Column</span>
          </button>
        </div>
      )}

      {/* CELL CONTEXT MENU PORTAL */}
      {activeMenu && activeMenu.type === 'cell' && cellCoords && (
        <div 
          className="table-control-menu font-sans z-50 pointer-events-auto"
          style={{
            top: activeMenu.top + 28,
            left: activeMenu.left - 80,
          }}
          contentEditable={false}
        >
          <div className="table-control-menu-label">Cell Actions</div>
          <button className="table-control-menu-item" onClick={() => clearCell(cellCoords.cellNodeKey)}>
            <span className="table-control-menu-item-icon">⎚</span>
            <span>Clear Content</span>
          </button>
          <button className="table-control-menu-item" onClick={handleColorMenuToggle}>
            <span className="table-control-menu-item-icon">🎨</span>
            <span>Background Color</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>›</span>
          </button>
          
          <div className="table-control-menu-separator" />
          <div className="table-control-menu-label">Text Alignment</div>
          <button className="table-control-menu-item" onClick={() => alignCell(cellCoords.cellNodeKey, 'left')}>
            <span className="table-control-menu-item-icon">≡</span>
            <span>Align Left</span>
          </button>
          <button className="table-control-menu-item" onClick={() => alignCell(cellCoords.cellNodeKey, 'center')}>
            <span className="table-control-menu-item-icon">⇔</span>
            <span>Align Center</span>
          </button>
          <button className="table-control-menu-item" onClick={() => alignCell(cellCoords.cellNodeKey, 'right')}>
            <span className="table-control-menu-item-icon">≓</span>
            <span>Align Right</span>
          </button>
        </div>
      )}

      {/* BACKGROUND COLOR SUBMENU PORTAL */}
      {submenuOpen && activeMenu && (
        <div
          className="table-control-submenu font-sans z-50 pointer-events-auto"
          style={{
            top: submenuTop,
            left: submenuLeft,
          }}
          contentEditable={false}
        >
          <div className="table-control-menu-label">
            {activeMenu.type === 'row' ? 'Row Background' : activeMenu.type === 'column' ? 'Column Background' : 'Cell Background'}
          </div>
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.name}
              className="table-control-menu-item"
              onClick={() => {
                if (activeMenu.type === 'row' && coords) {
                  setRowBackgroundColor(activeMenu.index, coords.firstCellDOM, option.value)
                } else if (activeMenu.type === 'column') {
                  setColumnBackgroundColor(activeMenu.index, option.value)
                } else if (activeMenu.type === 'cell' && cellCoords) {
                  setCellBackgroundColor(cellCoords.cellNodeKey, option.value)
                }
              }}
            >
              <div 
                className="table-color-swatch" 
                style={{ 
                  backgroundColor: option.hex,
                  border: option.value ? undefined : '1px dashed currentColor',
                }} 
              />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* RESIZE GUIDE VISUAL HIGHLIGHT */}
      {activeResizeGuide && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            top: activeResizeGuide.top,
            left: activeResizeGuide.left,
            width: activeResizeGuide.width,
            height: activeResizeGuide.height,
            backgroundColor: isResizing ? '#2383e2' : 'rgba(35, 131, 226, 0.45)',
            boxShadow: isResizing ? '0 0 8px rgba(35, 131, 226, 0.7)' : '0 0 3px rgba(35, 131, 226, 0.3)',
            borderRadius: '1.5px',
            transition: isResizing ? 'none' : 'background-color 0.1s ease, box-shadow 0.1s ease',
          }}
        />
      )}
    </>,
    container
  )
}
