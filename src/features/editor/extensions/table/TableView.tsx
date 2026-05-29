import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useTableSelection } from './useTableSelection';
import { CellContextMenu } from './CellContextMenu';
import { 
  ArrowDown, 
  ArrowRight, 
  GridNine,
  Plus
} from '@phosphor-icons/react';

export const TableView: React.FC<NodeViewProps> = ({ 
  editor, 
  node, 
  getPos, 
  updateAttributes 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colCoords, setColCoords] = useState<{ left: number; width: number }[]>([]);
  const [rowCoords, setRowCoords] = useState<{ top: number; height: number }[]>([]);
  const [isTableActive, setIsTableActive] = useState(false);

  const tablePos = typeof getPos === 'function' ? getPos() : 0;
  
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
    <NodeViewWrapper 
      ref={containerRef}
      onMouseLeave={() => {
        setHoveredColumn(null);
        setHoveredRow(null);
      }}
      className="table-view-container relative select-none w-full my-6 font-sans group/table"
    >
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
  );
};
