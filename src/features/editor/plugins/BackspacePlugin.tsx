import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalNode } from "lexical"
import {
  $getSelection,
  $isRangeSelection,
  KEY_BACKSPACE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $isElementNode,
  $createParagraphNode,
} from "lexical"

export default function BackspacePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false
        }

        const anchor = selection.anchor
        const anchorNode = anchor.getNode()
        
        // Find the nearest block-level element node containing the selection
        let blockNode: LexicalNode | null = anchorNode
        while (blockNode !== null) {
          if ($isElementNode(blockNode) && !blockNode.isInline()) {
            break
          }
          blockNode = blockNode.getParent()
        }

        if (blockNode === null || !$isElementNode(blockNode)) {
          return false
        }

        const isEmpty = blockNode.getTextContentSize() === 0
        const prevSibling = blockNode.getPreviousSibling()
        const isCallout = blockNode.getType() === "callout"

        // Check if selection is at the start of the block node
        let isAtStart = false
        if (isEmpty) {
          isAtStart = true
        } else if (anchor.offset === 0) {
          const firstDescendant = blockNode.getFirstDescendant()
          if (firstDescendant === null) {
            isAtStart = true
          } else {
            let curr: LexicalNode | null = anchorNode
            let isFirst = true
            while (curr !== null && curr !== blockNode) {
              const parent = curr.getParent()
              if (parent !== null && parent.getFirstChild() !== curr) {
                isFirst = false
                break
              }
              curr = parent
            }
            if (isFirst) {
              isAtStart = true
            }
          }
        }

        if (!isAtStart) {
          return false
        }

        // Check if previous sibling is a divider
        const isPrevDivider = prevSibling !== null && prevSibling.getType() === "horizontalrule"

        if (isPrevDivider) {
          event.preventDefault()
          const nodeBeforeDivider = prevSibling.getPreviousSibling()
          if (nodeBeforeDivider !== null && $isElementNode(nodeBeforeDivider)) {
            if (isEmpty || isCallout) {
              blockNode.remove()
            }
            nodeBeforeDivider.selectEnd()
          }
          return true
        }

        // Handle CalloutNode deletion/merging specifically
        if (isCallout) {
          event.preventDefault()
          if (prevSibling !== null && $isElementNode(prevSibling)) {
            const children = blockNode.getChildren()
            const lastChild = prevSibling.getLastChild()
            if (lastChild !== null) {
              lastChild.selectEnd()
            } else {
              prevSibling.selectEnd()
            }
            children.forEach((child) => {
              prevSibling.append(child)
            })
            blockNode.remove()
            return true
          }

          if (prevSibling === null) {
            // First node, convert callout to paragraph
            const p = $createParagraphNode()
            const children = blockNode.getChildren()
            children.forEach((child) => {
              p.append(child)
            })
            blockNode.replace(p)
            p.selectStart()
            return true
          }
        }

        if (isEmpty) {
          event.preventDefault()
          if (prevSibling !== null && $isElementNode(prevSibling)) {
            blockNode.remove()
            prevSibling.selectEnd()
            return true
          }

          const nextSibling = blockNode.getNextSibling()
          if (nextSibling !== null) {
            blockNode.remove()
            nextSibling.selectStart()
            return true
          }

          // If it's the only block node and it's empty, and not a paragraph, convert to paragraph
          if (blockNode.getType() !== "paragraph") {
            const p = $createParagraphNode()
            blockNode.replace(p)
            p.select()
            return true
          }
        }

        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor])

  return null
}

