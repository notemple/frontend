import type { LexicalEditor } from "lexical"
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import { $createCodeNode } from "@lexical/code"
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list"
import { $createColumnsContainerNode } from "../nodes/ColumnsContainerNode"
import { $createColumnNode } from "../nodes/ColumnNode"
import { $createHorizontalRuleNode } from "../nodes/HorizontalRuleNode"

export interface SlashCommand {
  title: string
  description: string
  keywords: string[]
  category: "Basic" | "Lists" | "Layout" | "Media" | "Advanced"
  icon: string // phosphor icon name, resolved in SlashCommandMenu
  onSelect: (editor: LexicalEditor) => void
}

function insertColumns(editor: LexicalEditor, count: number) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const container = $createColumnsContainerNode(count)

    const anchorNode = selection.anchor.getNode()
    const topLevel = anchorNode.getTopLevelElementOrThrow()
    topLevel.replace(container)
  })
}

export const slashCommands: SlashCommand[] = [
  // ── Basic ──────────────────────────────────────────────────────────────────
  {
    title: "Text",
    description: "Plain paragraph",
    keywords: ["text", "paragraph", "p", "plain"],
    category: "Basic",
    icon: "TextT",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createParagraphNode())
        }
      }),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    keywords: ["h1", "heading", "title", "heading1"],
    category: "Basic",
    icon: "TextHOne",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createHeadingNode("h1"))
        }
      }),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "heading", "heading2"],
    category: "Basic",
    icon: "TextHTwo",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createHeadingNode("h2"))
        }
      }),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    keywords: ["h3", "heading", "heading3"],
    category: "Basic",
    icon: "TextHThree",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createHeadingNode("h3"))
        }
      }),
  },
  {
    title: "Quote",
    description: "Capture a quote or callout",
    keywords: ["quote", "blockquote", "callout"],
    category: "Basic",
    icon: "Quotes",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createQuoteNode())
        }
      }),
  },
  {
    title: "Code",
    description: "Code block with syntax highlighting",
    keywords: ["code", "pre", "codeblock", "snippet"],
    category: "Basic",
    icon: "Code",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createCodeNode())
        }
      }),
  },
  {
    title: "Divider",
    description: "A horizontal dividing line",
    keywords: ["divider", "hr", "rule", "separator", "line"],
    category: "Basic",
    icon: "Minus",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          sel.anchor.getNode().getTopLevelElementOrThrow().replace($createHorizontalRuleNode())
        }
      }),
  },

  // ── Lists ───────────────────────────────────────────────────────────────────
  {
    title: "Bullet List",
    description: "An unordered list",
    keywords: ["bullet", "list", "ul", "unordered"],
    category: "Lists",
    icon: "ListBullets",
    onSelect: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    title: "Numbered List",
    description: "An ordered numbered list",
    keywords: ["numbered", "list", "ol", "ordered", "number"],
    category: "Lists",
    icon: "ListNumbers",
    onSelect: (editor) =>
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    title: "To-do List",
    description: "Track tasks with checkboxes",
    keywords: ["todo", "checklist", "task", "checkbox", "check"],
    category: "Lists",
    icon: "CheckSquare",
    onSelect: (editor) =>
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  },

  // ── Layout ──────────────────────────────────────────────────────────────────
  {
    title: "2 Columns",
    description: "Split content into 2 side-by-side columns",
    keywords: ["2 columns", "two columns", "split", "layout", "col", "cols"],
    category: "Layout",
    icon: "SquareSplitHorizontal",
    onSelect: (editor) => insertColumns(editor, 2),
  },
  {
    title: "3 Columns",
    description: "Split content into 3 side-by-side columns",
    keywords: ["3 columns", "three columns", "split", "layout", "col", "cols"],
    category: "Layout",
    icon: "SquareSplitHorizontal",
    onSelect: (editor) => insertColumns(editor, 3),
  },
  {
    title: "4 Columns",
    description: "Split content into 4 side-by-side columns",
    keywords: ["4 columns", "four columns", "split", "layout", "col", "cols"],
    category: "Layout",
    icon: "SquareSplitHorizontal",
    onSelect: (editor) => insertColumns(editor, 4),
  },
  {
    title: "5 Columns",
    description: "Split content into 5 side-by-side columns",
    keywords: ["5 columns", "five columns", "split", "layout", "col", "cols"],
    category: "Layout",
    icon: "SquareSplitHorizontal",
    onSelect: (editor) => insertColumns(editor, 5),
  },
]
