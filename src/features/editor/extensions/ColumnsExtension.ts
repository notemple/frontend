import type { Command } from '@tiptap/core';
import { Node } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ColumnsView } from '../components/ColumnsView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertColumns: (count?: number) => ReturnType;
    addColumnAfter: () => ReturnType;
    addColumnBefore: () => ReturnType;
    deleteActiveColumn: () => ReturnType;
  }
}

/**
 * Helper: Walk up from the resolved position to find the depth of a node
 * with the given type name. Returns -1 if not found.
 */
function findDepthByName($pos: ReturnType<typeof TextSelection.create>['$from'], name: string): number {
  for (let d = $pos.depth; d > 0; d--) {
    if ($pos.node(d).type.name === name) {
      return d;
    }
  }
  return -1;
}

export const ColumnsExtension = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'columns', class: 'templnote-columns', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsView);
  },

  addCommands() {
    return {
      insertColumns: (count: number = 2) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: Array.from({ length: count }, () => ({
            type: 'column',
            content: [{ type: 'paragraph' }],
          })),
        });
      },

      addColumnAfter: () => ({ state, dispatch }) => {
        const { $from } = state.selection;
        let columnDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
            break;
          }
        }
        if (columnDepth === -1) return false;

        const columnPos = $from.before(columnDepth);
        const columnNode = $from.node(columnDepth);
        const insertPos = columnPos + columnNode.nodeSize;

        if (dispatch) {
          const newColumn = state.schema.nodes.column.createAndFill();
          if (newColumn) {
            const transaction = state.tr.insert(insertPos, newColumn);
            dispatch(transaction);
            return true;
          }
        }
        return false;
      },

      addColumnBefore: () => ({ state, dispatch }) => {
        const { $from } = state.selection;
        let columnDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
            break;
          }
        }
        if (columnDepth === -1) return false;

        const columnPos = $from.before(columnDepth);

        if (dispatch) {
          const newColumn = state.schema.nodes.column.createAndFill();
          if (newColumn) {
            const transaction = state.tr.insert(columnPos, newColumn);
            dispatch(transaction);
            return true;
          }
        }
        return false;
      },

      deleteActiveColumn: () => ({ state, dispatch }) => {
        const { $from } = state.selection;
        let columnDepth = -1;
        let columnsDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'column') {
            columnDepth = d;
          }
          if ($from.node(d).type.name === 'columns') {
            columnsDepth = d;
          }
        }
        if (columnDepth === -1 || columnsDepth === -1) return false;

        const columnsNode = $from.node(columnsDepth);
        
        // If this is the only column left, delete the entire columns structure to avoid empty parent structures
        if (columnsNode.childCount <= 1) {
          const columnsPos = $from.before(columnsDepth);
          const columnsNodeSize = columnsNode.nodeSize;
          if (dispatch) {
            dispatch(state.tr.delete(columnsPos, columnsPos + columnsNodeSize));
            return true;
          }
          return false;
        }

        const columnPos = $from.before(columnDepth);
        const columnNode = $from.node(columnDepth);
        if (dispatch) {
          dispatch(state.tr.delete(columnPos, columnPos + columnNode.nodeSize));
          return true;
        }
        return false;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      /**
       * Tab — Move focus to the start of the next column sibling.
       * If the cursor is in the last column, move it after the columns block entirely.
       */
      'Tab': () => {
        const { state } = this.editor;
        const { $from } = state.selection;

        const columnDepth = findDepthByName($from, 'column');
        if (columnDepth === -1) return false;

        const columnsDepth = findDepthByName($from, 'columns');
        if (columnsDepth === -1) return false;

        const columnsNode = $from.node(columnsDepth);
        // $from.index(columnsDepth) gives the index of the current column child within the columns node
        const columnIndex = $from.index(columnsDepth);

        if (columnIndex < columnsNode.childCount - 1) {
          // There is a next column — jump to the start of its first text position.
          // The next column starts right after the current column ends.
          const columnPos = $from.before(columnDepth);
          const columnNode = $from.node(columnDepth);
          const nextColumnPos = columnPos + columnNode.nodeSize;
          // +1 to enter inside the next column node, then resolve to find the first valid cursor position
          const $nextCol = state.doc.resolve(nextColumnPos + 1);
          const targetPos = $nextCol.start($nextCol.depth);

          this.editor.commands.setTextSelection(targetPos);
          return true;
        }

        // At the last column — move cursor after the entire columns block
        const columnsPos = $from.before(columnsDepth);
        const afterColumnsPos = columnsPos + columnsNode.nodeSize;
        this.editor.commands.setTextSelection(afterColumnsPos);
        return true;
      },

      /**
       * Shift-Tab — Move focus to the start of the previous column sibling.
       * If the cursor is in the first column, move it before the columns block.
       */
      'Shift-Tab': () => {
        const { state } = this.editor;
        const { $from } = state.selection;

        const columnDepth = findDepthByName($from, 'column');
        if (columnDepth === -1) return false;

        const columnsDepth = findDepthByName($from, 'columns');
        if (columnsDepth === -1) return false;

        const columnIndex = $from.index(columnsDepth);

        if (columnIndex > 0) {
          // There is a previous column — jump to its start.
          // The previous column ends where the current column begins.
          const columnPos = $from.before(columnDepth);
          // Resolve inside the previous column (one position before the current column's opening)
          const $prevCol = state.doc.resolve(columnPos - 1);
          // Walk up to find the 'column' depth in the previous column, then use its start
          const prevColumnDepth = findDepthByName($prevCol, 'column');
          if (prevColumnDepth === -1) return false;
          const targetPos = $prevCol.start(prevColumnDepth) + 1; // +1 enters the first child block

          this.editor.commands.setTextSelection(targetPos);
          return true;
        }

        // At the first column — move cursor before the entire columns block
        const columnsPos = $from.before(columnsDepth);
        this.editor.commands.setTextSelection(columnsPos);
        return true;
      },

      /**
       * Backspace — Smart deletion for empty columns.
       * - If the column has a single empty paragraph AND it's the only column, delete the entire columns wrapper.
       * - If the column has a single empty paragraph but there are other columns, delete just this column.
       * - Otherwise, let default Backspace behavior handle it.
       */
      'Backspace': () => {
        const { state } = this.editor;
        const { $from } = state.selection;

        const columnDepth = findDepthByName($from, 'column');
        if (columnDepth === -1) return false;

        const columnsDepth = findDepthByName($from, 'columns');
        if (columnsDepth === -1) return false;

        const columnNode = $from.node(columnDepth);

        // Check if the column contains only a single empty paragraph
        const isSingleEmptyParagraph =
          columnNode.childCount === 1 &&
          columnNode.firstChild?.type.name === 'paragraph' &&
          columnNode.firstChild.content.size === 0;

        if (!isSingleEmptyParagraph) {
          // Column has real content — let default Backspace handle it
          return false;
        }

        // Also require cursor to be at position 0 within the column (start of the empty paragraph)
        const columnStart = $from.start(columnDepth);
        if ($from.pos !== columnStart + 1) {
          // Cursor isn't at the very beginning of the column's content — skip
          return false;
        }

        const columnsNode = $from.node(columnsDepth);

        if (columnsNode.childCount <= 1) {
          // Only column left — delete the entire columns structure
          return (this.editor.commands as any).deleteActiveColumn();
        }

        // Multiple columns — delete just this empty column
        return (this.editor.commands as any).deleteActiveColumn();
      },

      /**
       * Enter — Exit columns when pressing Enter at the very end of the last column's last block.
       * Inserts a new paragraph after the columns block and moves cursor there.
       */
      'Enter': () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;

        // Only handle collapsed (non-range) selections
        if (!empty) return false;

        const columnDepth = findDepthByName($from, 'column');
        if (columnDepth === -1) return false;

        const columnsDepth = findDepthByName($from, 'columns');
        if (columnsDepth === -1) return false;

        const columnsNode = $from.node(columnsDepth);
        const columnIndex = $from.index(columnsDepth);

        // Only trigger on the last column
        if (columnIndex !== columnsNode.childCount - 1) return false;

        const columnNode = $from.node(columnDepth);

        // Check that the cursor is at the very end of the column's content.
        // $from.end(columnDepth) gives the position at the end of the column node's content.
        const columnEnd = $from.end(columnDepth);
        if ($from.pos !== columnEnd) return false;

        // Also verify we're inside an empty block (empty paragraph at the end of the column).
        // This prevents Enter from hijacking normal typing mid-content.
        const lastChild = columnNode.lastChild;
        if (!lastChild || lastChild.type.name !== 'paragraph' || lastChild.content.size !== 0) {
          return false;
        }

        const columnsPos = $from.before(columnsDepth);
        const afterColumnsPos = columnsPos + columnsNode.nodeSize;
        const paragraph = state.schema.nodes.paragraph.create();

        const tr = state.tr.insert(afterColumnsPos, paragraph);
        // +1 to place cursor inside the newly inserted paragraph
        tr.setSelection(TextSelection.create(tr.doc, afterColumnsPos + 1));
        this.editor.view.dispatch(tr);
        return true;
      },
    };
  },
});
export default ColumnsExtension;
