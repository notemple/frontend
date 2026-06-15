import React, { useState, useEffect, useRef } from "react"
import * as Icons from "@phosphor-icons/react"
import { useDocumentStore } from "@/features/documents/store"
import { useTaskStore } from "@/features/tasks/store"
import { useCollectionStore } from "@/features/collections/store/collectionStore"
import { format, addDays, subDays } from "date-fns"
import type { RefCallback, CSSProperties } from "react"

interface Props {
  selectedIdx: number
  currentQuery: string
  menuRef: RefCallback<HTMLDivElement>
  menuStyle: CSSProperties
  onSelect: (payload: { type: "doc" | "task" | "date" | "collection-item"; id: string; title: string }) => void
  onHover: (idx: number) => void
  onClose: () => void
  onItemsChange?: (itemsCount: number) => void
  triggerType?: "mention" | "doc-only"
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
  | { type: "task"; task: any }
  | { type: "doc"; doc: any }
  | { type: "folder"; folder: any }
  | { type: "date"; dateStr: string; label: string }
  | { type: "collection-item"; item: any; collection: any }

export default function MentionMenu({
  selectedIdx,
  currentQuery,
  menuRef,
  menuStyle,
  onSelect,
  onHover,
  onItemsChange,
  triggerType = "mention",
}: Props) {
  const [menuState, setMenuState] = useState<MenuState>({ type: "main" })
  const selectedRef = useRef<HTMLButtonElement>(null)
  const submenuSelectedRef = useRef<HTMLButtonElement>(null)

  const documentsDict = useDocumentStore((state) => state.documents)
  const folders = useDocumentStore((state) => state.folders)
  const tasks = useTaskStore((state) => state.tasks)
  
  const collections = useCollectionStore((state) => state.collections)
  const collectionItems = useCollectionStore((state) => state.items)

  const activeTasks = tasks.filter((t) => !t.isDeleted && t.status !== "done")
  const activeDocs = Object.values(documentsDict).filter((d) => !d.isDeleted && d.type !== "daily-note")

  const today = new Date()
  const dateOptions = [
    { label: "Today", dateStr: format(today, "yyyy-MM-dd") },
    { label: "Tomorrow", dateStr: format(addDays(today, 1), "yyyy-MM-dd") },
    { label: "Yesterday", dateStr: format(subDays(today, 1), "yyyy-MM-dd") },
  ]
  for (let i = 2; i <= 4; i++) {
    const nextDay = addDays(today, i)
    dateOptions.push({
      label: format(nextDay, "EEEE, MMM d"),
      dateStr: format(nextDay, "yyyy-MM-dd"),
    })
  }

  const q = currentQuery.trim().toLowerCase()

  const mainItems: RenderableItem[] = triggerType === "doc-only"
    ? (() => {
        const items: RenderableItem[] = []
        folders
          .filter((f) => !f.isDeleted)
          .forEach((folder) => items.push({ type: "folder", folder }))
        activeDocs
          .filter((d) => !d.folderId)
          .forEach((doc) => items.push({ type: "doc", doc }))
        return items
      })()
    : [
        { type: "category", id: "tasks", title: "Tasks", icon: "CheckSquare" },
        { type: "category", id: "date", title: "Date", icon: "CalendarBlank" },
        { type: "category", id: "folders", title: "Folders", icon: "Folder" },
        { type: "category", id: "uncategorized", title: "Uncategorized Docs", icon: "FileText" },
      ]

  const submenuItems: RenderableItem[] = (() => {
    if (q.length > 0) {
      const results: RenderableItem[] = []

      if (triggerType !== "doc-only") {
        activeTasks
          .filter((t) => (t.title || "").toLowerCase().includes(q))
          .slice(0, 5)
          .forEach((task) => results.push({ type: "task", task }))
      }

      activeDocs
        .filter((d) => (d.title || "").toLowerCase().includes(q))
        .slice(0, 10)
        .forEach((doc) => results.push({ type: "doc", doc }))

      folders
        .filter((f) => !f.isDeleted && (f.name || "").toLowerCase().includes(q))
        .slice(0, 5)
        .forEach((folder) => results.push({ type: "folder", folder }))

      Object.keys(collectionItems).forEach(colId => {
        const col = collections[colId]
        const itemsList = collectionItems[colId] || []
        const nameField = col?.fields[0]
        if (!nameField) return

        itemsList
          .filter(item => {
            const displayVal = String(item.values[nameField.id] || '')
            return displayVal.toLowerCase().includes(q)
          })
          .slice(0, 5)
          .forEach(item => results.push({ type: "collection-item", item, collection: col }))
      })

      if (triggerType !== "doc-only") {
        dateOptions
          .filter((d) => d.label.toLowerCase().includes(q) || d.dateStr.includes(q))
          .forEach((d) => results.push({ type: "date", dateStr: d.dateStr, label: d.label }))
      }

      return results
    }

    switch (menuState.type) {
      case "main": return []
      case "tasks": return activeTasks.map((task) => ({ type: "task" as const, task }))
      case "date": return dateOptions.map((d) => ({ type: "date" as const, dateStr: d.dateStr, label: d.label }))
      case "folders": return folders.filter((f) => !f.isDeleted).map((folder) => ({ type: "folder" as const, folder }))
      case "folder-docs": return activeDocs.filter((d) => d.folderId === menuState.folderId).map((doc) => ({ type: "doc" as const, doc }))
      case "uncategorized": return activeDocs.filter((d) => !d.folderId).map((doc) => ({ type: "doc" as const, doc }))
    }
  })()

  const isSplit = menuState.type !== "main" || q.length > 0

  useEffect(() => {
    onItemsChange?.(isSplit ? submenuItems.length : mainItems.length)
  }, [submenuItems.length, mainItems.length, isSplit, onItemsChange])

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedIdx])

  useEffect(() => {
    submenuSelectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selectedIdx])

  const getActiveCategoryIdx = () => {
    if (menuState.type === "main") return -1
    return mainItems.findIndex((item) => item.type === "category" && item.id === menuState.type)
  }

  const handleItemSelect = (item: RenderableItem, isSubmenu: boolean) => {
    if (item.type === "category") {
      setMenuState({ type: item.id })
      onHover(0)
    } else if (item.type === "folder" && !isSubmenu) {
      setMenuState({ type: "folder-docs", folderId: item.folder.id, folderName: item.folder.name })
      onHover(0)
    } else if (item.type === "doc") {
      onSelect({ type: "doc", id: item.doc.id, title: item.doc.title })
    } else if (item.type === "task") {
      onSelect({ type: "task", id: item.task.id, title: item.task.title })
    } else if (item.type === "date") {
      onSelect({ type: "date", id: `daily-note-${item.dateStr}`, title: item.label })
    } else if (item.type === "collection-item") {
      const displayField = item.collection?.fields[0]
      const title = displayField ? String(item.item.values[displayField.id] || '') : 'Unnamed Item'
      onSelect({ type: "collection-item", id: item.item.id, title: title || 'Unnamed Item' })
    }
  }

  const parentKeyHandlerRef = useRef<((e: KeyboardEvent) => boolean) | undefined>(undefined)
  parentKeyHandlerRef.current = (e: KeyboardEvent) => {
    const activeList = isSplit ? submenuItems : mainItems

    if (e.key === "ArrowRight" && !isSplit && activeList[selectedIdx]?.type === "category") {
      handleItemSelect(activeList[selectedIdx], false)
      return true
    }
    if (e.key === "ArrowLeft" && isSplit && menuState.type !== "main") {
      setMenuState({ type: "main" })
      onHover(getActiveCategoryIdx() >= 0 ? getActiveCategoryIdx() : 0)
      return true
    }
    if (e.key === "Enter" && activeList[selectedIdx]) {
      handleItemSelect(activeList[selectedIdx], isSplit)
      return true
    }
    return false
  }

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
  }, [submenuItems, mainItems, selectedIdx, menuState, isSplit])

  const renderIcon = (item: RenderableItem) => {
    switch (item.type) {
      case "category": {
        const Icon = (Icons as any)[item.icon] || Icons.FileText
        return <Icon size={14} weight="duotone" />
      }
      case "task":
        return <Icons.CheckSquare size={14} className="text-purple-400" />
      case "folder":
        return <Icons.Folder size={14} className="text-amber-400" />
      case "collection-item":
        return <span className="text-xs leading-none select-none font-sans">{item.collection?.icon || '📚'}</span>
      case "doc":
        if (item.doc.icon) {
          return <span className="text-sm leading-none select-none font-sans">{item.doc.icon}</span>
        }
        switch (item.doc.type) {
          case "book":
            return <Icons.Book size={14} className="text-orange-400" />
          case "person":
            return <Icons.User size={14} className="text-purple-400" />
          default:
            return <Icons.FileText size={14} className="text-teal-400" />
        }
      case "date": {
        const docId = `daily-note-${item.dateStr}`
        const doc = documentsDict[docId]
        if (doc?.icon) {
          return <span className="text-sm leading-none select-none font-sans">{doc.icon}</span>
        }
        return <Icons.CalendarBlank size={14} className="text-sky-400" />
      }
    }
  }

  const renderMenuItem = (
    item: RenderableItem,
    idx: number,
    isSelected: boolean,
    isSubmenu: boolean,
    ref?: React.Ref<HTMLButtonElement>
  ) => {
    let title = ""
    let desc = ""

    if (item.type === "category") {
      title = item.title
      desc = `Reference your ${item.title.toLowerCase()}`
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
    } else if (item.type === "collection-item") {
      const displayField = item.collection?.fields[0]
      title = displayField ? String(item.item.values[displayField.id] || '') : 'Unnamed Item'
      desc = `Collection Item in ${item.collection?.name || 'Collection'}`
    }

    return (
      <button
        key={`${item.type}-${idx}`}
        ref={ref}
        className={`
          w-[calc(100%-8px)] h-10 flex items-center gap-2.5
          px-2.5 mx-1 rounded-md text-left transition-colors duration-75
          ${isSelected
            ? "bg-[rgba(168,85,247,0.1)] text-[#d8b4fe]"
            : "text-[var(--foreground)] hover:bg-[var(--hover-bg)] hover:bg-zinc-800/40"
          }
        `}
        onMouseEnter={() => onHover(idx)}
        onClick={() => handleItemSelect(item, isSubmenu)}
      >
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isSelected ? "rgba(168, 85, 247, 0.15)" : "var(--muted)",
          }}
        >
          {renderIcon(item)}
        </span>

        <span className="flex flex-col min-w-0 flex-1 leading-none">
          <span className="font-medium text-xs text-zinc-100 leading-tight truncate">{title}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] opacity-60 leading-tight truncate mt-0.5">
            {desc}
          </span>
        </span>

        {item.type === "category" && !isSubmenu && (
          <Icons.CaretRight size={10} className="opacity-40" />
        )}
      </button>
    )
  }

  const renderMainPanel = () => {
    let mainIdx = 0

    return (
      <div className="mention-menu-panel">
        <div className="mention-menu-panel-header">
          Mentions
        </div>
        <div className="overflow-y-auto max-h-[300px] py-1 flex flex-col gap-0.5">
          {mainItems.map((item) => {
            const idx = mainIdx++
            const isActive = menuState.type !== "main" && item.type === "category" && item.id === menuState.type
            const isSelected = !isSplit && idx === selectedIdx

            return (
              <div key={`main-${item.type}-${idx}`} style={{ position: "relative" }}>
                {renderMenuItem(
                  item,
                  idx,
                  isSelected || isActive,
                  false,
                  !isSplit && isSelected ? selectedRef : undefined
                )}
                {isActive && (
                  <span className="mention-menu-active-indicator" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSubmenuPanel = () => {
    const titles: Record<string, string> = {
      tasks: "Tasks",
      date: "Date",
      folders: "Folders",
      "folder-docs": menuState.type === "folder-docs" ? menuState.folderName : "Folder",
      uncategorized: "Uncategorized",
    }
    const panelTitle = titles[menuState.type] || "Results"
    const backTarget = menuState.type === "folder-docs" ? "folders" : "main"

    return (
      <div className="mention-menu-panel mention-menu-panel-submenu">
        <div className="mention-menu-panel-header">
          <button
            className="mention-menu-back-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenuState({ type: backTarget as any })
              onHover(getActiveCategoryIdx() >= 0 ? getActiveCategoryIdx() : 0)
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Icons.ArrowLeft size={12} />
          </button>
          {panelTitle}
        </div>
        <div className="overflow-y-auto max-h-[300px] py-1 flex flex-col gap-0.5">
          {submenuItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)] opacity-50">No references found</p>
              <p className="text-xs text-[var(--muted-foreground)] opacity-30 mt-1">Try a different keyword</p>
            </div>
          ) : (
            submenuItems.map((item, idx) => {
              return renderMenuItem(
                item,
                idx,
                idx === selectedIdx,
                true,
                idx === selectedIdx ? submenuSelectedRef : undefined
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      id="onboarding-mention-list"
      data-testid="mention-menu"
      className={`mention-menu ${isSplit ? "mention-menu-split" : "w-[280px]"} rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden`}
      style={menuStyle}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {isSplit ? (
        <>
          {renderMainPanel()}
          {renderSubmenuPanel()}
        </>
      ) : (
        <>
          {/* Header */}
          <div className="px-3 pt-2 pb-1.5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-medium">
              <span className="opacity-40">Mentions</span>
            </div>
          </div>

          {renderMainPanel()}

          {/* Footer */}
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
