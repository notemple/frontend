import React, { useRef, useEffect, useState } from "react"
import EmojiPicker from "emoji-picker-react"

interface Props {
  position: { top: number; bottom: number; left: number }
  onSelect: (char: string) => void
}

export default function EmojiPickerMenu({
  position,
  onSelect,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: position.bottom + 8, left: position.left })

  useEffect(() => {
    const el = menuRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    // EmojiPicker default height is around 450, width is around 350
    const menuHeight = rect.height || 450
    const menuWidth = rect.width || 350

    // Check space below
    const spaceBelow = window.innerHeight - position.bottom - 16
    let targetTop = position.bottom + 8

    if (spaceBelow < menuHeight && position.top > menuHeight + 16) {
      // Place above the cursor
      targetTop = position.top - menuHeight - 8
    }

    const targetLeft = Math.max(10, Math.min(position.left, window.innerWidth - menuWidth - 16))

    setCoords({ top: targetTop, left: targetLeft })
  }, [position.top, position.bottom, position.left])

  return (
    <div
      ref={menuRef}
      data-testid="emoji-menu"
      className="emoji-menu rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden p-1"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
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
