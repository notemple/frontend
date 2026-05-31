import { Node } from '@tiptap/core';
import type { Command } from '@tiptap/core';

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
    return ['div', { 'data-type': 'columns', class: 'notemple-columns', ...HTMLAttributes }, 0];
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
});
export default ColumnsExtension;
