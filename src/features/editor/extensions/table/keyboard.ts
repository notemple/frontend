import { Extension } from '@tiptap/core';
import { keymap } from '@tiptap/pm/keymap';
import { TextSelection } from '@tiptap/pm/state';
import {
	addRowAfter,
	CellSelection,
	goToNextCell,
	TableMap
} from 'prosemirror-tables';

/**
 * Move focus to the cell above the current selection
 */
const moveFocusUp = (state: any, dispatch: any) => {
  const { selection } = state;
  const rect = getCellRect(state);
  if (!rect || rect.row === 0) return false;

  const tableNode = state.doc.nodeAt(rect.tableStart - 1);
  const map = TableMap.get(tableNode);
  const cellPos = map.positionAt(rect.row - 1, rect.col, tableNode);
  
  return selectAndFocusCell(rect.tableStart + cellPos, state, dispatch);
};

/**
 * Move focus to the cell below the current selection
 */
const moveFocusDown = (state: any, dispatch: any) => {
  const { selection } = state;
  const rect = getCellRect(state);
  if (!rect) return false;

  const tableNode = state.doc.nodeAt(rect.tableStart - 1);
  const map = TableMap.get(tableNode);
  if (rect.row + 1 >= map.height) return false;

  const cellPos = map.positionAt(rect.row + 1, rect.col, tableNode);
  
  return selectAndFocusCell(rect.tableStart + cellPos, state, dispatch);
};

/**
 * Move focus left or right
 */
const moveFocusHorizontal = (dir: 'left' | 'right') => (state: any, dispatch: any) => {
  const rect = getCellRect(state);
  if (!rect) return false;

  const tableNode = state.doc.nodeAt(rect.tableStart - 1);
  const map = TableMap.get(tableNode);
  
  let targetRow = rect.row;
  let targetCol = rect.col + (dir === 'left' ? -1 : 1);

  if (targetCol < 0) {
    targetRow -= 1;
    targetCol = map.width - 1;
  } else if (targetCol >= map.width) {
    targetRow += 1;
    targetCol = 0;
  }

  if (targetRow < 0 || targetRow >= map.height) return false;

  const cellPos = map.positionAt(targetRow, targetCol, tableNode);
  return selectAndFocusCell(rect.tableStart + cellPos, state, dispatch);
};

/**
 * Select a specific cell pos and place cursor inside it
 */
const selectAndFocusCell = (pos: number, state: any, dispatch: any) => {
  if (dispatch) {
    const cellNode = state.doc.nodeAt(pos);
    if (!cellNode) return false;

    // Place text selection at the start of cell content
    const textSel = TextSelection.create(state.doc, pos + 1);
    dispatch(state.tr.setSelection(textSel).scrollIntoView());
    return true;
  }
  return true;
};

/**
 * Retrieves the coordinates/index of the active cell
 */
const getCellRect = (state: any) => {
  const { selection } = state;
  let cellPos = -1;
  let tableStart = -1;
  let tableNode: any = null;

  // Search upwards for active cell
  const $pos = selection.$from;
  for (let i = $pos.depth; i > 0; i--) {
    const parentNode = $pos.node(i);
    if (parentNode.type.name === 'tableCell' || parentNode.type.name === 'tableHeader') {
      cellPos = $pos.before(i);
    }
    if (parentNode.type.name === 'table') {
      tableStart = $pos.before(i) + 1;
      tableNode = parentNode;
      break;
    }
  }

  if (cellPos === -1 || tableStart === -1 || !tableNode) return null;

  const map = TableMap.get(tableNode);
  const localPos = cellPos - tableStart;
  const cellIndex = map.map.indexOf(localPos);

  if (cellIndex === -1) return null;

  return {
    row: Math.floor(cellIndex / map.width),
    col: cellIndex % map.width,
    tableStart,
    cellPos,
  };
};

/**
 * Smart select command: select text -> select cell -> select whole table
 */
const handleCmdA = (state: any, dispatch: any) => {
  const rect = getCellRect(state);
  if (!rect) return false;

  const { selection } = state;
  const cellNode = state.doc.nodeAt(rect.cellPos);
  if (!cellNode) return false;

  // 1. If text inside cell is not fully selected, select all text in cell
  if (selection.from > rect.cellPos + 1 || selection.to < rect.cellPos + cellNode.nodeSize - 1) {
    if (dispatch) {
      const textSel = TextSelection.create(state.doc, rect.cellPos + 1, rect.cellPos + cellNode.nodeSize - 1);
      dispatch(state.tr.setSelection(textSel));
    }
    return true;
  }

  // 2. Select entire table
  if (dispatch) {
    const tableNode = state.doc.nodeAt(rect.tableStart - 1);
    const map = TableMap.get(tableNode);
    const firstCellPos = rect.tableStart + map.map[0];
    const lastCellPos = rect.tableStart + map.map[map.map.length - 1];

    const cellSel = CellSelection.create(state.doc, firstCellPos, lastCellPos);
    dispatch(state.tr.setSelection(cellSel));
  }
  return true;
};

export const TableKeyboardExtension = Extension.create({
  name: 'tableKeyboard',

  addProseMirrorPlugins() {
    return [
      keymap({
        // TAB: Move to next cell, add row if on last cell
        'Tab': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;

          const tableNode = state.doc.nodeAt(rect.tableStart - 1);
          const map = TableMap.get(tableNode);
          const isLastCell = rect.row === map.height - 1 && rect.col === map.width - 1;

          if (isLastCell) {
            // Append a row automatically at the bottom
            let tr = state.tr;
            
            // Add row
            addRowAfter(state, (newTr: any) => {
              tr = newTr;
            });

            if (dispatch) {
              // Dispatch row insertion and transition selection to the first cell of the newly added row
              dispatch(tr);
              setTimeout(() => {
                const refreshedRect = getCellRect(this.editor.state);
                if (refreshedRect) {
                  const targetPos = refreshedRect.tableStart + map.positionAt(refreshedRect.row + 1, 0, tableNode);
                  selectAndFocusCell(targetPos, this.editor.state, this.editor.view.dispatch);
                }
              }, 10);
            }
            return true;
          }

          // Otherwise let standard next cell command execute
          return goToNextCell(1)(state, dispatch);
        },

        'Shift-Tab': goToNextCell(-1),

        // ARROWS: Spreadsheet-style navigation
        'ArrowUp': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;
          // Only trigger if selection is at the top line of cell text
          const $pos = state.selection.$from;
          if ($pos.parent.type.name === 'paragraph' && $pos.before() === rect.cellPos + 1) {
            return moveFocusUp(state, dispatch);
          }
          return false;
        },

        'ArrowDown': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;
          // Only trigger if selection is at bottom line of cell text
          const $pos = state.selection.$to;
          if ($pos.parent.type.name === 'paragraph' && $pos.after() === rect.cellPos + state.doc.nodeAt(rect.cellPos)!.nodeSize - 1) {
            return moveFocusDown(state, dispatch);
          }
          return false;
        },

        'ArrowLeft': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;
          // Move left if cursor is at the very beginning of the cell text
          if (state.selection.empty && state.selection.from === rect.cellPos + 2) {
            return moveFocusHorizontal('left')(state, dispatch);
          }
          return false;
        },

        'ArrowRight': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;
          // Move right if cursor is at the very end of the cell text
          const cellNode = state.doc.nodeAt(rect.cellPos)!;
          if (state.selection.empty && state.selection.from === rect.cellPos + cellNode.nodeSize - 2) {
            return moveFocusHorizontal('right')(state, dispatch);
          }
          return false;
        },

        // ENTER: Create newline inside cell instead of default Prosemirror behaviour which breaks the table layout!
        'Enter': (state, dispatch) => {
          const rect = getCellRect(state);
          if (!rect) return false;
          
          if (dispatch) {
            // Split text with newline inside cell
            dispatch(state.tr.insertText('\n').scrollIntoView());
            return true;
          }
          return true;
        },

        // Keyboard Selection shortcuts
        'Mod-a': handleCmdA,
        'Escape': (state, dispatch) => {
          if (state.selection instanceof CellSelection) {
            if (dispatch) {
              const textSel = TextSelection.create(state.doc, state.selection.from);
              dispatch(state.tr.setSelection(textSel));
              return true;
            }
          }
          return false;
        }
      })
    ];
  }
});
