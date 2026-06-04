import { cn } from '@/shared/lib/utils';
import {
	autoUpdate,
	flip,
	inline,
	offset,
	shift,
	useFloating
} from '@floating-ui/react';
import {
	ArrowsOutSimple,
	Code,
	Layout,
	Palette,
	Plus,
	TextB,
	TextItalic,
	Trash
} from '@phosphor-icons/react';
import { Editor } from '@tiptap/core';
import { CellSelection } from 'prosemirror-tables';
import React,{ useEffect,useState } from 'react';
import { setCellBgColor,toggleTableWidth } from './table-utils';

interface FloatingToolbarProps {
  editor: Editor;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Position positioning state using Floating UI
  const { refs, floatingStyles, update } = useFloating({
    placement: 'top',
    open: isVisible,
    onOpenChange: setIsVisible,
    middleware: [offset(10), flip(), shift(), inline()],
    whileElementsMounted: autoUpdate,
  });

  // Track editor selection changes to render floating toolbar
  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      const { selection } = editor.state;
      const isInsideTable = editor.isActive('table');
      
      // Determine if a cell selection or cursor inside table cell is present
      const hasActiveSelection = selection instanceof CellSelection || (isInsideTable && !selection.empty);
      
      if (hasActiveSelection) {
        setIsVisible(true);
        // Find cell element in DOM and set it as reference for Floating UI
        const activeCellDom = document.querySelector('.selectedCell, td.focus, th.focus');
        if (activeCellDom) {
          refs.setReference(activeCellDom);
        } else {
          // Fallback to active ProseMirror selection range rect
          try {
            const node = editor.view.domAtPos(selection.from).node as HTMLElement;
            if (node) {
              refs.setReference(node.parentElement || node);
            }
          } catch (err) {
            setIsVisible(false);
          }
        }
      } else {
        setIsVisible(false);
        setShowColorPicker(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    editor.on('focus', handleSelectionChange);
    editor.on('blur', handleSelectionChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
      editor.off('focus', handleSelectionChange);
      editor.off('blur', handleSelectionChange);
    };
  }, [editor, refs]);

  if (!isVisible) return null;

  const bgColors = [
    { label: 'Pink Orchid', value: '#CDB4DB' },
    { label: 'Pastel Petal', value: '#FFC8DD' },
    { label: 'Blush Pop', value: '#FFAFCC' },
    { label: 'Icy Blue', value: '#BDE0FE' },
    { label: 'Sky Blue', value: '#A2D2FF' },
  ];

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-lg shadow-lg p-1.5 z-40 text-sans select-none animate-fade-in"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
          editor.isActive('bold') && "text-white bg-zinc-800"
        )}
        title="Bold"
      >
        <TextB size={14} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
          editor.isActive('italic') && "text-white bg-zinc-800"
        )}
        title="Italic"
      >
        <TextItalic size={14} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          "p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
          editor.isActive('code') && "text-white bg-zinc-800"
        )}
        title="Code"
      >
        <Code size={14} />
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      {/* Grid Controls */}
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Insert Row Below"
      >
        <div className="flex items-center gap-0.5">
          <Plus size={10} />
          <span className="text-[10px] font-bold">R</span>
        </div>
      </button>
      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Insert Column Right"
      >
        <div className="flex items-center gap-0.5">
          <Plus size={10} />
          <span className="text-[10px] font-bold">C</span>
        </div>
      </button>
      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
        title="Delete Row"
      >
        <div className="flex items-center gap-0.5">
          <Trash size={10} />
          <span className="text-[10px] font-bold">R</span>
        </div>
      </button>
      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
        title="Delete Column"
      >
        <div className="flex items-center gap-0.5">
          <Trash size={10} />
          <span className="text-[10px] font-bold">C</span>
        </div>
      </button>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      <button
        onClick={() => editor.chain().focus().mergeOrSplit().run()}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Merge/Split cells"
      >
        <Layout size={14} />
      </button>

      <button
        onClick={() => toggleTableWidth(editor)}
        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Toggle Full Width"
      >
        <ArrowsOutSimple size={14} />
      </button>

      {/* Background Color Picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={cn(
            "p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors",
            showColorPicker && "text-white bg-zinc-800"
          )}
          title="Cell Background Color"
        >
          <Palette size={14} />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#18181b] border border-[#27272a] rounded shadow-lg p-2 flex gap-1 z-50">
            {bgColors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  setCellBgColor(editor, color.value);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-110 active:scale-95 transition-transform"
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
            <button
              onClick={() => {
                setCellBgColor(editor, null);
                setShowColorPicker(false);
              }}
              className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Clear Color"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
