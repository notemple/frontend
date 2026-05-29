import { Editor } from '@tiptap/core';

/**
 * Command helper to instantly insert a standard table and set focus inside it
 */
export const insertCraftTable = (editor: Editor, rows = 3, cols = 4, withHeaderRow = true) => {
  editor
    .chain()
    .focus()
    .insertTable({
      rows,
      cols,
      withHeaderRow
    })
    .run();
};

export const TableSlashCommandItem = {
  title: "Table",
  description: "Insert a table",
  keywords: ["grid", "spreadsheet"],
  command: ({ editor, range }: { editor: Editor; range: any }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertTable({
        rows: 3,
        cols: 4,
        withHeaderRow: true
      })
      .run();
  }
};
