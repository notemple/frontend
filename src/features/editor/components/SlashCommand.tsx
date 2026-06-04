import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useTaskStore } from '@/features/tasks/store';
import { db } from '@/storage/dexie/db';
import {
	Calendar,
	CalendarBlank,
	CheckSquareOffset,
	CodeBlock,
	FileText,
	Image as ImageIcon,
	ListBullets,
	ListNumbers,
	Minus,
	Plus,
	Quotes,
	Smiley,
	Square,
	Table,
	Tag,
	TextAUnderline,
	TextT,
	Trash
} from '@phosphor-icons/react';
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import React from 'react';
import tippy,{ type Instance as TippyInstance } from 'tippy.js';
import { SlashCommandList } from './SlashCommandList';

import { addDays,format } from 'date-fns';

export interface CommandItem {
  title: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  command?: (props: { editor: any; range: any }) => void;
  submenu?: CommandItem[];
  group?: string; // Add group option
}

const isInsideColumn = (state: any) => {
  if (!state) return false;
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'column') {
      return true;
    }
  }
  return false;
};

export const getSuggestionItems = ({ query, editor }: { query: string; editor?: any }) => {
  const isInside = editor ? isInsideColumn(editor.state) : false;
  const items: CommandItem[] = [
    { title: 'Standard', icon: <TextT size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Small', icon: <TextAUnderline size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Heading 1', icon: <span className="font-bold text-xs leading-none">H1</span>, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run() },
    { title: 'Heading 2', icon: <span className="font-bold text-xs leading-none">H2</span>, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run() },
    { title: 'Heading 3', icon: <span className="font-bold text-xs leading-none">H3</span>, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run() },
    { title: 'Heading 4', icon: <span className="font-bold text-xs leading-none">H4</span>, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHeading({ level: 4 }).run() },
    { title: 'Bullet list', icon: <ListBullets size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
    { title: 'Alphabetical list', icon: <ListNumbers size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { title: 'Numbered list', icon: <ListNumbers size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { title: 'Roman list', icon: <ListNumbers size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { title: 'Quote block', icon: <Quotes size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
    { title: 'To-do', icon: <CheckSquareOffset size={16} className="text-green-500" />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().updateAttributes('taskItem', { isGreenTodo: true }).run() },
    { title: 'Icon', icon: <Smiley size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Code', icon: <CodeBlock size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    { title: 'Table', icon: <Table size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run() },
    { title: 'Divider', icon: <Minus size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
    { 
      title: 'Image', 
      icon: <ImageIcon size={16} />, 
      group: 'Create a block', 
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent({
          type: 'image',
          attrs: { src: '', width: '50%', alignment: 'center', caption: '' }
        }).run();
      }
    },
    {
      title: 'Gallery',
      icon: <ImageIcon size={16} className="text-purple-500" />,
      group: 'Create a block',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertGallery({ rows: 2, cols: 2 }).run();
      }
    },
    
    // Dynamic column actions when focused inside a column
    ...(isInside ? [
      { 
        title: 'Add column right', 
        icon: <Plus size={16} className="text-green-500" />, 
        group: 'Columns Actions', 
        command: ({ editor, range }: any) => {
          (editor.chain() as any).focus().deleteRange(range).addColumnAfter().run();
        } 
      },
      { 
        title: 'Add column left', 
        icon: <Plus size={16} className="text-green-500" />, 
        group: 'Columns Actions', 
        command: ({ editor, range }: any) => {
          (editor.chain() as any).focus().deleteRange(range).addColumnBefore().run();
        } 
      },
      { 
        title: 'Delete this column', 
        icon: <Trash size={16} className="text-rose-500" />, 
        group: 'Columns Actions', 
        command: ({ editor, range }: any) => {
          (editor.chain() as any).focus().deleteRange(range).deleteActiveColumn().run();
        } 
      },
    ] : []),

    // New Objects Group
    { 
      title: 'New Page', 
      icon: <FileText size={16} className="text-emerald-500/90 dark:text-emerald-400/90" />, 
      group: 'New Objects', 
      command: ({ editor, range }) => {
        const newPageId = `doc-${crypto.randomUUID()}`;
        
        useDocumentStore.getState().addDocument({
          id: newPageId,
          title: 'Untitled Page',
          content: '',
          type: 'page',
          tags: [],
          updatedAt: new Date().toISOString()
        });
        
        editor.chain().focus().deleteRange(range).insertContent({
          type: 'reference',
          attrs: { id: newPageId, label: 'Untitled Page', type: 'document' }
        }).insertContent(' ').run();
        
        const paneId = `pane-${Date.now()}`;
        useUiStore.getState().addPane(paneId);
        useUiStore.getState().openDocument(newPageId, paneId);
      }
    },
    { title: 'New Task', icon: <CheckSquareOffset size={16} className="text-rose-500/90 dark:text-rose-400/90" />, group: 'New Objects', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().updateAttributes('taskItem', { isGreenTodo: false }).run() },
    
    // References & Mentions Group
    { 
      title: 'Mention Document', 
      icon: <FileText size={16} className="text-blue-500" />, 
      group: 'References & Mentions', 
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent('@').run();
      } 
    },
    { 
      title: 'Mention Tag', 
      icon: <Tag size={16} className="text-rose-500" />, 
      group: 'References & Mentions', 
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent('#').run();
      } 
    },
    { 
      title: 'Mention Task', 
      icon: <CheckSquareOffset size={16} className="text-amber-500" />, 
      group: 'References & Mentions', 
      submenu: [
        {
          title: '+ Create new task...',
          icon: <CheckSquareOffset size={16} className="text-green-500" />,
          command: ({ editor, range }) => {
            const newTaskId = `task-${crypto.randomUUID()}`;
            useTaskStore.getState().addTask({
              id: newTaskId,
              title: 'New Task',
              completed: false,
              status: 'open',
              list: 'All Tasks'
            });
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'reference',
              attrs: { id: newTaskId, label: 'New Task', type: 'task', status: 'todo' }
            }).insertContent(' ').run();
            // Automatically open task editor popup for the newly created task
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('task-editor-open', {
                detail: { id: newTaskId }
              }));
            }, 50);
          }
        },
        ...useTaskStore.getState().tasks.filter(t => !t.isDeleted).map(task => ({
          title: task.title || 'Untitled Task',
          icon: <Square size={16} className="text-amber-500" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'reference',
              attrs: { id: task.id, label: task.title || 'Untitled Task', type: 'task', status: task.completed ? 'done' : 'todo' }
            }).insertContent(' ').run();
          }
        }))
      ]
    },
    { 
      title: 'Insert Date', 
      icon: <Calendar size={16} className="text-purple-500" />, 
      group: 'References & Mentions',
      submenu: [
        { 
          title: 'Today', 
          icon: <CalendarBlank size={16} className="text-purple-400" />, 
          command: ({ editor, range }) => {
            const today = new Date();
            const formatted = format(today, 'eeee, MMM d, yyyy');
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'reference',
              attrs: { label: 'Today', type: 'date', dateStr: formatted }
            }).insertContent(' ').run();
          } 
        },
        { 
          title: 'Tomorrow', 
          icon: <CalendarBlank size={16} className="text-purple-400" />, 
          command: ({ editor, range }) => {
            const tomorrow = addDays(new Date(), 1);
            const formatted = format(tomorrow, 'eeee, MMM d, yyyy');
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'reference',
              attrs: { label: 'Tomorrow', type: 'date', dateStr: formatted }
            }).insertContent(' ').run();
          } 
        },
        { 
          title: 'Next Week', 
          icon: <CalendarBlank size={16} className="text-purple-400" />, 
          command: ({ editor, range }) => {
            const nextWeek = addDays(new Date(), 7);
            const formatted = format(nextWeek, 'eeee, MMM d, yyyy');
            editor.chain().focus().deleteRange(range).insertContent({
              type: 'reference',
              attrs: { label: 'Next Week', type: 'date', dateStr: formatted }
            }).insertContent(' ').run();
          } 
        }
      ]
    }
  ];

  return items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
};

export const SlashCommandKey = new PluginKey('slashCommand');

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      } as any,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: SlashCommandKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const renderItems = () => {
  let component: ReactRenderer;
  let popup: TippyInstance[];

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(SlashCommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'slash-command',
      });
    },

    onUpdate(props: any) {
      component.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      const handled = (component.ref as any)?.onKeyDown(props);
      if (handled) {
        return true;
      }
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }
      return false;
    },

    onExit() {
      if (popup && popup[0] && !popup[0].state.isDestroyed) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }
    },
  };
};
