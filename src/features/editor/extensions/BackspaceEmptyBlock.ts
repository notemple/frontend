import { Extension } from '@tiptap/core';
import { Selection } from '@tiptap/pm/state';

// Recursively checks if a node is empty
function isBlockEmpty(node: any): boolean {
  if (node.isLeaf) {
    return node.textContent === '';
  }
  if (
    node.type.name === 'paragraph' ||
    node.type.name === 'heading' ||
    node.type.name === 'codeBlock' ||
    node.type.name === 'blockquote'
  ) {
    return node.content.size === 0;
  }
  if (node.type.name === 'taskItem' || node.type.name === 'listItem') {
    let isEmpty = true;
    node.forEach((child: any) => {
      if (!isBlockEmpty(child)) {
        isEmpty = false;
      }
    });
    return isEmpty;
  }
  return false;
}

export const BackspaceEmptyBlock = Extension.create({
  name: 'backspaceEmptyBlock',
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      'Backspace': () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;

        // Find the deepest target block node containing the cursor
        let targetDepth = -1;
        let targetNode = null;

        for (let d = $from.depth; d >= 1; d--) {
          const node = $from.node(d);
          if (
            node.type.name === 'paragraph' ||
            node.type.name === 'heading' ||
            node.type.name === 'codeBlock' ||
            node.type.name === 'blockquote' ||
            node.type.name === 'taskItem' ||
            node.type.name === 'listItem'
          ) {
            targetDepth = d;
            targetNode = node;
            break;
          }
        }

        if (!targetNode) return false;

        // Check if parent is a table cell or column, to avoid structural disruption
        if (targetDepth > 1) {
          const parentDepth = targetDepth - 1;
          const parentNode = $from.node(parentDepth);
          if (parentNode) {
            if (parentNode.type.name === 'column') {
              // Let ColumnsExtension handle it
              return false;
            }
            if (parentNode.type.name === 'tableCell' || parentNode.type.name === 'tableHeader') {
              if (parentNode.childCount <= 1) {
                return false; // Don't delete the only block in a table cell
              }
            }
          }
        }

        // If parent is a taskItem or listItem and it's empty, delete the parent list item instead
        if (targetDepth > 1) {
          const parentDepth = targetDepth - 1;
          const parentNode = $from.node(parentDepth);
          if (
            parentNode &&
            (parentNode.type.name === 'listItem' || parentNode.type.name === 'taskItem') &&
            isBlockEmpty(parentNode)
          ) {
            targetDepth = parentDepth;
            targetNode = parentNode;
          }
        }

        // If we are deleting a taskItem or listItem, check if it is the only child in its list container.
        // If so, target the list container itself to prevent violating schema constraints.
        if (targetNode && (targetNode.type.name === 'taskItem' || targetNode.type.name === 'listItem')) {
          if (targetDepth > 1) {
            const listDepth = targetDepth - 1;
            const listNode = $from.node(listDepth);
            if (
              listNode &&
              (listNode.type.name === 'taskList' ||
                listNode.type.name === 'bulletList' ||
                listNode.type.name === 'orderedList') &&
              listNode.childCount <= 1
            ) {
              targetDepth = listDepth;
              targetNode = listNode;
            }
          }
        }

        // Verify that the targeted node is empty
        if (!isBlockEmpty(targetNode)) {
          return false;
        }

        const startPos = $from.before(targetDepth);
        const endPos = $from.after(targetDepth);

        // Check if this is the only block in the document
        const isOnlyBlock = startPos === 0 && endPos === state.doc.content.size;

        if (isOnlyBlock) {
          if (targetNode.type.name === 'paragraph') {
            return false; // Keep the single empty paragraph
          }
          // Reset custom block to paragraph
          if (dispatch) {
            const tr = state.tr.replaceWith(startPos, endPos, state.schema.nodes.paragraph.create());
            dispatch(tr);
          }
          return true;
        }

        if (dispatch) {
          let tr = state.tr.delete(startPos, endPos);

          // Find selection after deletion
          const $pos = tr.doc.resolve(startPos);
          let newSelection = Selection.findFrom($pos, -1);
          if (!newSelection) {
            newSelection = Selection.findFrom($pos, 1);
          }

          if (newSelection) {
            tr = tr.setSelection(newSelection);
          }

          dispatch(tr.scrollIntoView());
        }

        return true;
      },
    };
  },
});
