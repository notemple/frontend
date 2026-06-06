import * as Icons from "@phosphor-icons/react"
import { useRef, useEffect } from "react"
import type { SlashCommand } from "../plugins/slashCommandList"

interface Props {
  commands: SlashCommand[]
  selectedIdx: number
  position: { top: number; left: number }
  currentQuery: string
  onSelect: (cmd: SlashCommand) => void
  onHover: (idx: number) => void
  onClose: () => void
}

const CATEGORY_ORDER = ["Basic", "Lists", "Layout", "Media", "Advanced"]

export default function SlashCommandMenu({
  commands,
  selectedIdx,
  position,
  currentQuery,
  onSelect,
  onHover,
}: Props) {
  // FIX 4: use a ref on the selected button directly
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
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
      data-testid="slash-menu"
      className="slash-command-menu w-[260px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(
          position.left,
          window.innerWidth - 280 // prevent overflow off right edge
        ),
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* FIX 6: Query display header */}
      <div className="px-3 pt-2 pb-1.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="opacity-50">Filter:</span>
          {currentQuery ? (
            <span className="text-[var(--foreground)] font-medium">{currentQuery}</span>
          ) : (
            <span className="opacity-30 italic">type to search…</span>
          )}
        </div>
      </div>

      {/* Command list */}
      <div className="overflow-y-auto max-h-[320px] py-1">
        {/* FIX 6: Empty state when no results */}
        {Object.keys(grouped).length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)] opacity-50">
              No results for &ldquo;{currentQuery}&rdquo;
            </p>
            <p className="text-xs text-[var(--muted-foreground)] opacity-30 mt-1">
              Try a different keyword
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items], catIdx) => (
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
                    // FIX 4: attach ref to the currently-selected button
                    ref={isSelected ? selectedRef : null}
                    className={`
                      w-[calc(100%-8px)] h-9 flex items-center gap-2.5
                      px-2.5 mx-1 rounded-md text-left
                      text-sm transition-colors duration-75
                      ${isSelected
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
          ))
        )}
      </div>

      {/* FIX 6: Footer hint */}
      <div className="px-3 py-1.5 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--muted-foreground)] opacity-40">
          ↑↓ navigate · ↵ select · esc close
        </span>
      </div>
    </div>
  )
}
