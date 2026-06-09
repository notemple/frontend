import React, { useRef, useEffect } from "react"

interface EmojiItem {
  char: string
  name: string
  category: string
  keywords: string[]
}

interface Props {
  selectedIdx: number
  position: { top: number; left: number }
  emojis: EmojiItem[]
  onSelect: (char: string) => void
  onHover: (idx: number) => void
}

export default function EmojiPickerMenu({
  selectedIdx,
  position,
  emojis,
  onSelect,
  onHover,
}: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Scroll active item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedIdx])

  return (
    <div
      data-testid="emoji-menu"
      className="emoji-menu w-[240px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 260),
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Menu Header */}
      <div className="px-3 pt-2 pb-1.5 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
          Emojis
        </span>
      </div>

      {/* Main List */}
      <div className="overflow-y-auto max-h-[240px] py-1 flex flex-col gap-0.5">
        {emojis.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-[var(--muted-foreground)] opacity-50">No emojis found</p>
          </div>
        ) : (
          emojis.map((emoji, idx) => {
            const isSelected = idx === selectedIdx

            return (
              <button
                key={`${emoji.name}-${idx}`}
                ref={isSelected ? selectedRef : null}
                className={`
                  w-[calc(100%-8px)] h-9 flex items-center gap-2.5
                  px-2.5 mx-1 rounded-md text-left transition-colors duration-75
                  ${isSelected
                    ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe]"
                    : "text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:bg-zinc-800/40"
                  }
                `}
                onMouseEnter={() => onHover(idx)}
                onClick={() => onSelect(emoji.char)}
              >
                {/* Emoji Character */}
                <span className="text-lg leading-none select-none font-sans w-6 h-6 flex items-center justify-center">
                  {emoji.char}
                </span>

                {/* Text block */}
                <span className="flex flex-col min-w-0 flex-1 leading-none">
                  <span className="font-medium text-xs text-zinc-100 leading-tight truncate">
                    :{emoji.name}:
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
