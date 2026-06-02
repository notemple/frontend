import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const BlockDragKey = new PluginKey('blockDrag');

export const BlockDragExtension = Extension.create({
  name: 'blockDrag',

  addProseMirrorPlugins() {
    let indicator: HTMLDivElement | null = null;
    let dragSourcePos: { from: number; to: number } | null = null;
    let currentDropPos = -1;
    let dragPlacement: { targetPos: number; side: 'above' | 'below' | 'left' | 'right' } | null = null;

    // Helper to get or create insertion guide line
    const getIndicator = (view: any) => {
      if (indicator) return indicator;
      indicator = document.createElement('div');
      indicator.className = 'absolute bg-purple-500/80 pointer-events-none z-50 transition-[transform,width,height] duration-75 ease-out shadow-[0_0_8px_rgba(168,85,247,0.4)]';
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
      dragPlacement = null;
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
                event.dataTransfer?.setData('application/templnote-block-drag', JSON.stringify(dragSourcePos));
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
              let insertPosition: any = 'above';

              const mouseY = event.clientY;
              const mouseX = event.clientX;

              children.forEach(child => {
                if (
                  child.classList.contains('block-handle-container') ||
                  child.classList.contains('column-resize-handle')
                ) return;
                
                const childRect = child.getBoundingClientRect();
                const childMiddleY = childRect.top + childRect.height / 2;
                const distance = Math.abs(mouseY - childMiddleY);
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestEl = child;
                  
                  // Check if mouse is near the left or right 25% boundary of this block for horizontal splitting
                  const boundaryWidth = childRect.width * 0.25;
                  if (mouseX < childRect.left + boundaryWidth) {
                    insertPosition = 'left';
                  } else if (mouseX > childRect.right - boundaryWidth) {
                    insertPosition = 'right';
                  } else {
                    insertPosition = mouseY < childMiddleY ? 'above' : 'below';
                  }
                }
              });

              if (closestEl) {
                const targetRect = (closestEl as HTMLElement).getBoundingClientRect();
                const ind = getIndicator(view);
                
                if (insertPosition === 'left' || insertPosition === 'right') {
                  // Draw a vertical guide line next to the target block
                  const lineX = insertPosition === 'left'
                    ? targetRect.left - rect.left - 1
                    : targetRect.right - rect.left + 1;
                  
                  ind.style.width = '3px';
                  ind.style.height = `${targetRect.height}px`;
                  ind.style.transform = `translate3d(${lineX}px, ${targetRect.top - rect.top}px, 0)`;
                } else {
                  // Draw a standard horizontal guide line above or below the target block
                  const lineY = insertPosition === 'above' 
                    ? targetRect.top - rect.top - 1
                    : targetRect.bottom - rect.top + 1;
                  
                  ind.style.width = `${targetRect.width}px`;
                  ind.style.height = '2px';
                  ind.style.transform = `translate3d(${targetRect.left - rect.left}px, ${lineY}px, 0)`;
                }

                // Resolve target position in ProseMirror document
                let targetCoords;
                if (insertPosition === 'left') {
                  targetCoords = view.posAtCoords({ left: targetRect.left + 5, top: targetRect.top + 5 });
                } else if (insertPosition === 'right') {
                  targetCoords = view.posAtCoords({ left: targetRect.right - 5, top: targetRect.top + 5 });
                } else {
                  targetCoords = view.posAtCoords({ 
                    left: targetRect.left + 10, 
                    top: insertPosition === 'above' ? targetRect.top + 4 : targetRect.bottom - 4 
                  });
                }
                
                if (targetCoords) {
                  currentDropPos = targetCoords.pos;
                  dragPlacement = {
                    targetPos: targetCoords.pos,
                    side: insertPosition,
                  };
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
              if (!dragSourcePos || !dragPlacement || currentDropPos === -1) {
                cleanup(view);
                return false;
              }
              event.preventDefault();

              const { from, to } = dragSourcePos;
              const { targetPos, side } = dragPlacement;

              // Prevent dropping a node inside itself
              if (targetPos >= from && targetPos <= to) {
                cleanup(view);
                return true;
              }

              let tr = view.state.tr;
              
              // Get the source slice content
              const sourceSlice = view.state.doc.slice(from, to);
              if (!sourceSlice.content.firstChild) {
                cleanup(view);
                return false;
              }
              
              const sourceNode = sourceSlice.content.firstChild;

              if (side === 'above' || side === 'below') {
                let dropPos = targetPos;
                if (dropPos < from) {
                  tr = tr.insert(dropPos, sourceSlice.content).delete(from + sourceSlice.size, to + sourceSlice.size);
                } else {
                  tr = tr.insert(dropPos, sourceSlice.content).delete(from, to);
                }
                view.dispatch(tr);
                cleanup(view);
                return true;
              }

              // Dragging beside a block to create columns or insert into columns!
              const $target = view.state.tr.doc.resolve(targetPos);
              
              // Find if target node is inside columns
              let targetColumnDepth = -1;
              let targetColumnsDepth = -1;
              for (let d = $target.depth; d > 0; d--) {
                if ($target.node(d).type.name === 'column') {
                  targetColumnDepth = d;
                }
                if ($target.node(d).type.name === 'columns') {
                  targetColumnsDepth = d;
                }
              }

              if (targetColumnDepth === -1) {
                // CASE 1: Split a regular block into 2 columns
                const $targetBlockPos = view.state.doc.resolve(targetPos);
                const targetBlockStart = $targetBlockPos.start(1) - 1;
                const targetBlockNode = $targetBlockPos.node(1);
                const targetBlockEnd = targetBlockStart + targetBlockNode.nodeSize;

                // Make sure target block pos doesn't intersect with source pos
                if (targetBlockStart >= from && targetBlockStart <= to) {
                  cleanup(view);
                  return true;
                }

                // If target block is already a Columns Node, drop as a child rather than wrapping
                if (targetBlockNode.type.name === 'columns') {
                  const firstColNode = targetBlockNode.firstChild;
                  if (firstColNode) {
                    const newColNode = view.state.schema.nodes.column.create(null, sourceNode);
                    const insertPos = side === 'left' ? targetBlockStart + 1 : targetBlockEnd - 1;
                    if (insertPos < from) {
                      tr = tr.insert(insertPos, newColNode).delete(from + newColNode.nodeSize, to + newColNode.nodeSize);
                    } else {
                      tr = tr.delete(from, to).insert(insertPos - sourceSlice.size, newColNode);
                    }
                    view.dispatch(tr);
                    cleanup(view);
                    return true;
                  }
                }

                const colNode1 = view.state.schema.nodes.column.create(null, targetBlockNode);
                const colNode2 = view.state.schema.nodes.column.create(null, sourceNode);
                
                let columnsNode;
                if (side === 'left') {
                  columnsNode = view.state.schema.nodes.columns.create(null, [colNode2, colNode1]);
                } else {
                  columnsNode = view.state.schema.nodes.columns.create(null, [colNode1, colNode2]);
                }

                if (targetBlockStart < from) {
                  tr = tr.replaceWith(targetBlockStart, targetBlockEnd, columnsNode)
                         .delete(from + (columnsNode.nodeSize - targetBlockNode.nodeSize), to + (columnsNode.nodeSize - targetBlockNode.nodeSize));
                } else {
                  tr = tr.delete(from, to)
                         .replaceWith(targetBlockStart - sourceSlice.size, targetBlockEnd - sourceSlice.size, columnsNode);
                }
                
                view.dispatch(tr);
                cleanup(view);
                return true;
              } else {
                // CASE 2: Add a column to an existing columns list
                const targetColumnNode = $target.node(targetColumnDepth);
                const targetColumnStart = $target.before(targetColumnDepth);
                const targetColumnEnd = targetColumnStart + targetColumnNode.nodeSize;

                const newColNode = view.state.schema.nodes.column.create(null, sourceNode);

                let insertPos;
                if (side === 'left') {
                  insertPos = targetColumnStart;
                } else {
                  insertPos = targetColumnEnd;
                }

                if (insertPos < from) {
                  tr = tr.insert(insertPos, newColNode)
                         .delete(from + newColNode.nodeSize, to + newColNode.nodeSize);
                } else {
                  tr = tr.delete(from, to)
                         .insert(insertPos - sourceSlice.size, newColNode);
                }

                view.dispatch(tr);
                cleanup(view);
                return true;
              }
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
