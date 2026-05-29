import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useTableSelection } from './useTableSelection';
import { CellContextMenu } from './CellContextMenu';
import { 
  ArrowDown, 
  ArrowRight, 
  GridNine,
  Plus,
  DotsThree,
  Copy,
  Trash
} from '@phosphor-icons/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as ContextMenu from '@radix-ui/react-context-menu';

export const TableView: React.FC<NodeViewProps> = ({ 
  editor, 
  node, 
  getPos, 
  updateAttributes,
  deleteNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colCoords, setColCoords] = useState<{ left: number; width: number }[]>([]);
  const [rowCoords, setRowCoords] = useState<{ top: number; height: number }[]>([]);
  const [isTableActive, setIsTableActive] = useState(false);

  const tablePos = typeof getPos === 'function' ? getPos() : 0;

  const handleDuplicate = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function' && typeof editor.commands.insertContent === 'function') {
      const pos = getPos();
      editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    } else if (typeof deleteNode === 'function') {
      deleteNode();
    }
  };
  
  const {
    hoveredColumn,
    hoveredRow,
    setHoveredColumn,
    setHoveredRow,
    selectColumn,
    selectRow,
    selectAll
  } = useTableSelection(editor, tablePos);

  // Recalculate dimensions of cells for absolute positioned select triggers
  const updateCoords = () => {
    if (!containerRef.current) return;
    const wrapper = containerRef.current;
    const tableEl = wrapper.querySelector('table');
    if (!tableEl) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tableRect = tableEl.getBoundingClientRect();

    // 1. Get Column Positions from the first row cells
    const firstRowCells = tableEl.querySelectorAll('tr:first-child > *');
    const cols = Array.from(firstRowCells).map(cell => {
      const cellRect = cell.getBoundingClientRect();
      return {
        left: cellRect.left - wrapperRect.left,
        width: cellRect.width
      };
    });
    setColCoords(cols);

    // 2. Get Row Positions from rows
    const trs = tableEl.querySelectorAll('tr');
    const rows = Array.from(trs).map(row => {
      const rowRect = row.getBoundingClientRect();
      return {
        top: rowRect.top - wrapperRect.top,
        height: rowRect.height
      };
    });
    setRowCoords(rows);
  };

  useEffect(() => {
    // Initial coords set
    setTimeout(updateCoords, 50);

    // Resize observer to auto recalculate positions on window resize or container changes
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => {
        updateCoords();
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Recalculate coordinates whenever the table node structure updates
  useEffect(() => {
    updateCoords();
  }, [node]);

  // Handle click inside and outside table to show/hide arrows
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        setIsTableActive(true);
        setTimeout(updateCoords, 0);
      } else {
        setIsTableActive(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <NodeViewWrapper 
          ref={containerRef}
          onMouseLeave={() => {
            setHoveredColumn(null);
            setHoveredRow(null);
          }}
          className="table-view-container relative select-none w-full my-6 font-sans group/table"
        >
          {/* Hover Option Dropdown Trigger button - three-dot menu like todo lists */}
          <div className="opacity-0 group-hover/table:opacity-100 absolute right-3 top-3 transition-all duration-150 shrink-0 z-30 pointer-events-auto">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  className="w-6 h-6 rounded bg-background/90 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Options"
                >
                  <DotsThree size={14} weight="bold" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="table-dark-menu z-50 animate-fade-in">
                  <DropdownMenu.Item 
                    className="table-dark-menu-item"
                    onClick={handleDuplicate}
                  >
                    <div className="flex items-center gap-2">
                      <Copy size={14} />
                      <span>Duplicate block</span>
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="table-dark-menu-separator" />
                  <DropdownMenu.Item 
                    className="table-dark-menu-item text-red-400 hover:text-red-300"
                    onClick={handleDelete}
                  >
                    <div className="flex items-center gap-2">
                      <Trash size={14} />
                      <span>Delete block</span>
                    </div>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* 1. Top Column Selector Triggers */}
          {isTableActive && colCoords.map((coord, index) => (
            <div
              key={`col-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                selectColumn(index);
              }}
              onMouseEnter={() => setHoveredColumn(index)}
              onMouseLeave={() => setHoveredColumn(null)}
              style={{
                position: 'absolute',
                left: `${coord.left}px`,
                width: `${coord.width}px`,
                top: '-20px',
                height: '16px',
              }}
              className={`
                flex items-center justify-center cursor-pointer transition-all duration-150 rounded-sm border
                ${hoveredColumn === index 
                  ? 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 scale-105 shadow-sm-sm' 
                  : 'bg-muted/40 border-transparent hover:bg-muted text-muted-foreground/50'
                }
              `}
              title={`Select Column ${index + 1}`}
            >
              <ArrowDown size={10} weight="bold" />
            </div>
          ))}

          {/* 2. Left Row Selector Triggers */}
          {isTableActive && rowCoords.map((coord, index) => (
            <div
              key={`row-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                selectRow(index);
              }}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                position: 'absolute',
                left: '-20px',
                top: `${coord.top}px`,
                height: `${coord.height}px`,
                width: '16px',
              }}
              className={`
                flex items-center justify-center cursor-pointer transition-all duration-150 rounded-sm border
                ${hoveredRow === index 
                  ? 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 scale-105 shadow-sm-sm' 
                  : 'bg-muted/40 border-transparent hover:bg-muted text-muted-foreground/50'
                }
              `}
              title={`Select Row ${index + 1}`}
            >
              <ArrowRight size={10} weight="bold" />
            </div>
          ))}

          {/* 3. Top-Left Select-All Trigger */}
          {isTableActive && colCoords.length > 0 && rowCoords.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
              style={{
                position: 'absolute',
                left: '-20px',
                top: '-20px',
                width: '16px',
                height: '16px',
              }}
              className="flex items-center justify-center cursor-pointer rounded-sm border border-transparent bg-muted/40 hover:bg-purple-100 hover:border-purple-300 dark:hover:bg-purple-950/40 dark:hover:border-purple-900/50 text-muted-foreground/50 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-150"
              title="Select Entire Table"
            >
              <GridNine size={10} weight="bold" />
            </div>
          )}

          {/* 4. Cell Context Menu Portal trigger on the inner table view */}
          <CellContextMenu 
            editor={editor}
            columnIndex={hoveredColumn !== null ? hoveredColumn : 0}
          >
            <div className="tiptap-table-wrapper">
              <NodeViewContent 
                as={"table" as any} 
                className="tiptap-table" 
                onInput={updateCoords}
              />
            </div>
          </CellContextMenu>
        </NodeViewWrapper>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="table-dark-menu z-50 animate-fade-in">
          <ContextMenu.Item 
            className="table-dark-menu-item"
            onClick={handleDuplicate}
          >
            <div className="flex items-center gap-2">
              <Copy size={14} />
              <span>Duplicate block</span>
            </div>
          </ContextMenu.Item>
          <ContextMenu.Separator className="table-dark-menu-separator" />
          <ContextMenu.Item 
            className="table-dark-menu-item text-red-400 hover:text-red-300"
            onClick={handleDelete}
          >
            <div className="flex items-center gap-2">
              <Trash size={14} />
              <span>Delete block</span>
            </div>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
