import { db } from '@/storage/dexie/db';
import { cn } from '@/shared/lib/utils';
import {
	Copy,
	DotsThree,
	Image as ImageIcon,
	Plus,
	TextAlignCenter,
	TextAlignLeft,
	TextAlignRight,
	Trash
} from '@phosphor-icons/react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { NodeViewWrapper } from '@tiptap/react';
import React,{ useEffect,useRef,useState } from 'react';

interface GalleryImage {
  src: string;
  caption?: string;
}

const GalleryItem = ({ 
  image, 
  index, 
  onUpload 
}: { 
  image: GalleryImage; 
  index: number; 
  onUpload: (index: number, src: string) => void;
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image.src && image.src.startsWith('dexie-image://')) {
      const id = image.src.replace('dexie-image://', '');
      db.images.get(id).then(record => {
        if (record) {
          setResolvedSrc(record.data);
        } else {
          setResolvedSrc('');
        }
      }).catch(err => {
        console.error('Failed to load image from Dexie', err);
        setResolvedSrc('');
      });
    } else {
      setResolvedSrc(image.src);
    }
  }, [image.src]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-trigger-upload')) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const imageId = `image-${crypto.randomUUID()}`;
        db.images.put({ id: imageId, data: dataUrl }).then(() => {
          onUpload(index, `dexie-image://${imageId}`);
        }).catch(err => {
          console.error('Failed to store gallery image in Dexie', err);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (e?: React.MouseEvent | Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    onUpload(index, '');
  };

  const itemContent = (
    <div 
      onClick={handleClick}
      className={cn(
        "relative flex items-center justify-center border border-dashed rounded-sm overflow-hidden aspect-video bg-muted/10 border-border/50 hover:bg-muted/20 hover:border-border transition-all cursor-pointer group/item",
        resolvedSrc && "border-solid border-border/30 bg-background/5"
      )}
    >
      {resolvedSrc ? (
        <>
          <img 
            src={resolvedSrc} 
            alt={image.caption || `Gallery item ${index + 1}`}
            className="w-full h-full object-cover block"
          />
          {/* Hover Option Dropdown Trigger button */}
          <div className="opacity-0 group-hover/item:opacity-100 absolute right-2 top-2 transition-all duration-150 shrink-0 z-30 pointer-events-auto no-trigger-upload">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  className="w-5 h-5 rounded bg-background/90 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm cursor-pointer active:scale-95 transition-all"
                  title="Options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DotsThree size={12} weight="bold" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="table-dark-menu z-50 animate-fade-in no-trigger-upload">
                  <DropdownMenu.Item 
                    className="table-dark-menu-item text-red-400 hover:text-red-300"
                    onClick={handleDeleteImage}
                  >
                    <div className="flex items-center gap-2">
                      <Trash size={14} />
                      <span>Delete image</span>
                    </div>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60 group-hover/item:text-muted-foreground transition-colors p-2 text-center">
          <Plus size={20} />
          <span className="text-[11px] font-medium tracking-tight">Upload Image</span>
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );

  if (resolvedSrc) {
    return (
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          {itemContent}
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content className="table-dark-menu z-50 animate-fade-in no-trigger-upload">
            <ContextMenu.Item 
              className="table-dark-menu-item text-red-400 hover:text-red-300"
              onClick={handleDeleteImage}
            >
              <div className="flex items-center gap-2">
                <Trash size={14} />
                <span>Delete image</span>
              </div>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    );
  }

  return itemContent;
};

export const CustomGalleryNodeView = ({ node, updateAttributes, deleteNode, getPos, editor }: any) => {
  const { rows, cols, images, width, alignment } = node.attrs;
  const [hovered, setHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tempWidth, setTempWidth] = useState(width);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDuplicate = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function' && typeof editor.commands.insertContent === 'function') {
      const pos = getPos();
      editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().setNodeSelection(pos).deleteSelection().run();
    } else if (typeof deleteNode === 'function') {
      deleteNode();
    }
  };

  const handleAlignment = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: align });
  };

  const handleResizeWidth = (w: string) => {
    updateAttributes({ width: w });
    setTempWidth(w);
  };

  // Resize drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 500;
    const parentWidth = containerRef.current?.parentElement?.offsetWidth || 800;
    let currentWidth = tempWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidthPx = startWidth;
      if (alignment === 'center') {
        newWidthPx = startWidth + deltaX * 2;
      } else {
        newWidthPx = startWidth + deltaX;
      }
      newWidthPx = Math.max(200, Math.min(parentWidth, newWidthPx));
      const percentage = Math.round((newWidthPx / parentWidth) * 100);
      currentWidth = `${percentage}%`;
      setTempWidth(currentWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateAttributes({ width: currentWidth });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setTempWidth(width);
  }, [width]);

  const handleUploadImage = (index: number, src: string) => {
    const updatedImages = [...images];
    if (!updatedImages[index]) {
      updatedImages[index] = { src: '', caption: '' };
    }
    updatedImages[index] = { ...updatedImages[index], src };
    updateAttributes({ images: updatedImages });
  };

  const alignmentClass = cn(
    "flex w-full my-0 relative group/gallery-wrapper select-none",
    alignment === 'left' && "justify-start",
    alignment === 'center' && "justify-center",
    alignment === 'right' && "justify-end"
  );

  return (
    <NodeViewWrapper className={alignmentClass}>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div 
            ref={containerRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative group transition-all duration-300 rounded-sm bg-transparent"
            style={{ width: isResizing ? tempWidth : width, maxWidth: '100%' }}
          >
            {/* Grid Container */}
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: rows * cols }).map((_, index) => {
                const img = images[index] || { src: '', caption: '' };
                return (
                  <GalleryItem 
                    key={index} 
                    image={img} 
                    index={index} 
                    onUpload={handleUploadImage}
                  />
                );
              })}
            </div>

            {/* Hover Option Dropdown Trigger button */}
            <div className="opacity-0 group-hover:opacity-100 absolute right-3 top-3 transition-all duration-150 shrink-0 z-30 pointer-events-auto">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    className="w-6 h-6 rounded bg-background/90 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm cursor-pointer active:scale-95 transition-all"
                    title="Options"
                  >
                    <DotsThree size={14} weight="bold" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="table-dark-menu z-50 animate-fade-in">
                    <DropdownMenu.Item 
                      className="table-dark-menu-item"
                      onClick={handleDuplicate}
                    >
                      <div className="flex items-center gap-2">
                        <Copy size={14} />
                        <span>Duplicate gallery</span>
                      </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="table-dark-menu-separator" />
                    <DropdownMenu.Item 
                      className="table-dark-menu-item text-red-400 hover:text-red-300"
                      onClick={handleDelete}
                    >
                      <div className="flex items-center gap-2">
                        <Trash size={14} />
                        <span>Delete gallery</span>
                      </div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Floating Alignment & Option Overlay Menu on Hover */}
            {(hovered || isResizing) && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 bg-background/95 border border-border shadow-sm-sm rounded-sm-sm p-1.5 flex items-center gap-1 z-35 backdrop-blur-sm animate-fade-in font-sans">
                <button 
                  onClick={() => handleAlignment('left')}
                  className={cn("p-1 rounded-sm transition-colors cursor-pointer", alignment === 'left' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                  title="Align Left"
                >
                  <TextAlignLeft size={14} />
                </button>
                <button 
                  onClick={() => handleAlignment('center')}
                  className={cn("p-1 rounded-sm transition-colors cursor-pointer", alignment === 'center' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                  title="Align Center"
                >
                  <TextAlignCenter size={14} />
                </button>
                <button 
                  onClick={() => handleAlignment('right')}
                  className={cn("p-1 rounded-sm transition-colors cursor-pointer", alignment === 'right' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                  title="Align Right"
                >
                  <TextAlignRight size={14} />
                </button>
                
                <div className="w-px h-3.5 bg-border mx-1" />
                
                {/* Quick Size Presets */}
                <button 
                  onClick={() => handleResizeWidth('25%')}
                  className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition-colors cursor-pointer", width === '25%' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                >
                  25%
                </button>
                <button 
                  onClick={() => handleResizeWidth('50%')}
                  className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition-colors cursor-pointer", width === '50%' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                >
                  50%
                </button>
                <button 
                  onClick={() => handleResizeWidth('75%')}
                  className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition-colors cursor-pointer", width === '75%' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                >
                  75%
                </button>
                <button 
                  onClick={() => handleResizeWidth('100%')}
                  className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded-sm transition-colors cursor-pointer", width === '100%' ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/80")}
                >
                  100%
                </button>

                <div className="w-px h-3.5 bg-border mx-1" />

                <button 
                  onClick={handleDelete}
                  className="p-1 rounded-sm text-red-500 hover:bg-red-500/10 cursor-pointer"
                  title="Delete Gallery"
                >
                  <Trash size={14} />
                </button>
              </div>
            )}

            {/* Drag handles for resizing */}
            {hovered && (
              <>
                {/* Right Edge Resize Handle */}
                <div 
                  onMouseDown={handleMouseDown}
                  className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-border/20 hover:bg-blue-500/60 active:bg-blue-600 transition-all flex items-center justify-center group/handle select-none z-30"
                  title="Drag to resize"
                >
                  <div className="w-0.5 h-6 bg-foreground/20 group-hover/handle:bg-white rounded-full" />
                </div>

                {/* Corner Resize Handle */}
                <div 
                  onMouseDown={handleMouseDown}
                  className="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize bg-background/90 hover:bg-blue-500 hover:text-white border border-border hover:border-blue-600 rounded-sm flex items-center justify-center shadow-sm transition-all active:scale-95 z-30 select-none"
                  title="Drag corner to resize"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-muted-foreground group-hover:text-white">
                    <path d="M6 0L8 0L8 8L0 8L0 6L4.5 6L0.5 2L2 0.5L6 4.5L6 0Z" fill="currentColor"/>
                  </svg>
                </div>
              </>
            )}
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="table-dark-menu z-50 animate-fade-in">
            <ContextMenu.Item 
              className="table-dark-menu-item"
              onClick={handleDuplicate}
            >
              <div className="flex items-center gap-2">
                <Copy size={14} />
                <span>Duplicate block</span>
              </div>
            </ContextMenu.Item>
            <ContextMenu.Separator className="table-dark-menu-separator" />
            <ContextMenu.Item 
              className="table-dark-menu-item text-red-400 hover:text-red-300"
              onClick={handleDelete}
            >
              <div className="flex items-center gap-2">
                <Trash size={14} />
                <span>Delete block</span>
              </div>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </NodeViewWrapper>
  );
};
