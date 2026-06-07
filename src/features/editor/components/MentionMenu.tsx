import React, { useState, useEffect, useRef } from "react"
import * as Icons from "@phosphor-icons/react"
import { useDocumentStore } from "@/features/documents/store"
import { useTaskStore } from "@/features/tasks/store"
import { format, addDays, subDays } from "date-fns"

interface Props {
  selectedIdx: number
  position: { top: number; left: number }
  currentQuery: string
  onSelect: (payload: { type: "doc" | "task" | "date"; id: string; title: string }) => void
  onHover: (idx: number) => void
  onClose: () => void
  onItemsChange?: (itemsCount: number) => void
}

type MenuState =
  | { type: "main" }
  | { type: "tasks" }
  | { type: "date" }
  | { type: "folders" }
  | { type: "folder-docs"; folderId: string; folderName: string }
  | { type: "uncategorized" }

type RenderableItem =
  | { type: "category"; id: "tasks" | "date" | "folders" | "uncategorized"; title: string; icon: string }
  | { type: "back"; target: "main" | "folders"; label: string }
  | { type: "task"; task: any }
  | { type: "doc"; doc: any }
  | { type: "folder"; folder: any }
  | { type: "date"; dateStr: string; label: string }

export default function MentionMenu({
  selectedIdx,
  position,
  currentQuery,
  onSelect,
  onHover,
  onItemsChange,
}: Props) {
  const [menuState, setMenuState] = useState<MenuState>({ type: "main" })
  const selectedRef = useRef<HTMLButtonElement>(null)

  const documentsDict = useDocumentStore((state) => state.documents)
  const folders = useDocumentStore((state) => state.folders)
  const tasks = useTaskStore((state) => state.tasks)

  const activeTasks = tasks.filter((t) => !t.isDeleted && t.status !== "done")
  const activeDocs = Object.values(documentsDict).filter((d) => !d.isDeleted && d.type !== "daily-note")

  // Generate Date list
  const today = new Date()
  const dateOptions = [
    { label: "Today", dateStr: format(today, "yyyy-MM-dd") },
    { label: "Tomorrow", dateStr: format(addDays(today, 1), "yyyy-MM-dd") },
    { label: "Yesterday", dateStr: format(subDays(today, 1), "yyyy-MM-dd") },
  ]
  // Add next 3 days
  for (let i = 2; i <= 4; i++) {
    const nextDay = addDays(today, i)
    dateOptions.push({
      label: format(nextDay, "EEEE, MMM d"),
      dateStr: format(nextDay, "yyyy-MM-dd"),
    })
  }

  // Build the list of items based on state and query
  const getRenderableItems = (): RenderableItem[] => {
    const q = currentQuery.trim().toLowerCase()

    // 1. If we are on the main menu and there is a query, do a flat search!
    if (menuState.type === "main" && q.length > 0) {
      const results: RenderableItem[] = []

      // Search tasks
      activeTasks
        .filter((t) => t.title.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((task) => results.push({ type: "task", task }))

      // Search documents
      activeDocs
        .filter((d) => d.title.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((doc) => results.push({ type: "doc", doc }))

      // Search folders
      folders
        .filter((f) => !f.isDeleted && f.name.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((folder) => results.push({ type: "folder", folder }))

      // Search dates
      dateOptions
        .filter((d) => d.label.toLowerCase().includes(q) || d.dateStr.includes(q))
        .forEach((d) => results.push({ type: "date", dateStr: d.dateStr, label: d.label }))

      return results
    }

    // 2. Normal structured layout
    switch (menuState.type) {
      case "main":
        return [
          { type: "category", id: "tasks", title: "Tasks", icon: "CheckSquare" },
          { type: "category", id: "date", title: "Date", icon: "CalendarBlank" },
          { type: "category", id: "folders", title: "Folders", icon: "Folder" },
          { type: "category", id: "uncategorized", title: "Uncategorized Docs", icon: "FileText" },
        ]

      case "tasks": {
        const items: RenderableItem[] = [{ type: "back", target: "main", label: "Back to menu" }]
        const filtered = q ? activeTasks.filter((t) => t.title.toLowerCase().includes(q)) : activeTasks
        filtered.forEach((task) => items.push({ type: "task", task }))
        return items
      }

      case "date": {
        const items: RenderableItem[] = [{ type: "back", target: "main", label: "Back to menu" }]
        const filtered = q
          ? dateOptions.filter((d) => d.label.toLowerCase().includes(q) || d.dateStr.includes(q))
          : dateOptions
        filtered.forEach((d) => items.push({ type: "date", dateStr: d.dateStr, label: d.label }))
        return items
      }

      case "folders": {
        const items: RenderableItem[] = [{ type: "back", target: "main", label: "Back to menu" }]
        const activeFolders = folders.filter((f) => !f.isDeleted)
        const filtered = q ? activeFolders.filter((f) => f.name.toLowerCase().includes(q)) : activeFolders
        filtered.forEach((folder) => items.push({ type: "folder", folder }))
        return items
      }

      case "folder-docs": {
        const folderId = menuState.folderId
        const items: RenderableItem[] = [{ type: "back", target: "folders", label: `Back to Folders` }]
        const docsInFolder = activeDocs.filter((d) => d.folderId === folderId)
        const filtered = q ? docsInFolder.filter((d) => d.title.toLowerCase().includes(q)) : docsInFolder
        filtered.forEach((doc) => items.push({ type: "doc", doc }))
        return items
      }

      case "uncategorized": {
        const items: RenderableItem[] = [{ type: "back", target: "main", label: "Back to menu" }]
        const uncategorizedDocs = activeDocs.filter((d) => !d.folderId)
        const filtered = q ? uncategorizedDocs.filter((d) => d.title.toLowerCase().includes(q)) : uncategorizedDocs
        filtered.forEach((doc) => items.push({ type: "doc", doc }))
        return items
      }
    }
  }

  const items = getRenderableItems()

  // Notify parent of total items count so keyboard navigation can bound itself correctly
  useEffect(() => {
    onItemsChange?.(items.length)
  }, [items.length, onItemsChange])

  // Scroll active item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedIdx])

  const handleItemSelect = (item: RenderableItem) => {
    if (item.type === "category") {
      setMenuState({ type: item.id })
      onHover(0) // Reset highlight to top
    } else if (item.type === "back") {
      setMenuState({ type: item.target })
      onHover(0)
    } else if (item.type === "folder") {
      setMenuState({ type: "folder-docs", folderId: item.folder.id, folderName: item.folder.name })
      onHover(0)
    } else if (item.type === "doc") {
      onSelect({ type: "doc", id: item.doc.id, title: item.doc.title })
    } else if (item.type === "task") {
      onSelect({ type: "task", id: item.task.id, title: item.task.title })
    } else if (item.type === "date") {
      onSelect({ type: "date", id: `daily-note-${item.dateStr}`, title: item.label })
    }
  }

  // Expose menu transition handle to parent so it can navigate back on ArrowLeft/Escape or select via keyboard
  // We trigger this using standard props if they press key in the parent plugin
  const parentKeyHandlerRef = useRef<((e: KeyboardEvent) => boolean) | undefined>(undefined)
  parentKeyHandlerRef.current = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" && items[selectedIdx]?.type === "category") {
      handleItemSelect(items[selectedIdx])
      return true
    }
    if ((e.key === "ArrowLeft" || e.key === "Backspace") && menuState.type !== "main") {
      const target = menuState.type === "folder-docs" ? "folders" : "main"
      setMenuState({ type: target as any })
      onHover(0)
      return true
    }
    if (e.key === "Enter" && items[selectedIdx]) {
      handleItemSelect(items[selectedIdx])
      return true
    }
    return false
  }

  // Hook this ref up globally or trigger via callback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Enter" ||
        e.key === "Backspace"
      ) {
        const handled = parentKeyHandlerRef.current?.(e)
        if (handled) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [items, selectedIdx, menuState])

  const renderIcon = (item: RenderableItem) => {
    switch (item.type) {
      case "category": {
        const Icon = (Icons as any)[item.icon] || Icons.FileText
        return <Icon size={14} weight="duotone" />
      }
      case "back":
        return <Icons.ArrowLeft size={14} />
      case "task":
        return <Icons.CheckSquare size={14} className="text-purple-400" />
      case "folder":
        return <Icons.Folder size={14} className="text-amber-400" />
      case "doc":
        return <Icons.FileText size={14} className="text-teal-400" />
      case "date":
        return <Icons.CalendarBlank size={14} className="text-sky-400" />
    }
  }

  return (
    <div
      id="onboarding-mention-list"
      data-testid="mention-menu"
      className="mention-menu w-[280px] rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
      style={{
        position: "fixed",
        top: position.top,
        left: Math.min(position.left, window.innerWidth - 300),
        zIndex: 9999,
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Menu Header with navigation breadcrumb */}
      <div className="px-3 pt-2 pb-1.5 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-medium">
          <span className="opacity-40">Mentions</span>
          <span className="opacity-30">/</span>
          <span className="text-[var(--foreground)] opacity-90 font-semibold uppercase tracking-wider text-[10px]">
            {menuState.type === "main"
              ? "All"
              : menuState.type === "folder-docs"
              ? `Folders › ${menuState.folderName}`
              : menuState.type}
          </span>
        </div>
        {currentQuery && (
          <span className="text-[10px] text-purple-400/80 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded">
            &ldquo;{currentQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Main List */}
      <div className="overflow-y-auto max-h-[300px] py-1 flex flex-col gap-0.5">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)] opacity-50">No references found</p>
            <p className="text-xs text-[var(--muted-foreground)] opacity-30 mt-1">Try a different keyword</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const isSelected = idx === selectedIdx
            let title = ""
            let desc = ""

            if (item.type === "category") {
              title = item.title
              desc = `Reference your ${item.title.toLowerCase()}`
            } else if (item.type === "back") {
              title = item.label
              desc = "Navigate back"
            } else if (item.type === "task") {
              title = item.task.title
              desc = `Task in ${item.task.list}`
            } else if (item.type === "doc") {
              title = item.doc.title
              desc = `Page Document`
            } else if (item.type === "folder") {
              title = item.folder.name
              desc = `Folder`
            } else if (item.type === "date") {
              title = item.label
              desc = `Format: ${item.dateStr}`
            }

            return (
              <button
                key={`${item.type}-${idx}`}
                ref={isSelected ? selectedRef : null}
                className={`
                  w-[calc(100%-8px)] h-10 flex items-center gap-2.5
                  px-2.5 mx-1 rounded-md text-left transition-colors duration-75
                  ${isSelected
                    ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe]"
                    : "text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:bg-zinc-800/40"
                  }
                `}
                onMouseEnter={() => onHover(idx)}
                onClick={() => handleItemSelect(item)}
              >
                {/* Icon wrapper */}
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? "rgba(168, 85, 247, 0.15)" : "var(--muted)",
                  }}
                >
                  {renderIcon(item)}
                </span>

                {/* Text block */}
                <span className="flex flex-col min-w-0 flex-1 leading-none">
                  <span className="font-medium text-xs text-zinc-100 leading-tight truncate">{title}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] opacity-60 leading-tight truncate mt-0.5">
                    {desc}
                  </span>
                </span>

                {/* Submenu chevron indicator */}
                {(item.type === "category" || item.type === "folder") && (
                  <Icons.CaretRight size={10} className="opacity-40" />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
