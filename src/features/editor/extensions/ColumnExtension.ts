import { Node } from '@tiptap/core';

export const ColumnExtension = Node.create({
  name: 'column',

  // Defines that the column node can contain one or more blocks (paragraphs, lists, code, etc.)
  content: 'block+',

  // Columns shouldn't be created as top-level free-floating blocks, only inside the parent ColumnsExtension container
  defining: true,

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: element => {
          const val = element.getAttribute('data-width') || element.style.width;
          if (val === 'auto') return 'auto';
          return val ? parseFloat(val) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) return {};
          if (attributes.width === 'auto') {
            return {
              style: 'width: auto',
              'data-width': 'auto',
              class: 'width-auto',
            };
          }
          return {
            style: `width: ${attributes.width}%`,
            'data-width': attributes.width,
          };
        },
      },
    };
  },

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
