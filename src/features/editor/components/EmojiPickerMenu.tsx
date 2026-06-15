import React from "react"
import EmojiPicker from "emoji-picker-react"
import type { RefCallback, CSSProperties } from "react"

interface Props {
  menuRef: RefCallback<HTMLDivElement>
  menuStyle: CSSProperties
  onSelect: (char: string) => void
}

export default function EmojiPickerMenu({
  menuRef,
  menuStyle,
  onSelect,
}: Props) {
  return (
    <div
      ref={menuRef}
      data-testid="emoji-menu"
      className="emoji-menu rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden p-1"
      style={menuStyle}
      onMouseDown={(e) => {
        // Stop propagation so clicking inside the picker doesn't trigger click-outside close
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <EmojiPicker
        onEmojiClick={(emojiData) => {
          onSelect(emojiData.emoji)
        }}
        theme={
          document.documentElement.classList.contains("dark")
            ? "dark" as any
            : "light" as any
        }
      />
    </div>
  )
}
