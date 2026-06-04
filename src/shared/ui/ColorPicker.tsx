import { Check,Plus } from '@phosphor-icons/react';
import React from 'react';
import { TAG_COLOR_PRESETS } from '../constants/colors';

interface ColorPickerProps {
  label?: string;
  currentColor: string;
  onChange: (color: string) => void;
  onClose?: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label = "Color",
  currentColor,
  onChange,
  onClose
}) => {
  return (
    <div className="border-t border-border px-4 py-2.5 flex flex-col gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none leading-none">
        {label}
      </span>
      <div className="grid grid-cols-5 gap-1.5 w-[140px]">
        {TAG_COLOR_PRESETS.map((preset) => {
          const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              onClick={() => {
                onChange(preset.hex);
                if (onClose) onClose();
              }}
              className="w-5 h-5 rounded-sm-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative flex items-center justify-center"
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            >
              {isSelected && (
                <Check size={10} weight="bold" className="text-zinc-950 font-bold" />
              )}
            </button>
          );
        })}
        
        {/* Dynamic Color Picker */}
        <label 
          className="w-5 h-5 rounded-sm-full border border-border/80 hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-400 via-sky-400 to-amber-300 relative shadow-sm-sm"
          title="Custom Color"
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <Plus size={10} className="text-white drop-shadow-sm-sm font-bold" />
        </label>
      </div>
    </div>
  );
};
