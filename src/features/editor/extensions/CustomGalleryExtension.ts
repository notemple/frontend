import { Node } from '@tiptap/core';
import type { Command } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CustomGalleryNodeView } from '../components/CustomGalleryNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertGallery: (options: { rows: number; cols: number }) => ReturnType;
  }
}

export const CustomGalleryExtension = Node.create({
  name: 'gallery',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rows: {
        default: 1,
        parseHTML: element => Number(element.getAttribute('data-rows')) || 1,
        renderHTML: attributes => ({ 'data-rows': attributes.rows }),
      },
      cols: {
        default: 1,
        parseHTML: element => Number(element.getAttribute('data-cols')) || 1,
        renderHTML: attributes => ({ 'data-cols': attributes.cols }),
      },
      images: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-images') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => ({ 'data-images': JSON.stringify(attributes.images) }),
      },
      width: {
        default: '50%',
        parseHTML: element => element.getAttribute('data-width') || '50%',
        renderHTML: attributes => ({ 'data-width': attributes.width }),
      },
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({ 'data-alignment': attributes.alignment }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'gallery', ...HTMLAttributes }];
  },

  addCommands() {
    return {
      insertGallery: (options: { rows: number; cols: number }) => ({ commands }) => {
        const totalImages = options.rows * options.cols;
        const images = Array.from({ length: totalImages }, () => ({ src: '', caption: '' }));
        return commands.insertContent({
          type: this.name,
          attrs: {
            rows: options.rows,
            cols: options.cols,
            images,
            width: '50%',
            alignment: 'center',
          },
        });
      },
    } as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomGalleryNodeView);
  },
});
