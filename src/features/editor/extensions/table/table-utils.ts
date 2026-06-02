import { Editor } from '@tiptap/core';
import { Selection, Transaction } from '@tiptap/pm/state';
import { CellSelection, TableMap } from 'prosemirror-tables';

/**
 * Reset all column sizes inside a table to be equal or fit-contents
 */
export const resetColumnSizes = (editor: Editor) => {
  const { state, dispatch } = editor.view;
  const { selection } = state;
  
  // Find table node around selection
  let tablePos = -1;
  let tableNode: any = null;
  
  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'table') {
      tablePos = pos;
      tableNode = node;
      return false;
    }
  });

  if (tablePos === -1 || !tableNode) return;

  const tr = state.tr;
  const map = TableMap.get(tableNode);
  
  // Update cell width attributes to null to let browser auto-layout
  for (let i = 0; i < map.width * map.height; i++) {
    const cellPos = map.map[i];
    const cell = tableNode.nodeAt(cellPos);
    if (cell && cell.attrs.colwidth) {
      tr.setNodeMarkup(tablePos + cellPos + 1, undefined, {
        ...cell.attrs,
        colwidth: null,
      });
    }
  }

  if (tr.docChanged) {
    dispatch(tr);
  }
};

/**
 * Sorts table rows based on text content of a specific column index
 */
export const sortTableColumn = (editor: Editor, columnIndex: number, ascending = true) => {
  const { state, dispatch } = editor.view;
  const { selection } = state;

  let tablePos = -1;
  let tableNode: any = null;

  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'table') {
      tablePos = pos;
      tableNode = node;
      return false;
    }
  });

  if (tablePos === -1 || !tableNode) return;

  const tr = state.tr;
  const map = TableMap.get(tableNode);
  const rows: any[] = [];
  
  // Get all row nodes
  tableNode.forEach((rowNode: any, offset: number, index: number) => {
    rows.push({
      node: rowNode,
      index,
      pos: tablePos + offset + 1,
    });
  });

  // Keep the first row intact if it's a header row
  const hasHeader = tableNode.firstChild?.firstChild?.type.name === 'tableHeader';
  const startRowIndex = hasHeader ? 1 : 0;
  const sortableRows = rows.slice(startRowIndex);

  // Extract cell text for comparison
  const getCellText = (rowNode: any, colIdx: number) => {
    let text = '';
    let currCol = 0;
    rowNode.forEach((cellNode: any) => {
      if (currCol === colIdx) {
        text = cellNode.textContent || '';
      }
      currCol += cellNode.attrs.colspan || 1;
    });
    return text.trim();
  };

  sortableRows.sort((a, b) => {
    const textA = getCellText(a.node, columnIndex);
    const textB = getCellText(b.node, columnIndex);
    
    // Check if numeric comparison can be done
    const numA = parseFloat(textA);
    const numB = parseFloat(textB);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return ascending ? numA - numB : numB - numA;
    }
    
    return ascending 
      ? textA.localeCompare(textB, undefined, { numeric: true, sensitivity: 'base' })
      : textB.localeCompare(textA, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Re-assemble the table row nodes in the transaction
  const sortedRows = hasHeader ? [rows[0].node, ...sortableRows.map(r => r.node)] : sortableRows.map(r => r.node);
  const newTableNode = tableNode.type.create(tableNode.attrs, sortedRows);

  tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTableNode);
  dispatch(tr);
};

/**
 * Clear the text content of all selected cells
 */
export const clearSelectedCells = (editor: Editor) => {
  const { state, dispatch } = editor.view;
  const { selection } = state;

  if (!(selection instanceof CellSelection)) {
    // If it's standard text selection inside a single cell, clear block text
    editor.commands.deleteSelection();
    return;
  }

  const tr = state.tr;
  selection.forEachCell((node, pos) => {
    if (node.content.size > 0) {
      tr.delete(pos + 1, pos + node.nodeSize - 1);
    }
  });

  if (tr.docChanged) {
    dispatch(tr);
  }
};

/**
 * Set custom styling (e.g. background wash) on all selected cells
 */
export const setCellBgColor = (editor: Editor, color: string | null) => {
  const { state, dispatch } = editor.view;
  const { selection } = state;

  if (!(selection instanceof CellSelection)) return;

  const tr = state.tr;
  selection.forEachCell((node, pos) => {
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      background: color,
    });
  });

  if (tr.docChanged) {
    dispatch(tr);
  }
};

/**
 * Prepares the schema for future database, formulas or relationships conversion
 */
export interface TableMetadata {
  id: string;
  name: string;
  columnsConfig: Record<string, {
    type: 'text' | 'number' | 'date' | 'checkbox' | 'formula';
    formulaExpression?: string;
  }>;
}

/**
 * Toggle the width of the table between 'normal' and 'full-width'
 */
export const toggleTableWidth = (editor: Editor) => {
  const { state } = editor.view;
  const { selection } = state;
  
  // Find table node around selection
  let tablePos = -1;
  let tableNode: any = null;
  
  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'table') {
      tablePos = pos;
      tableNode = node;
      return false;
    }
  });

  if (tablePos === -1 || !tableNode) return;

  const currentWidthType = tableNode.attrs.widthType || 'normal';
  const nextWidthType = currentWidthType === 'full-width' ? 'normal' : 'full-width';

  editor.chain().focus().updateAttributes('table', { widthType: nextWidthType }).run();
};
