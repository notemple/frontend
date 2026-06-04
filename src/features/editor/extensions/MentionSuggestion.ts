import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy,{ type Instance as TippyInstance } from 'tippy.js';
import { MentionList } from '../components/MentionList';

export const MentionSuggestionKey = new PluginKey('mentionSuggestion');

export const MentionSuggestion = Extension.create({
  name: 'mentionSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '@',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      } as any,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: MentionSuggestionKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const renderMentionItems = () => {
  let component: ReactRenderer;
  let popup: TippyInstance[];

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(MentionList, {
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
      if (popup && popup[0] && !popup[0].state.isDestroyed) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }
    },
  };
};
