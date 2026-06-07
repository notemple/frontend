import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { LinkNode, AutoLinkNode } from "@lexical/link"
import { CodeNode, CodeHighlightNode } from "@lexical/code"
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table"
import { MarkNode } from "@lexical/mark"
import { editorTheme } from "./editorTheme"
import {
  ColumnsContainerNode,
  ColumnNode,
  CalloutNode,
  ToggleNode,
  EquationNode,
  ImageNode,
  FileNode,
  HorizontalRuleNode,
  PageLinkNode,
  TaskNode,
} from "./nodes"

export function createEditorConfig(documentId: string): InitialConfigType {
  return {
    namespace: `TemplnoteEditor-${documentId}`,
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
      ColumnsContainerNode,
      ColumnNode,
      CalloutNode,
      ToggleNode,
      EquationNode,
      ImageNode,
      FileNode,
      HorizontalRuleNode,
      PageLinkNode,
      TaskNode,
    ],
    onError: (error: Error) => {
      console.error("[TemplnoteEditor]", error)
    },
  }
}
