import * as Icons from "@phosphor-icons/react"
import { useRef, useEffect } from "react"
import type { SlashCommand } from "../plugins/slashCommandList"
import type { RefCallback, CSSProperties } from "react"

interface Props {
  commands: SlashCommand[]
  selectedIdx: number
  currentQuery: string
  menuRef: RefCallback<HTMLDivElement>
  menuStyle: CSSProperties
  onSelect: (cmd: SlashCommand) => void
  onHover: (idx: number) => void
  onClose: () => void
  menuMode?: "main" | "callout" | "equation"
  submenuCommands?: SlashCommand[]
  submenuSelectedIdx?: number
  onSubmenuHover?: (idx: number) => void
  onBack?: () => void
}

export const CATEGORY_ORDER = ["Basic", "Lists", "Layout", "Media", "Advanced"]

export default function SlashCommandMenu({
  commands,
  selectedIdx,
  currentQuery,
  menuRef,
  menuStyle,
  onSelect,
  onHover,
  onClose,
  menuMode = "main",
  submenuCommands = [],
  submenuSelectedIdx = 0,
  onSubmenuHover,
  onBack,
}: Props) {
  const selectedRef = useRef<HTMLButtonElement>(null)
  const submenuSelectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedIdx])

  useEffect(() => {
    submenuSelectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [submenuSelectedIdx])

  const grouped = CATEGORY_ORDER.reduce<Record<string, SlashCommand[]>>(
    (acc, cat) => {
      const items = commands.filter((c) => c.category === cat)
      if (items.length > 0) acc[cat] = items
      return acc
    },
    {}
  )

  const renderCommandItem = (
    cmd: SlashCommand,
    idx: number,
    isSelected: boolean,
    onMouseEnter: () => void,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; weight?: string }>>)[cmd.icon]

    return (
      <button
        key={cmd.title}
        ref={ref}
        className={`
          w-[calc(100%-8px)] h-9 flex items-center gap-2.5
          px-2.5 mx-1 rounded-md text-left
          text-sm transition-colors duration-75
          ${isSelected
            ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe]"
            : "text-[var(--foreground)] hover:bg-[var(--muted)]"
          }
        `}
        onMouseEnter={onMouseEnter}
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
  }

  const renderMainPanel = (isSubmenuActive: boolean) => {
    let globalIdx = 0

    return (
      <div className={`slash-command-menu-panel${isSubmenuActive ? " slash-command-menu-panel-readonly" : ""}`}>
        <div className="slash-command-menu-panel-header">
          Commands
        </div>
        <div className="overflow-y-auto max-h-[320px] py-1">
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
                  const isSelected = !isSubmenuActive && idx === selectedIdx
                  const isParentHighlighted = isSubmenuActive && idx === selectedIdx

                  return (
                    <div key={cmd.title} style={{ position: "relative" }}>
                      {renderCommandItem(
                        cmd,
                        idx,
                        isSelected || isParentHighlighted,
                        () => onHover(idx),
                        !isSubmenuActive && isSelected ? selectedRef : undefined
                      )}
                      {isParentHighlighted && (
                        <span className="slash-command-menu-active-indicator" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderSubmenuPanel = () => {
    const title = menuMode === "callout" ? "Callout" : "Math Equation"

    return (
      <div className="slash-command-menu-panel slash-command-menu-panel-submenu">
        <div className="slash-command-menu-panel-header">
          <button
            className="slash-command-menu-back-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onBack?.()
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Icons.ArrowLeft size={12} />
          </button>
          {title}
        </div>
        <div className="overflow-y-auto max-h-[320px] py-1">
          {submenuCommands.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[var(--muted-foreground)] opacity-50">
                No results
              </p>
            </div>
          ) : (
            submenuCommands.map((cmd, idx) => {
              return renderCommandItem(
                cmd,
                idx,
                idx === submenuSelectedIdx,
                () => onSubmenuHover?.(idx),
                idx === submenuSelectedIdx ? submenuSelectedRef : undefined
              )
            })
          )}
        </div>
      </div>
    )
  }

  const isSplit = menuMode !== "main"

  return (
    <div
      ref={menuRef}
      data-testid="slash-menu"
      className={`slash-command-menu ${isSplit ? "slash-command-menu-split" : "w-[260px]"} rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
      style={menuStyle}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {isSplit ? (
        <>
          {renderMainPanel(true)}
          {renderSubmenuPanel()}
        </>
      ) : (
        <>
          {/* Query display header */}
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

          {renderMainPanel(false)}

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--muted-foreground)] opacity-40">
              ↑↓ navigate · ↵ select · esc close
            </span>
          </div>
        </>
      )}
    </div>
  )
}
