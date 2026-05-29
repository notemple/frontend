import { useCallback, useState } from 'react';
import { Editor } from '@tiptap/core';
import { CellSelection, TableMap } from 'prosemirror-tables';

export const useTableSelection = (editor: Editor, tablePos: number) => {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  /**
   * Helper to fetch TableMap and Node
   */
  const getTableData = useCallback(() => {
    const tableNode = editor.state.doc.nodeAt(tablePos);
    if (!tableNode || tableNode.type.name !== 'table') return null;
    return {
      node: tableNode,
      map: TableMap.get(tableNode),
    };
  }, [editor, tablePos]);

  /**
   * Select a full column by index
   */
  const selectColumn = useCallback((columnIndex: number) => {
    const data = getTableData();
    if (!data) return;

    const { map } = data;
    const firstCellPos = tablePos + 1 + map.map[columnIndex];
    const lastCellPos = tablePos + 1 + map.map[(map.height - 1) * map.width + columnIndex];

    const tr = editor.state.tr;
    const selection = CellSelection.create(editor.state.doc, firstCellPos, lastCellPos);
    
    editor.view.dispatch(tr.setSelection(selection as any));
    editor.view.focus();
  }, [editor, tablePos, getTableData]);

  /**
   * Select a full row by index
   */
  const selectRow = useCallback((rowIndex: number) => {
    const data = getTableData();
    if (!data) return;

    const { map } = data;
    const firstCellPos = tablePos + 1 + map.map[rowIndex * map.width];
    const lastCellPos = tablePos + 1 + map.map[rowIndex * map.width + map.width - 1];

    const tr = editor.state.tr;
    const selection = CellSelection.create(editor.state.doc, firstCellPos, lastCellPos);
    
    editor.view.dispatch(tr.setSelection(selection as any));
    editor.view.focus();
  }, [editor, tablePos, getTableData]);

  /**
   * Select the entire table
   */
  const selectAll = useCallback(() => {
    const data = getTableData();
    if (!data) return;

    const { map } = data;
    const firstCellPos = tablePos + 1 + map.map[0];
    const lastCellPos = tablePos + 1 + map.map[map.map.length - 1];

    const tr = editor.state.tr;
    const selection = CellSelection.create(editor.state.doc, firstCellPos, lastCellPos);
    
    editor.view.dispatch(tr.setSelection(selection as any));
    editor.view.focus();
  }, [editor, tablePos, getTableData]);

  return {
    hoveredColumn,
    hoveredRow,
    setHoveredColumn,
    setHoveredRow,
    selectColumn,
    selectRow,
    selectAll,
  };
};
