import { Table as TiptapTable } from '@tiptap/extension-table';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TableView } from './TableView';
import { TableKeyboardExtension } from './keyboard';

export const CustomTable = TiptapTable.extend({
  // Configure custom options
  addOptions() {
    return {
      ...this.parent?.(),
      resizable: true,
      HTMLAttributes: {
        class: 'tiptap-table',
      },
    };
  },

  // Bind the ReactNodeViewRenderer to TableView component
  addNodeView() {
    return ReactNodeViewRenderer(TableView);
  },

  // Attach spreadsheet keyboard shortcuts automatically
  addExtensions() {
    return [
      TableKeyboardExtension,
    ];
  },
});
