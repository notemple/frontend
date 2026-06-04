import { TableCell as TiptapTableCell,TableHeader as TiptapTableHeader } from '@tiptap/extension-table';

export const TableCell = TiptapTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      background: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.background) {
            return {};
          }
          return {
            style: `background-color: ${attributes.background};`,
          };
        },
      },
    };
  },
});

export const TableHeader = TiptapTableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      background: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.background) {
            return {};
          }
          return {
            style: `background-color: ${attributes.background};`,
          };
        },
      },
    };
  },
});
export { TableRow } from '@tiptap/extension-table';
