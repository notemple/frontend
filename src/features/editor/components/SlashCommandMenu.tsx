import * as Icons from "@phosphor-icons/react"
import { useRef, useEffect } from "react"
import type { SlashCommand } from "../plugins/slashCommandList"

interface Props {
  commands: SlashCommand[]
  selectedIdx: number
  position: { top: number; left: number }
  onSelect: (cmd: SlashCommand) => void
  onHover: (idx: number) => void
  onClose: () => void
}

const CATEGORY_ORDER = ["Basic", "Lists", "Layout", "Media", "Advanced"]

export default function SlashCommandMenu({
  commands,
  selectedIdx,
  position,
  onSelect,
  onHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const buttons = containerRef.current.querySelectorAll("button")
    const selectedButton = buttons[selectedIdx]
    if (selectedButton) {
      selectedButton.scrollIntoView({
        block: "nearest",
      })
    }
  }, [selectedIdx])

  const grouped = CATEGORY_ORDER.reduce<Record<string, SlashCommand[]>>(
    (acc, cat) => {
      const items = commands.filter((c) => c.category === cat)
      if (items.length > 0) acc[cat] = items
      return acc
    },
    {}
  )

  let globalIdx = 0

  return (
    <div
      ref={containerRef}
      data-testid="slash-menu"
      className="slash-command-menu w-[260px] max-h-[380px] overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(
          position.left,
          window.innerWidth - 280  // prevent overflow off right edge
        ),
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {Object.entries(grouped).map(([category, items], catIdx) => (
        <div key={category}>
          <div
            className="
              font-semibold uppercase select-none
              text-[10px] tracking-[0.08em] text-[var(--muted-foreground)] opacity-50
              px-3 pb-1
            "
            style={{ paddingTop: catIdx === 0 ? 4 : 8 }}
          >
            {category}
          </div>
          {items.map((cmd) => {
            const idx = globalIdx++
            const isSelected = idx === selectedIdx
            const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; weight?: string }>>)[cmd.icon]

            return (
              <button
                key={cmd.title}
                className={`
                  w-[calc(100%-8px)] h-9 flex items-center gap-2.5
                  px-2.5 mx-1 rounded-md text-left
                  text-sm transition-colors duration-75
                  ${
                    isSelected
                      ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }
                `}
                onMouseEnter={() => onHover(idx)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect(cmd)
                }}
              >
                <span
                  className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(168, 85, 247, 0.15)"
                      : "var(--muted)",
                  }}
                >
                  {IconComponent ? (
                    <IconComponent size={14} weight="duotone" />
                  ) : (
                    <span className="text-xs">/</span>
                  )}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-medium leading-tight truncate">{cmd.title}</span>
                  <span className="text-[11px] text-[var(--muted-foreground)] opacity-70 leading-tight truncate">
                    {cmd.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
