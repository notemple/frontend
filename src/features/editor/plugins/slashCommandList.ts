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
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import { $createColumnsContainerNode } from "../nodes/ColumnsContainerNode"
import { $createHorizontalRuleNode } from "../nodes/HorizontalRuleNode"
import { $createCalloutNode, type CalloutType } from "../nodes/CalloutNode"
import { $createToggleNode } from "../nodes/ToggleNode"
import { $createImageNode } from "../nodes/ImageNode"
import { $createEquationNode } from "../nodes/EquationNode"

export interface SlashCommand {
  title: string
  description: string
  keywords: string[]
  category: "Basic" | "Lists" | "Layout" | "Media" | "Advanced"
  icon: string // phosphor icon name, resolved in SlashCommandMenu
  onSelect: (editor: LexicalEditor) => void
  submenu?: boolean
}

function insertColumns(editor: LexicalEditor, count: number) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const container = $createColumnsContainerNode(count)

    const anchorNode = selection.anchor.getNode()
    const topLevel = anchorNode.getTopLevelElementOrThrow()
    const newParagraph = $createParagraphNode()
    topLevel.insertAfter(newParagraph)
    topLevel.replace(container)
    newParagraph.select()
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
          const node = $createParagraphNode()
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
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
          const node = $createHeadingNode("h1")
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
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
          const node = $createHeadingNode("h2")
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
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
          const node = $createHeadingNode("h3")
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
        }
      }),
  },
  {
    title: "Quote",
    description: "Capture a quote or callout",
    keywords: ["quote", "blockquote"],
    category: "Basic",
    icon: "Quotes",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createQuoteNode()
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
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
          const node = $createCodeNode()
          sel.anchor.getNode().getTopLevelElementOrThrow().replace(node)
          node.select()
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
  {
    title: "Callout",
    description: "Highlighted info box",
    keywords: ["callout", "info", "highlight", "box", "note", "alert", "warning"],
    category: "Basic",
    icon: "Warning",
    submenu: true,
    onSelect: () => {},
  },
  {
    title: "Toggle",
    description: "Collapsible section",
    keywords: ["toggle", "collapse", "expand", "accordion", "details"],
    category: "Basic",
    icon: "CaretRight",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createToggleNode("Toggle")
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
          newParagraph.select()
        }
      }),
  },
  {
    title: "Table",
    description: "Insert a simple table",
    keywords: ["table", "grid", "rows", "columns", "spreadsheet"],
    category: "Basic",
    icon: "Table",
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: "3",
        columns: "3",
        includeHeaders: true,
      })
    },
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
  {
    title: "Toggle List",
    description: "Collapsible list items",
    keywords: ["toggle list", "collapsible", "expandable"],
    category: "Lists",
    icon: "ListDashes",
    onSelect: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
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

  // ── Media ───────────────────────────────────────────────────────────────────
  {
    title: "Image",
    description: "Upload or embed an image",
    keywords: ["image", "photo", "picture", "upload", "img"],
    category: "Media",
    icon: "Image",
    onSelect: (editor) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const src = reader.result as string
          editor.update(() => {
            const sel = $getSelection()
            if (!$isRangeSelection(sel)) return
            const imgNode = $createImageNode(src, file.name)
            const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
            const newParagraph = $createParagraphNode()
            topLevel.insertAfter(newParagraph)
            topLevel.replace(imgNode)
            newParagraph.select()
          })
        }
        reader.readAsDataURL(file)
      }
      input.click()
    },
  },
  {
    title: "Video",
    description: "Embed a video by URL",
    keywords: ["video", "youtube", "embed", "mp4"],
    category: "Media",
    icon: "Video",
    onSelect: (editor) => {
      const url = prompt("Paste video URL:")
      if (!url) return
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const para = $createParagraphNode()
        sel.anchor.getNode().getTopLevelElementOrThrow().replace(para)
        para.select()
      })
    },
  },

  // ── Advanced ─────────────────────────────────────────────────────────────────
  {
    title: "Math Equation",
    description: "LaTeX block equation",
    keywords: ["math", "equation", "latex", "formula", "katex"],
    category: "Advanced",
    icon: "MathOperations",
    onSelect: (editor) => {
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const node = $createEquationNode("E = mc^2", false)
        const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
        const newParagraph = $createParagraphNode()
        topLevel.insertAfter(newParagraph)
        topLevel.replace(node)
        newParagraph.select()
      })
    },
  },
]

export const calloutSubmenuCommands: SlashCommand[] = [
  {
    title: "Note",
    description: "Blue ℹ️ callout",
    keywords: ["note", "blue", "info"],
    category: "Basic",
    icon: "Info",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("note", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
  {
    title: "Tip",
    description: "Green 💡 callout",
    keywords: ["tip", "green", "idea", "success"],
    category: "Basic",
    icon: "Lightbulb",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("tip", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
  {
    title: "Important",
    description: "Violet 💜 callout",
    keywords: ["important", "violet", "purple", "attention"],
    category: "Basic",
    icon: "Star",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("important", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
  {
    title: "Warning",
    description: "Yellow ⚠️ callout",
    keywords: ["warning", "yellow", "alert"],
    category: "Basic",
    icon: "Warning",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("warning", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
  {
    title: "Caution",
    description: "Red 🚨 callout",
    keywords: ["caution", "red", "danger", "error"],
    category: "Basic",
    icon: "XCircle",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("caution", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
  {
    title: "Custom",
    description: "Grey ⚙️ callout",
    keywords: ["custom", "grey", "gray"],
    category: "Basic",
    icon: "Gear",
    onSelect: (editor) =>
      editor.update(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          const node = $createCalloutNode("custom", undefined, undefined, undefined, undefined, true)
          const topLevel = sel.anchor.getNode().getTopLevelElementOrThrow()
          const newParagraph = $createParagraphNode()
          topLevel.insertAfter(newParagraph)
          topLevel.replace(node)
        }
      }),
  },
]
