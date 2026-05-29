import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ReferenceNodeView } from '../components/ReferenceNodeView';

export interface ReferenceNodeAttributes {
  id: string | null;
  label: string;
  type: 'document' | 'task' | 'date' | 'tag' | 'person';
  status?: 'todo' | 'done';
  dueDate?: string | null;
  dateStr?: string | null;
}

export const ReferenceExtension = Node.create({
  name: 'reference',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({ 'data-id': attributes.id }),
      },
      label: {
        default: '',
        parseHTML: element => element.getAttribute('data-label') || element.textContent || '',
        renderHTML: attributes => ({ 'data-label': attributes.label }),
      },
      type: {
        default: 'document',
        parseHTML: element => element.getAttribute('data-type') || 'document',
        renderHTML: attributes => ({ 'data-type': attributes.type }),
      },
      status: {
        default: 'todo',
        parseHTML: element => element.getAttribute('data-status') || 'todo',
        renderHTML: attributes => ({ 'data-status': attributes.status }),
      },
      dueDate: {
        default: null,
        parseHTML: element => element.getAttribute('data-due-date'),
        renderHTML: attributes => ({ 'data-due-date': attributes.dueDate }),
      },
      dateStr: {
        default: null,
        parseHTML: element => element.getAttribute('data-date-str'),
        renderHTML: attributes => ({ 'data-date-str': attributes.dateStr }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-reference]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-reference': '' }, HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReferenceNodeView);
  },
});
