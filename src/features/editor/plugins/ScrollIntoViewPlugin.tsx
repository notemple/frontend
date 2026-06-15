import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"

export default function ScrollIntoViewPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      // After every editor update, scroll the native selection into view
      // using the browser's built-in scrollIntoView on the cursor element
      requestAnimationFrame(() => {
        const nativeSel = window.getSelection()
        if (!nativeSel || nativeSel.rangeCount === 0) return
        const range = nativeSel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        if (rect.bottom > window.innerHeight - 80 || rect.top < 80) {
          range.startContainer.parentElement?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          })
        }
      })
    })
  }, [editor])

  return null
}
