import * as Icons from "@phosphor-icons/react"
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
      data-testid="slash-menu"
      className="
        fixed z-[9999] w-64 max-h-[420px] overflow-y-auto
        bg-[var(--card-bg)] border border-[var(--card-border)]
        rounded-lg shadow-xl
        py-1
      "
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="
            px-3 pt-2 pb-1
            text-[10px] font-semibold uppercase tracking-wider
            text-[var(--muted-foreground)] opacity-60
            select-none
          ">
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
                  w-full flex items-center gap-2.5
                  px-3 py-1.5 text-left
                  text-sm text-[var(--foreground)]
                  transition-colors duration-75
                  ${isSelected ? "bg-purple-500/15 text-purple-300" : "hover:bg-[var(--muted)]"}
                `}
                onMouseEnter={() => onHover(idx)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(cmd)
                }}
              >
                <span
                  className={`
                    flex-shrink-0 w-7 h-7 flex items-center justify-center
                    rounded bg-[var(--muted)] text-[var(--muted-foreground)]
                    ${isSelected ? "bg-purple-500/20 text-purple-400" : ""}
                  `}
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
