import React from 'react';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import { Editor } from '@tiptap/core';
import { 
  Table, 
  Plus, 
  Trash, 
  TextB, 
  TextItalic, 
  Code, 
  ArrowsInSimple, 
  MathOperations, 
  ArrowUp, 
  ArrowDown,
  ListBullets,
  CheckSquareOffset,
  PaintBrush,
  Eraser,
  ArrowsOutSimple
} from '@phosphor-icons/react';
import { sortTableColumn, resetColumnSizes, clearSelectedCells, toggleTableWidth } from './table-utils';

interface CellContextMenuProps {
  editor: Editor;
  children: React.ReactNode;
  columnIndex: number;
}

export const CellContextMenu: React.FC<CellContextMenuProps> = ({ 
  editor, 
  children,
  columnIndex 
}) => {
  const handleSortAscending = () => {
    sortTableColumn(editor, columnIndex, true);
  };

  const handleSortDescending = () => {
    sortTableColumn(editor, columnIndex, false);
  };

  const handleResetSizes = () => {
    resetColumnSizes(editor);
  };

  const handleClearContents = () => {
    clearSelectedCells(editor);
  };

  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild>
        {children}
      </RadixContextMenu.Trigger>

      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className="table-dark-menu z-50">
          
          {/* Submenu: Edit Table */}
          <RadixContextMenu.Sub>
            <RadixContextMenu.SubTrigger className="table-dark-menu-item">
              <div className="flex items-center gap-2">
                <Table size={14} />
                <span>Edit Table</span>
              </div>
              <span className="text-[10px] text-[#71717a] ml-auto">▶</span>
            </RadixContextMenu.SubTrigger>
            <RadixContextMenu.Portal>
              <RadixContextMenu.SubContent className="table-dark-menu z-50">
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={14} />
                    <span>Insert Row Above</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={14} />
                    <span>Insert Row Below</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Separator className="table-dark-menu-separator" />
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={14} />
                    <span>Insert Column Left</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={14} />
                    <span>Insert Column Right</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Separator className="table-dark-menu-separator" />
                <RadixContextMenu.Item 
                  className="table-dark-menu-item text-red-400 hover:text-red-300"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  <div className="flex items-center gap-2">
                    <Trash size={14} />
                    <span>Delete Row</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item text-red-400 hover:text-red-300"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  <div className="flex items-center gap-2">
                    <Trash size={14} />
                    <span>Delete Column</span>
                  </div>
                </RadixContextMenu.Item>
                <RadixContextMenu.Separator className="table-dark-menu-separator" />
                <RadixContextMenu.Item 
                  className="table-dark-menu-item text-red-400 hover:text-red-300"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  <div className="flex items-center gap-2">
                    <Trash size={14} />
                    <span>Delete Table</span>
                  </div>
                </RadixContextMenu.Item>
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>

          {/* Submenu: Header Row/Column */}
          <RadixContextMenu.Sub>
            <RadixContextMenu.SubTrigger className="table-dark-menu-item">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold border border-white/20 px-0.5 rounded leading-none">H</span>
                <span>Header</span>
              </div>
              <span className="text-[10px] text-[#71717a] ml-auto">▶</span>
            </RadixContextMenu.SubTrigger>
            <RadixContextMenu.Portal>
              <RadixContextMenu.SubContent className="table-dark-menu z-50">
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                >
                  <span>Toggle Header Row</span>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                >
                  <span>Toggle Header Column</span>
                </RadixContextMenu.Item>
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>

          {/* Submenu: Format */}
          <RadixContextMenu.Sub>
            <RadixContextMenu.SubTrigger className="table-dark-menu-item">
              <div className="flex items-center gap-2">
                <TextB size={14} />
                <span>Format</span>
              </div>
              <span className="text-[10px] text-[#71717a] ml-auto">▶</span>
            </RadixContextMenu.SubTrigger>
            <RadixContextMenu.Portal>
              <RadixContextMenu.SubContent className="table-dark-menu z-50">
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <div className="flex items-center gap-2">
                    <TextB size={14} />
                    <span>Bold</span>
                  </div>
                  <span className="table-dark-menu-shortcut">⌘B</span>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <div className="flex items-center gap-2">
                    <TextItalic size={14} />
                    <span>Italic</span>
                  </div>
                  <span className="table-dark-menu-shortcut">⌘I</span>
                </RadixContextMenu.Item>
                <RadixContextMenu.Item 
                  className="table-dark-menu-item"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                >
                  <div className="flex items-center gap-2">
                    <Code size={14} />
                    <span>Inline Code</span>
                  </div>
                  <span className="table-dark-menu-shortcut">⌘E</span>
                </RadixContextMenu.Item>
              </RadixContextMenu.SubContent>
            </RadixContextMenu.Portal>
          </RadixContextMenu.Sub>

          <RadixContextMenu.Separator className="table-dark-menu-separator" />

          {/* Sorting */}
          <RadixContextMenu.Item 
            className="table-dark-menu-item"
            onClick={handleSortAscending}
          >
            <div className="flex items-center gap-2">
              <ArrowUp size={14} />
              <span>Sort Ascending (1, 2, 3...)</span>
            </div>
          </RadixContextMenu.Item>
          <RadixContextMenu.Item 
            className="table-dark-menu-item"
            onClick={handleSortDescending}
          >
            <div className="flex items-center gap-2">
              <ArrowDown size={14} />
              <span>Sort Descending (3, 2, 1...)</span>
            </div>
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="table-dark-menu-separator" />

          {/* Sizes & Reset */}
          <RadixContextMenu.Item 
            className="table-dark-menu-item"
            onClick={() => toggleTableWidth(editor)}
          >
            <div className="flex items-center gap-2">
              <ArrowsOutSimple size={14} />
              <span>Toggle Full Width</span>
            </div>
          </RadixContextMenu.Item>
          
          <RadixContextMenu.Item 
            className="table-dark-menu-item"
            onClick={handleResetSizes}
          >
            <div className="flex items-center gap-2">
              <ArrowsInSimple size={14} />
              <span>Reset Column Size</span>
            </div>
          </RadixContextMenu.Item>
          
          <RadixContextMenu.Item 
            className="table-dark-menu-item"
            onClick={() => editor.chain().focus().mergeOrSplit().run()}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold border border-white/20 px-0.5 rounded leading-none">M</span>
              <span>Merge/Split Cells</span>
            </div>
          </RadixContextMenu.Item>

          <RadixContextMenu.Separator className="table-dark-menu-separator" />

          <RadixContextMenu.Item 
            className="table-dark-menu-item text-red-400 hover:text-red-300"
            onClick={handleClearContents}
          >
            <div className="flex items-center gap-2">
              <Eraser size={14} />
              <span>Clear Cell Contents</span>
            </div>
          </RadixContextMenu.Item>

          <RadixContextMenu.Item 
            className="table-dark-menu-item text-red-400 hover:text-red-300"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <div className="flex items-center gap-2">
              <Trash size={14} />
              <span>Delete Table</span>
            </div>
          </RadixContextMenu.Item>

        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
};
