import React from "react"
import EmojiPicker from "emoji-picker-react"

interface Props {
  position: { top: number; left: number }
  onSelect: (char: string) => void
}

export default function EmojiPickerMenu({
  position,
  onSelect,
}: Props) {
  return (
    <div
      data-testid="emoji-menu"
      className="emoji-menu rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden p-1"
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 370),
        zIndex: 9999,
      }}
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
