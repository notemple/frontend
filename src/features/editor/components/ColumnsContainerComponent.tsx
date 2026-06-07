import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  KEY_BACKSPACE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $isElementNode,
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
import BlockHandlePlugin from "../plugins/BlockHandlePlugin"
import FloatingToolbarPlugin from "../plugins/FloatingToolbarPlugin"


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
  const [marginOffset, setMarginOffset] = useState<number>(0)
  const [isResizing, setIsResizing] = useState(false)

  const resizeRef = useRef<{
    startX: number
    startWidths: number[]
    leftIdx: number
    containerWidth: number
  } | null>(null)

  const outerResizeRef = useRef<{
    startX: number
    startOffset: number
    direction: "left" | "right"
  } | null>(null)

  // Read columns directly from node state in the parent editor
  useEffect(() => {
    const readColumns = () => {
      editor.getEditorState().read(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          setColumns(containerNode.getColumns())
          setMarginOffset(containerNode.getMarginOffset() ?? 0)
        }
      })
    }

    readColumns()
    return editor.registerUpdateListener(readColumns)
  }, [editor, nodeKey])

  // Resize handler for columns within the container
  const onResizeStart = useCallback(
    (e: React.MouseEvent, leftIdx: number) => {
      e.preventDefault()
      window.getSelection()?.removeAllRanges()
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const containerLeft = rect.left
      const containerRight = rect.right
      const containerWidth = rect.width
      let startWidths: number[] = []

      editor.getEditorState().read(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          startWidths = containerNode.getColumns().map(c => c.width)
        }
      })

      resizeRef.current = { startX: e.clientX, startWidths, leftIdx, containerWidth }
      setIsResizing(true)

      const MIN = 10

      const onMouseMove = (me: MouseEvent) => {
        if (!resizeRef.current) return
        window.getSelection()?.removeAllRanges()
        const { startX, startWidths: sw, leftIdx: li, containerWidth: cw } = resizeRef.current
        const mouseX = Math.max(containerLeft, Math.min(containerRight, me.clientX))
        const deltaPercent = ((mouseX - startX) / cw) * 100

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
        setIsResizing(false)
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

  // Outer resize handler to expand/shrink the whole columns container
  const onOuterResizeStart = useCallback(
    (e: React.MouseEvent, direction: "left" | "right") => {
      e.preventDefault()
      window.getSelection()?.removeAllRanges()

      let startOffset = 0
      editor.getEditorState().read(() => {
        const containerNode = $getNodeByKey(nodeKey)
        if ($isColumnsContainerNode(containerNode)) {
          startOffset = containerNode.getMarginOffset() ?? 0
        }
      })

      outerResizeRef.current = {
        startX: e.clientX,
        startOffset,
        direction,
      }
      setIsResizing(true)

      const onMouseMove = (me: MouseEvent) => {
        if (!outerResizeRef.current) return
        window.getSelection()?.removeAllRanges()
        const { startX, startOffset: so, direction: dir } = outerResizeRef.current

        const deltaX = me.clientX - startX
        let newOffset = so
        if (dir === "right") {
          newOffset = Math.max(0, so + deltaX)
        } else {
          newOffset = Math.max(0, so - deltaX)
        }

        // Limit the maximum width of the column node to 90% of the screen/viewport width
        const limitWidth = Math.min(
          window.innerWidth,
          containerRef.current?.closest(".editor-scroll-area")?.getBoundingClientRect().width ?? window.innerWidth
        ) * 0.90
        const parentWidth = containerRef.current?.parentElement?.getBoundingClientRect().width ?? 720
        const maxOffset = Math.max(0, (limitWidth - parentWidth) / 2)
        newOffset = Math.min(maxOffset, newOffset)

        editor.update(() => {
          const containerNode = $getNodeByKey(nodeKey)
          if ($isColumnsContainerNode(containerNode)) {
            containerNode.setMarginOffset(newOffset)
          }
        })
      }

      const onMouseUp = () => {
        outerResizeRef.current = null
        setIsResizing(false)
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
      style={{
        marginLeft: `-${marginOffset + 16}px`,
        marginRight: `-${marginOffset - 16}px`,
        width: `calc(100% + ${marginOffset * 2}px)`,
      }}
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
            onOuterResizeStart={onOuterResizeStart}
            parentEditor={editor}
            parentNodeKey={nodeKey}
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
  onOuterResizeStart,
  parentEditor,
  parentNodeKey,
}: {
  col: ColumnData
  idx: number
  totalColumns: number
  onAddColumn: (afterIdx: number) => void
  onRemoveColumn: (idx: number) => void
  onResizeStart: (e: React.MouseEvent, leftIdx: number) => void
  onOuterResizeStart: (e: React.MouseEvent, direction: "left" | "right") => void
  parentEditor: LexicalEditor
  parentNodeKey: string
}) {
  // Propagate nested column editor updates to the parent editor for persistence
  useEffect(() => {
    return col.editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        parentEditor.update(() => {
          const containerNode = $getNodeByKey(parentNodeKey)
          if ($isColumnsContainerNode(containerNode)) {
            containerNode.setColumns(containerNode.getColumns())
          }
        })
      }
    })
  }, [col.editor, parentEditor, parentNodeKey])

  useEffect(() => {
    return col.editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        let parentKey: string | null = null
        let prevKey: string | null = null
        let nextKey: string | null = null

        col.editor.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const anchorNode = selection.anchor.getNode()
            let parent = anchorNode
            const root = $getRoot()
            while (parent && parent.getParent() !== root) {
              parent = parent.getParent()
            }
            if (parent && parent.getParent() === root) {
              const isEmpty = $isElementNode(parent) && parent.getTextContentSize() === 0
              if (isEmpty) {
                parentKey = parent.getKey()
                const prevSibling = parent.getPreviousSibling()
                prevKey = prevSibling ? prevSibling.getKey() : null
                const nextSibling = parent.getNextSibling()
                nextKey = nextSibling ? nextSibling.getKey() : null
              }
            }
          }
        })

        if (parentKey !== null) {
          event.preventDefault()
          col.editor.update(() => {
            const parentNode = $getNodeByKey(parentKey!)
            if (parentNode) {
              parentNode.remove()
            }
            if (prevKey) {
              const prevNode = $getNodeByKey(prevKey)
              if (prevNode) {
                prevNode.selectEnd()
              }
            } else if (nextKey) {
              const nextNode = $getNodeByKey(nextKey)
              if (nextNode) {
                nextNode.selectStart()
              }
            } else {
              onRemoveColumn(idx)
            }
          })
          if (prevKey || nextKey) {
            col.editor.focus()
          }
          return true
        }
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [col.editor, idx, onRemoveColumn])

  return (
    <div
      className="group/column relative block column-block"
      data-type="column"
      style={{
        width: `${col.width}%`,
        flex: `0 0 ${col.width}%`,
        minWidth: 0,
        minHeight: 80,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Outer Left Resize handle */}
      {idx === 0 && (
        <div
          className="
            absolute top-0 left-0 w-2 h-full z-10
            cursor-col-resize
            hover:bg-purple-500/40
            transition-colors duration-150
          "
          contentEditable={false}
          onMouseDown={(e) => onOuterResizeStart(e, "left")}
        />
      )}

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
            <div className="relative block w-full flex-1">
              <ContentEditable
                className="lexical-root lexical-editor-root outline-none w-full cursor-text text-[var(--body-text)] flex-1"
                style={{ minHeight: 80 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    e.preventDefault()
                    e.stopPropagation()
                    col.editor.update(() => {
                      const root = $getRoot()
                      const selection = $getSelection()
                      let currentBlock = null

                      if ($isRangeSelection(selection)) {
                        const anchorNode = selection.anchor.getNode()
                        let parent = anchorNode
                        while (parent && parent.getParent() !== root) {
                          parent = parent.getParent()
                        }
                        if (parent && parent.getParent() === root) {
                          currentBlock = parent
                        }
                      }

                      if (currentBlock) {
                        if ($isParagraphNode(currentBlock) && currentBlock.isEmpty()) {
                          currentBlock.select()
                        } else {
                          const nextSibling = currentBlock.getNextSibling()
                          if ($isParagraphNode(nextSibling) && nextSibling.isEmpty()) {
                            nextSibling.select()
                          } else {
                            const newParagraph = $createParagraphNode()
                            currentBlock.insertAfter(newParagraph)
                            newParagraph.select()
                          }
                        }
                      } else {
                        const lastChild = root.getLastChild()
                        if ($isParagraphNode(lastChild) && lastChild.isEmpty()) {
                          lastChild.select()
                        } else {
                          const newParagraph = $createParagraphNode()
                          root.append(newParagraph)
                          newParagraph.select()
                        }
                      }
                    })
                  }
                }}
              />
            </div>
          }
          placeholder={
            <div 
              style={{ left: "36px" }}
              className="absolute top-0 pointer-events-none select-none text-[var(--muted-foreground)] opacity-40 text-base leading-7"
            >
              Press '/' for commands…
            </div>
          }
          ErrorBoundary={SafeErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <SlashCommandPlugin />
        <BlockHandlePlugin isNested={true} />
        <FloatingToolbarPlugin />
      </LexicalNestedComposer>

      {/* Inner Column Resize handle */}
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

      {/* Outer Right Resize handle */}
      {idx === totalColumns - 1 && (
        <div
          className="
            absolute top-0 right-0 w-2 h-full z-10
            cursor-col-resize
            hover:bg-purple-500/40
            transition-colors duration-150
          "
          contentEditable={false}
          onMouseDown={(e) => onOuterResizeStart(e, "right")}
        />
      )}

    </div>
  )
}
