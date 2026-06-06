import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getNodeByKey,
  type LexicalEditor,
} from "lexical"
import { Plus, Trash } from "@phosphor-icons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  $isColumnsContainerNode,
  type ColumnData,
} from "../nodes/ColumnsContainerNode"
import { editorTheme } from "../editorTheme"
import SlashCommandPlugin from "../plugins/SlashCommandPlugin"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SafeErrorBoundary = LexicalErrorBoundary as unknown as React.ComponentType<any>

interface Props {
  nodeKey: string
  columnCount: number
  editor: LexicalEditor
}

export default function ColumnsContainerComponent({
  nodeKey,
  editor,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState<ColumnData[]>([])

  const resizeRef = useRef<{
    startX: number
    startWidths: number[]
    leftIdx: number
    containerWidth: number
  } | null>(null)

  // Read columns directly from node state in the parent editor
  useEffect(() => {
    const readColumns = () => {
      editor.getEditorState().read(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          setColumns(containerNode.getColumns())
        }
      })
    }

    readColumns()
    return editor.registerUpdateListener(readColumns)
  }, [editor, nodeKey])

  // Resize handler
  const onResizeStart = useCallback(
    (e: React.MouseEvent, leftIdx: number) => {
      e.preventDefault()
      if (!containerRef.current) return

      const containerWidth = containerRef.current.getBoundingClientRect().width
      let startWidths: number[] = []

      editor.getEditorState().read(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          startWidths = containerNode.getColumns().map(c => c.width)
        }
      })

      resizeRef.current = { startX: e.clientX, startWidths, leftIdx, containerWidth }

      const MIN = 10

      const onMouseMove = (me: MouseEvent) => {
        if (!resizeRef.current) return
        const { startX, startWidths: sw, leftIdx: li, containerWidth: cw } = resizeRef.current
        const deltaPercent = ((me.clientX - startX) / cw) * 100

        const newWidths = [...sw]
        newWidths[li] = Math.max(MIN, Math.min(sw[li] + sw[li + 1] - MIN, sw[li] + deltaPercent))
        newWidths[li + 1] = sw[li] + sw[li + 1] - newWidths[li]

        editor.update(() => {
          const containerNode = $getNodeByKey(nodeKey)
          if ($isColumnsContainerNode(containerNode)) {
            containerNode.setColumnWidths(newWidths)
          }
        })
      }

      const onMouseUp = () => {
        resizeRef.current = null
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [editor, nodeKey]
  )

  // Add Column
  const addColumn = useCallback(
    (afterIdx: number) => {
      editor.update(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          containerNode.addColumn(afterIdx)
        }
      })
    },
    [editor, nodeKey]
  )

  // Remove Column
  const removeColumn = useCallback(
    (idx: number) => {
      editor.update(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          containerNode.removeColumn(idx)
        }
      })
    },
    [editor, nodeKey]
  )

  if (columns.length === 0) {
    return (
      <div
        className="columns-outer-wrapper py-4 text-muted-foreground text-sm text-center opacity-40"
        contentEditable={false}
      >
        Loading columns…
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="columns-container group/columns relative w-full my-2"
      data-type="columns-container"
      contentEditable={false}
    >
      {/* Column count badge */}
      <div className="
        absolute -top-5 left-0 z-30
        px-1.5 py-0.5 rounded text-[10px] font-semibold
        bg-purple-500/10 text-purple-400 border border-purple-500/20
        opacity-0 group-hover/columns:opacity-100
        transition-opacity duration-150
        pointer-events-none select-none
      ">
        {columns.length} cols
      </div>

      {/* Snap guidelines shown during resize */}
      {resizeRef.current && [25, 33.33, 50, 66.66, 75].map((pct) => (
        <div
          key={pct}
          className="absolute top-0 bottom-0 pointer-events-none z-10
            border-l border-dashed border-purple-500/30"
          style={{ left: `${pct}%` }}
        />
      ))}

      {/* Flex row of columns */}
      <div className="flex flex-row w-full min-h-[80px]">
        {columns.map((col, idx) => (
          <ColumnWrapper
            key={col.key}
            col={col}
            idx={idx}
            totalColumns={columns.length}
            onAddColumn={addColumn}
            onRemoveColumn={removeColumn}
            onResizeStart={onResizeStart}
          />
        ))}
      </div>
    </div>
  )
}

function ColumnWrapper({
  col,
  idx,
  totalColumns,
  onAddColumn,
  onRemoveColumn,
  onResizeStart,
}: {
  col: ColumnData
  idx: number
  totalColumns: number
  onAddColumn: (afterIdx: number) => void
  onRemoveColumn: (idx: number) => void
  onResizeStart: (e: React.MouseEvent, leftIdx: number) => void
}) {
  return (
    <div
      className="group/column relative"
      style={{
        width: `${col.width}%`,
        flex: `0 0 ${col.width}%`,
        minWidth: 0,
        minHeight: 80,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Per-column toolbar */}
      <div
        className="
          column-toolbar absolute top-1 right-6 z-20
          flex items-center gap-0.5
          bg-background/90 border border-border/40 rounded
          px-1 py-0.5
          opacity-0 group-hover/column:opacity-100
          transition-opacity duration-150
          pointer-events-auto select-none
        "
        contentEditable={false}
      >
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAddColumn(idx)}
          className="w-5 h-5 flex items-center justify-center rounded
            hover:bg-muted text-muted-foreground hover:text-foreground
            transition-colors"
          title="Add column to the right"
        >
          <Plus size={11} weight="bold" />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onRemoveColumn(idx)}
          className="w-5 h-5 flex items-center justify-center rounded
            hover:bg-red-500/10 text-muted-foreground hover:text-red-400
            transition-colors"
          title="Delete this column"
        >
          <Trash size={11} weight="bold" />
        </button>
      </div>

      {/* Nested Lexical editor for this column */}
      <LexicalNestedComposer
        initialEditor={col.editor}
        initialTheme={editorTheme}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none w-full cursor-text text-[var(--body-text)] px-3 py-2"
              style={{ minHeight: 80 }}
            />
          }
          placeholder={
            <div className="
              absolute top-2 left-3
              text-[var(--muted-foreground)] text-sm opacity-40
              pointer-events-none select-none
            ">
              Type here…
            </div>
          }
          ErrorBoundary={SafeErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <SlashCommandPlugin />
      </LexicalNestedComposer>

      {/* Resize handle */}
      {idx < totalColumns - 1 && (
        <div
          className="
            absolute top-0 right-0 w-2 h-full z-10
            cursor-col-resize
            hover:bg-purple-500/40
            transition-colors duration-150
          "
          contentEditable={false}
          onMouseDown={(e) => onResizeStart(e, idx)}
        />
      )}

      {/* Column border overlay */}
      <div
        className="
          absolute inset-0 rounded pointer-events-none
          border border-white/5
          group-hover/column:border-white/10
          group-focus-within/column:border-purple-500/25
          transition-colors duration-150
        "
        contentEditable={false}
      />
    </div>
  )
}
