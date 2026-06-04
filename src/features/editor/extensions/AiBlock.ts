import { Node,mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AiBlockView } from './AiBlockView';

export const AiBlock = Node.create({
  name: 'aiBlock',
  group: 'block',
  content: '', // Leaf node block
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      paneId: '',
    };
  },

  addAttributes() {
    return {
      prompt: { default: '' },
      model: { default: 'Gemini 3.5 Flash' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ai-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiBlockView);
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, $to } = selection;

        // Only trigger if selection is collapsed
        if ($from.pos !== $to.pos) return false;

        // Get the parent node of the current cursor position
        const parentNode = $from.parent;
        
        // Ensure the current node is a standard empty paragraph
        if (!parentNode || parentNode.type.name !== 'paragraph') return false;
        if (parentNode.content.size > 0) return false;

        // Calculate block node boundary positions to replace it cleanly
        const start = $from.before(1);
        const end = $from.after(1);

        this.editor
          .chain()
          .focus()
          .deleteRange({ from: start, to: end })
          .insertContentAt(start, { type: 'aiBlock' })
          .run();

        return true; // Block default tab indentation behavior
      },
    };
  },
});
