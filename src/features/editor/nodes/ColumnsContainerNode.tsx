import type {
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { DecoratorNode, $applyNodeReplacement, createEditor, $getRoot, $createParagraphNode } from "lexical"
import type { ReactNode } from "react"
import { Suspense, lazy } from "react"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table"
import { MarkNode } from "@lexical/mark"
import { PageLinkNode } from "./PageLinkNode"
import { HorizontalRuleNode } from "./HorizontalRuleNode"
import { CalloutNode } from "./CalloutNode"
import { ToggleNode } from "./ToggleNode"
import { EquationNode } from "./EquationNode"
import { ImageNode } from "./ImageNode"
import { FileNode } from "./FileNode"
import { editorTheme } from "../editorTheme"

const ColumnsContainerComponent = lazy(
  () => import("../components/ColumnsContainerComponent")
)

export interface ColumnData {
  key: string
  width: number
  editor: LexicalEditor
}

export type SerializedColumnData = {
  key: string
  width: number
  editorState: string
}

export type SerializedColumnsContainerNode = Spread<
  { columnCount: number; columns: SerializedColumnData[]; marginOffset?: number },
  SerializedLexicalNode
>

export function createColumnEditor(editorStateJson?: string): LexicalEditor {
  const config = {
    namespace: "nested-column-editor",
    theme: editorTheme,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      MarkNode,
      PageLinkNode,
      HorizontalRuleNode,
      CalloutNode,
      ToggleNode,
      EquationNode,
      ImageNode,
      FileNode,
    ],
    onError: (error: Error) => {
      console.error("[NestedColumnEditor]", error)
    },
  }
  const editor = createEditor(config)
  if (editorStateJson) {
    try {
      const parsed = editor.parseEditorState(editorStateJson)
      const isEmpty = parsed.read(() => {
        const root = $getRoot()
        return root.isEmpty()
      })
      if (!isEmpty) {
        editor.setEditorState(parsed)
      } else {
        editor.update(() => {
          const root = $getRoot()
          root.append($createParagraphNode())
        })
      }
    } catch (e) {
      console.warn("Failed to parse nested editor state:", e)
      editor.update(() => {
        const root = $getRoot()
        root.append($createParagraphNode())
      })
    }
  } else {
    editor.update(() => {
      const root = $getRoot()
      root.append($createParagraphNode())
    })
  }
  return editor
}

export class ColumnsContainerNode extends DecoratorNode<ReactNode> {
  __columnCount: number
  __columns: ColumnData[]
  __marginOffset: number

  static getType(): string {
    return "columns-container"
  }

  static clone(node: ColumnsContainerNode): ColumnsContainerNode {
    // Clone editors by extracting their states
    const clonedColumns = node.__columns.map((col) => {
      const stateStr = JSON.stringify(col.editor.getEditorState().toJSON())
      return {
        key: col.key,
        width: col.width,
        editor: createColumnEditor(stateStr),
      }
    })
    return new ColumnsContainerNode(node.__columnCount, clonedColumns, node.__marginOffset, node.__key)
  }

  constructor(columnCount: number, columns?: ColumnData[], marginOffset?: number, key?: NodeKey) {
    super(key)
    this.__columnCount = columnCount
    this.__marginOffset = marginOffset ?? 0
    if (columns) {
      this.__columns = columns
    } else {
      const equalWidth = parseFloat((100 / columnCount).toFixed(2))
      this.__columns = Array.from({ length: columnCount }, (_, i) => ({
        key: `nested-col-${i}-${Math.random().toString(36).substring(2, 9)}`,
        width: equalWidth,
        editor: createColumnEditor(),
      }))
    }
  }

  getColumns(): ColumnData[] {
    return this.getLatest().__columns
  }

  getMarginOffset(): number {
    return this.getLatest().__marginOffset
  }

  setMarginOffset(marginOffset: number): void {
    const writable = this.getWritable()
    writable.__marginOffset = marginOffset
  }

  setColumns(columns: ColumnData[]): this {
    const writable = this.getWritable()
    writable.__columns = [...columns]
    writable.__columnCount = columns.length
    return writable
  }

  addColumn(afterIdx: number): void {
    const writable = this.getWritable()
    const currentCount = writable.__columns.length
    if (currentCount >= 5) return
    const newCount = currentCount + 1
    const equalWidth = parseFloat((100 / newCount).toFixed(2))
    
    // Redistribute existing columns
    writable.__columns = writable.__columns.map(col => ({
      ...col,
      width: equalWidth
    }))
    
    // Insert new column
    const newCol: ColumnData = {
      key: `nested-col-${newCount}-${Math.random().toString(36).substring(2, 9)}`,
      width: equalWidth,
      editor: createColumnEditor()
    }
    
    writable.__columns.splice(afterIdx + 1, 0, newCol)
    writable.__columnCount = newCount
  }

  removeColumn(idx: number): void {
    const writable = this.getWritable()
    const currentCount = writable.__columns.length
    if (currentCount <= 1) {
      writable.remove()
      return
    }
    writable.__columns.splice(idx, 1)
    const newCount = currentCount - 1
    const equalWidth = parseFloat((100 / newCount).toFixed(2))
    writable.__columns = writable.__columns.map(col => ({
      ...col,
      width: equalWidth
    }))
    writable.__columnCount = newCount
  }

  setColumnWidths(widths: number[]): void {
    const writable = this.getWritable()
    writable.__columns = writable.__columns.map((col, idx) => ({
      ...col,
      width: widths[idx]
    }))
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div")
    el.className = "columns-outer-wrapper"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  static importJSON(
    json: SerializedColumnsContainerNode
  ): ColumnsContainerNode {
    const columns = json.columns.map((col) => ({
      key: col.key,
      width: col.width,
      editor: createColumnEditor(col.editorState),
    }))
    return new ColumnsContainerNode(json.columnCount, columns, json.marginOffset)
  }

  exportJSON(): SerializedColumnsContainerNode {
    return {
      type: "columns-container",
      columnCount: this.__columnCount,
      columns: this.__columns.map((col) => ({
        key: col.key,
        width: col.width,
        editorState: JSON.stringify(col.editor.getEditorState().toJSON()),
      })),
      marginOffset: this.__marginOffset,
      version: 1,
    }
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): ReactNode {
    return (
      <Suspense fallback={null}>
        <ColumnsContainerComponent
          nodeKey={this.__key}
          columnCount={this.__columnCount}
          editor={editor}
        />
      </Suspense>
    )
  }

  isInline(): boolean { return false }
  isIsolated(): boolean { return true }
  isKeyboardSelectable(): boolean { return true }
}

export function $createColumnsContainerNode(
  columnCount: number
): ColumnsContainerNode {
  return $applyNodeReplacement(new ColumnsContainerNode(columnCount))
}

export function $isColumnsContainerNode(
  node: unknown
): node is ColumnsContainerNode {
  return node instanceof ColumnsContainerNode
}
