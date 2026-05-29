import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const BlockDragKey = new PluginKey('blockDrag');

export const BlockDragExtension = Extension.create({
  name: 'blockDrag',

  addProseMirrorPlugins() {
    let indicator: HTMLDivElement | null = null;
    let dragSourcePos: { from: number; to: number } | null = null;
    let currentDropPos = -1;

    // Helper to get or create insertion guide line
    const getIndicator = (view: any) => {
      if (indicator) return indicator;
      indicator = document.createElement('div');
      indicator.className = 'absolute left-0 right-0 h-0.5 bg-purple-500/80 pointer-events-none z-50 transition-transform duration-75 ease-out shadow-[0_0_8px_rgba(168,85,247,0.4)]';
      // Append to the editor container
      view.dom.parentElement?.appendChild(indicator);
      return indicator;
    };

    const cleanup = (view: any) => {
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
      // Remove all active draggable attributes and classes to prevent stuck states
      const editorEl = view.dom;
      const activeDraggables = editorEl.querySelectorAll('[draggable="true"]');
      activeDraggables.forEach((el: any) => {
        el.removeAttribute('draggable');
        el.classList.remove('prosemirror-dragging-block');
      });
      dragSourcePos = null;
      currentDropPos = -1;
    };

    return [
      new Plugin({
        key: BlockDragKey,
        props: {
          handleDOMEvents: {
            dragstart: (view, event) => {
              // Find parent block elements under view.dom
              const target = event.target as HTMLElement;
              const rect = target.getBoundingClientRect();
              const coords = view.posAtCoords({ left: rect.left + 10, top: rect.top + 10 });
              
              if (coords) {
                const $pos = view.state.doc.resolve(coords.pos);
                const blockStart = $pos.start(1) - 1;
                const blockNode = $pos.node(1);
                const blockEnd = blockStart + blockNode.nodeSize;

                dragSourcePos = { from: blockStart, to: blockEnd };
                event.dataTransfer?.setData('application/notemple-block-drag', JSON.stringify(dragSourcePos));
                target.classList.add('prosemirror-dragging-block');
              }
              return false;
            },

            dragover: (view, event) => {
              if (!dragSourcePos) return false;
              event.preventDefault();

              // Get nearest top-level block node element under coordinates
              const editorEl = view.dom;
              const rect = editorEl.getBoundingClientRect();
              
              // Find top-level children of view.dom closest to mouse coordinate Y
              const children = Array.from(editorEl.children) as HTMLElement[];
              if (children.length === 0) return false;

              let closestEl: HTMLElement | null = null;
              let closestDistance = Infinity;
              let insertPosition: 'above' | 'below' = 'above';

              const mouseY = event.clientY;

              children.forEach(child => {
                if (child.classList.contains('block-handle-container')) return;
                
                const childRect = child.getBoundingClientRect();
                const childMiddleY = childRect.top + childRect.height / 2;
                const distance = Math.abs(mouseY - childMiddleY);
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestEl = child;
                  insertPosition = mouseY < childMiddleY ? 'above' : 'below';
                }
              });

              if (closestEl) {
                const targetRect = (closestEl as HTMLElement).getBoundingClientRect();
                const lineY = insertPosition === 'above' 
                  ? targetRect.top + window.scrollY - 1
                  : targetRect.bottom + window.scrollY + 1;
                
                // Align indicator horizontally with the target block
                const ind = getIndicator(view);
                ind.style.width = `${targetRect.width}px`;
                ind.style.left = `${targetRect.left - rect.left}px`;
                ind.style.transform = `translate3d(0, ${lineY - rect.top - window.scrollY}px, 0)`;

                // Resolve target position in ProseMirror document
                const targetCoords = view.posAtCoords({ 
                  left: targetRect.left + 10, 
                  top: insertPosition === 'above' ? targetRect.top + 4 : targetRect.bottom - 4 
                });
                
                if (targetCoords) {
                  currentDropPos = targetCoords.pos;
                }
              }

              return true;
            },

            dragleave: (view, event) => {
              // Hide indicator if leaving editor container
              if (event.relatedTarget === null || !(event.relatedTarget as HTMLElement).closest('.ProseMirror')) {
                cleanup(view);
              }
              return false;
            },

            drop: (view, event) => {
              if (!dragSourcePos || currentDropPos === -1) {
                cleanup(view);
                return false;
              }
              event.preventDefault();

              const { from, to } = dragSourcePos;
              const slice = view.state.doc.slice(from, to);

              let tr = view.state.tr;
              
              // Standard move calculation: prevent dropping inside itself
              if (currentDropPos >= from && currentDropPos <= to) {
                cleanup(view);
                return true;
              }

              // Adjust drop coordinates depending on whether the target pos is before or after source pos
              if (currentDropPos < from) {
                tr = tr.insert(currentDropPos, slice.content).delete(from + slice.size, to + slice.size);
              } else {
                tr = tr.insert(currentDropPos, slice.content).delete(from, to);
              }

              view.dispatch(tr);
              cleanup(view);
              return true;
            },

            dragend: (view) => {
              cleanup(view);
              return false;
            }
          }
        }
      })
    ];
  }
});
