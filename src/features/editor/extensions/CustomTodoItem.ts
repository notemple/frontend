import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { CustomTodoItemView } from './CustomTodoItemView';
import { useTaskStore } from '@/features/tasks/store';

const taskDeletionPlugin = new Plugin({
  key: new PluginKey('taskDeletionTracker'),
  state: {
    init(config, state) {
      const taskIds = new Set<string>();
      state.doc.descendants((node) => {
        if ((node.type.name === 'taskItem' || node.type.name === 'task_item') && node.attrs.taskId) {
          taskIds.add(node.attrs.taskId);
        }
      });
      return taskIds;
    },
    apply(tr, previousTaskIds, oldState, newState) {
      if (!tr.docChanged) {
        return previousTaskIds;
      }

      const currentTaskIds = new Set<string>();
      newState.doc.descendants((node) => {
        if ((node.type.name === 'taskItem' || node.type.name === 'task_item') && node.attrs.taskId) {
          currentTaskIds.add(node.attrs.taskId);
        }
      });

      const deletedTaskIds: string[] = [];
      previousTaskIds.forEach(id => {
        if (!currentTaskIds.has(id)) {
          deletedTaskIds.push(id);
        }
      });

      if (deletedTaskIds.length > 0) {
        const isReset = tr.steps.some(step => {
          const json = step.toJSON();
          return json.stepType === 'replace' && json.from === 0 && json.to >= oldState.doc.content.size - 1;
        });

        if (!isReset) {
          deletedTaskIds.forEach(id => {
            useTaskStore.getState().deleteTask(id);
          });
        }
      }

      return currentTaskIds;
    }
  }
});

export const CustomTodoItem = TaskItem.extend({
  // Extend schema attributes to register priority, due dates, start dates, and task sync states natively
  addAttributes() {
    return {
      ...this.parent?.(),
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: element => {
          const checked = element.getAttribute('data-checked') ?? element.getAttribute('checked');
          return checked === 'true' || checked === '';
        },
        renderHTML: attributes => ({
          'data-checked': attributes.checked,
        }),
      },
      isGreenTodo: {
        default: false,
        keepOnSplit: true,
        parseHTML: element => element.getAttribute('data-green-todo') === 'true',
        renderHTML: attributes => ({ 'data-green-todo': attributes.isGreenTodo }),
      },
      taskId: {
        default: null,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-task-id'),
        renderHTML: attributes => ({ 'data-task-id': attributes.taskId }),
      },
      startDate: {
        default: null,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-start-date'),
        renderHTML: attributes => ({ 'data-start-date': attributes.startDate }),
      },
      dueDate: {
        default: null,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-due-date') || element.getAttribute('data-deadline'),
        renderHTML: attributes => ({ 'data-due-date': attributes.dueDate }),
      },
      priority: {
        default: 'none',
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-priority') || 'none',
        renderHTML: attributes => ({ 'data-priority': attributes.priority }),
      },
      status: {
        default: 'open',
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-status') || 'open',
        renderHTML: attributes => ({ 'data-status': attributes.status }),
      },
    };
  },

  // Override node view rendering with CustomTodoItemView React NodeView
  addNodeView() {
    return ReactNodeViewRenderer(CustomTodoItemView);
  },

  addProseMirrorPlugins() {
    return [
      taskDeletionPlugin
    ];
  }
});
