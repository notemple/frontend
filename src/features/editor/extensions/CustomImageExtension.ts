import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CustomImageNodeView } from '../components/CustomImageNodeView';

export const CustomImageExtension = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: element => element.getAttribute('data-width') || '100%',
        renderHTML: attributes => ({ 'data-width': attributes.width }),
      },
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => ({ 'data-alignment': attributes.alignment }),
      },
      caption: {
        default: '',
        parseHTML: element => element.getAttribute('data-caption') || '',
        renderHTML: attributes => ({ 'data-caption': attributes.caption }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNodeView);
  },
});
