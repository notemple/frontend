import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect, useRef, useState } from "react"
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
  $findTableNode
} from "@lexical/table"

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

export default function TableHoverActionsPlugin(): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext()
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null)
  const [coords, setCoords] = useState<CoordsInfo | null>(null)
  const [activeMenu, setActiveMenu] = useState<MenuState | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Selected cell state
  const [activeCellDOM, setActiveCellDOM] = useState<HTMLElement | null>(null)
  const [cellCoords, setCellCoords] = useState<CellCoordsInfo | null>(null)
  
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
      if (activeEl?.closest('.table-control-menu') || activeEl?.closest('.table-control-overlay')) {
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
      if (!target.closest('.table-control-menu') && !target.closest('.table-column-handle') && !target.closest('.table-row-handle')) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [activeMenu])

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

  // COLUMN ACTIONS
  const insertColumnRight = (index: number) => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $insertTableColumnAtSelection(true)
      }
    })
    setHoveredCell(null)
    setActiveMenu(null)
  }

  const insertColumnLeft = (index: number) => {
    if (!hoveredCell) return
    editor.update(() => {
      const cellNode = $getNearestNodeFromDOMNode(hoveredCell.cellDOM)
      if (cellNode instanceof TableCellNode) {
        cellNode.select()
        $insertTableColumnAtSelection(false)
      }
    })
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

  // Quick Appending Buttons
  const appendColumn = () => {
    if (!coords) return
    editor.update(() => {
      const lastCellNode = $getNearestNodeFromDOMNode(coords.lastCellDOM)
      if (lastCellNode instanceof TableCellNode) {
        lastCellNode.select()
        $insertTableColumnAtSelection(true)
      }
    })
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
        {coords && (
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
        {coords && (
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
        {cellCoords && (
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
        {coords && (
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
        {coords && (
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
    </>,
    container
  )
}
