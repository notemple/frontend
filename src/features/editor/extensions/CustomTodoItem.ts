import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CustomTodoItemView } from './CustomTodoItemView';

export const CustomTodoItem = TaskItem.extend({
  // Extend schema attributes to register priority and due dates natively
  addAttributes() {
    return {
      ...this.parent?.(),
      priority: {
        default: 'none',
        parseHTML: element => element.getAttribute('data-priority') || 'none',
        renderHTML: attributes => ({ 'data-priority': attributes.priority }),
      },
      dueDate: {
        default: null,
        parseHTML: element => element.getAttribute('data-due-date'),
        renderHTML: attributes => ({ 'data-due-date': attributes.dueDate }),
      },
    };
  },

  // Override node view rendering with CustomTodoItemView React NodeView
  addNodeView() {
    return ReactNodeViewRenderer(CustomTodoItemView);
  },
});
