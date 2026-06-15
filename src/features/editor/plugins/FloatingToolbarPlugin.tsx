import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type ElementFormatType,
  $isElementNode,
} from "lexical"
import { $isLinkNode } from "@lexical/link"
import { $isListNode } from "@lexical/list"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode } from "@lexical/code"
import { mergeRegister } from "@lexical/utils"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import FloatingToolbar from "../components/FloatingToolbar"
import { useEditorMenuPosition } from "@/shared/hooks/usePortalPosition"

export default function FloatingToolbarPlugin(): React.ReactNode {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<{ top: number; bottom: number; left: number; width: number } | null>(null)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [blockType, setBlockType] = useState("paragraph")
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left")

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setOpen(false)
      return
    }

    const textContent = selection.getTextContent()
    if (textContent.trim() === "") {
      setOpen(false)
      return
    }

    // Detect text formatting states
    setIsBold(selection.hasFormat("bold"))
    setIsItalic(selection.hasFormat("italic"))
    setIsUnderline(selection.hasFormat("underline"))
    setIsStrikethrough(selection.hasFormat("strikethrough"))
    setIsCode(selection.hasFormat("code"))

    // Detect block type
    const anchorNode = selection.anchor.getNode()
    const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow()
    
    let type = "paragraph"
    if ($isHeadingNode(element)) {
      type = element.getTag()
    } else if ($isListNode(element)) {
      type = element.getListType()
    } else if ($isQuoteNode(element)) {
      type = "quote"
    } else if ($isCodeNode(element)) {
      type = "code"
    }
    setBlockType(type)

    // Detect element formatting (alignment)
    if ($isElementNode(element)) {
      setElementFormat(element.getFormatType() || "left")
    } else {
      setElementFormat("left")
    }

    // Hide toolbar in code block (rich formatting not permitted)
    if (type === "code") {
      setOpen(false)
      return
    }

    // Detect links in selection
    const nodes = selection.getNodes()
    const hasLink = nodes.some((node) => {
      let parent: any = node
      while (parent !== null && parent.getKey() !== "root") {
        if ($isLinkNode(parent)) return true
        parent = parent.getParent()
      }
      return false
    })
    setIsLink(hasLink)

    // Calculate selection DOM coordinates
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      setOpen(false)
      return
    }

    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()

    setTriggerRect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.width > 0 ? rect.left : (editor.getRootElement()?.getBoundingClientRect().left ?? 100),
      width: rect.width,
    })

    setOpen(true)
  }, [])

  useEffect(() => {
    // Listen to changes in Lexical state
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
    return unregister
  }, [editor, updateToolbar])

  // Listen to browser mouse and key events to capture drag selection ending
  useEffect(() => {
    const handleMouseUpOrKeyUp = () => {
      editor.getEditorState().read(() => {
        updateToolbar()
      })
    }

    document.addEventListener("mouseup", handleMouseUpOrKeyUp)
    document.addEventListener("keyup", handleMouseUpOrKeyUp)

    return () => {
      document.removeEventListener("mouseup", handleMouseUpOrKeyUp)
      document.removeEventListener("keyup", handleMouseUpOrKeyUp)
    }
  }, [editor, updateToolbar])

  // Reposition toolbar when the editor scrolls
  useEffect(() => {
    if (!open) return
    const scrollContainer = document.querySelector('.editor-scroll-area') as HTMLElement | null
    if (!scrollContainer) return

    const handleScroll = () => {
      editor.getEditorState().read(() => {
        updateToolbar()
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [editor, updateToolbar, open])

  const { menuRef, style: menuStyle } = useEditorMenuPosition({
    triggerRect: open ? triggerRect : null,
    open,
    offset: 10,
    maxHeight: 180,
    maxWidth: 220,
    centerHorizontally: true,
  })

  if (!open) return null

  return createPortal(
    <FloatingToolbar
      editor={editor}
      menuRef={menuRef}
      menuStyle={menuStyle}
      isBold={isBold}
      isItalic={isItalic}
      isUnderline={isUnderline}
      isStrikethrough={isStrikethrough}
      isCode={isCode}
      isLink={isLink}
      blockType={blockType}
      elementFormat={elementFormat}
      onClose={() => setOpen(false)}
    />,
    document.body
  )
}
