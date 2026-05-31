import { Node } from '@tiptap/core';

export const ColumnExtension = Node.create({
  name: 'column',

  // Defines that the column node can contain one or more blocks (paragraphs, lists, code, etc.)
  content: 'block+',

  // Columns shouldn't be created as top-level free-floating blocks, only inside the parent ColumnsExtension container
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'column', class: 'notemple-column', ...HTMLAttributes }, 0];
  },
});
