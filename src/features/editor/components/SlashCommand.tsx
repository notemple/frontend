import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { SlashCommandList } from './SlashCommandList';
import {
  Sparkle,
  ListBullets,
  TextAUnderline,
  PaintBrush,
  Palette,
  TextIndent,
  TextAlignLeft,
  TextT,
  TextB,
  ListNumbers,
  CheckSquareOffset,
  TextItalic,
  TextStrikethrough,
  HighlighterCircle,
  TextAlignRight,
  TextAlignCenter,
  TextAlignJustify,
  Quotes,
  CaretRight,
  Smiley,
  Square,
  MathOperations,
  CodeBlock,
  Table,
  Tag,
  User,
  Book,
  FileText,
  CalendarBlank,
  Image as ImageIcon,
  Globe,
  File,
  Clock,
  Calendar
} from '@phosphor-icons/react';
import React from 'react';

export interface CommandItem {
  title: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  command?: (props: { editor: any; range: any }) => void;
  submenu?: CommandItem[];
  group?: string; // Add group option
}

export const getSuggestionItems = ({ query }: { query: string }) => {
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
    { title: 'To-do', icon: <CheckSquareOffset size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
    { title: 'Toggle', icon: <CaretRight size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Icon', icon: <Smiley size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Group', icon: <Square size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Math', icon: <MathOperations size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    { title: 'Code', icon: <CodeBlock size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    { title: 'Table', icon: <Table size={16} />, group: 'Create a block', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },  ];

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
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }
      return (component.ref as any)?.onKeyDown(props);
    },

    onExit() {
      popup[0].destroy();
      component.destroy();
    },
  };
};
