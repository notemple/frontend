import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  TextAlignLeft, 
  TextAlignCenter, 
  TextAlignRight, 
  Trash,
  ArrowsOutCardinal,
  FrameCorners
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils';

export const CustomImageNodeView = ({ node, updateAttributes, deleteNode }: any) => {
  const { src, alt, width, alignment, caption } = node.attrs;
  const [hovered, setHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tempWidth, setTempWidth] = useState(width);
  const containerRef = useRef<HTMLDivElement>(null);

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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Depending on drag direction, we calculate new width percentage
      const newWidthPx = Math.max(100, Math.min(parentWidth, startWidth + deltaX * 2));
      const percentage = Math.round((newWidthPx / parentWidth) * 100);
      setTempWidth(`${percentage}%`);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateAttributes({ width: tempWidth });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setTempWidth(width);
  }, [width]);

  // Determine wrapper alignments
  const alignmentClass = cn(
    "flex w-full my-6 relative group/img select-none",
    alignment === 'left' && "justify-start",
    alignment === 'center' && "justify-center",
    alignment === 'right' && "justify-end"
  );

  return (
    <NodeViewWrapper className={alignmentClass}>
      <div 
        ref={containerRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative group transition-all duration-300 rounded-sm overflow-hidden border border-border/30 bg-muted/20"
        style={{ width: isResizing ? tempWidth : width, maxWidth: '100%' }}
      >
        <img 
          src={src} 
          alt={alt || 'Note Image'} 
          className="w-full h-auto object-cover block rounded-sm shadow-sm-sm max-h-[70vh]" 
          loading="lazy" 
        />

        {/* Floating Alignment & Option Overlay Menu on Hover */}
        {(hovered || isResizing) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/95 border border-border shadow-sm-sm rounded-sm-sm p-1.5 flex items-center gap-1 z-35 backdrop-blur-sm animate-fade-in font-sans">
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
              onClick={() => deleteNode()}
              className="p-1 rounded-sm text-red-500 hover:bg-red-500/10 cursor-pointer"
              title="Delete Image"
            >
              <Trash size={14} />
            </button>
          </div>
        )}

        {/* Drag handles for resizing */}
        {hovered && (
          <div 
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-border/20 hover:bg-blue-500/60 active:bg-blue-600 transition-all flex items-center justify-center group/handle select-none"
            title="Drag to resize"
          >
            <div className="w-0.5 h-6 bg-foreground/20 group-hover/handle:bg-white rounded-full" />
          </div>
        )}

        {/* Caption Field */}
        <div className="p-2.5 box-border border-t border-border/20 bg-background/50 hover:bg-background/80 transition-colors font-sans">
          <input 
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            className="w-full bg-transparent outline-none border-none text-[11px] text-center text-muted-foreground/80 placeholder:text-muted-foreground/30 font-medium"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};
