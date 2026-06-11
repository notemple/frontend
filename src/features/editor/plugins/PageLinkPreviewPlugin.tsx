import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import React, { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { $getRoot, $isElementNode } from "lexical"
import { createEditorConfig } from "../editorConfig"
import PersistencePlugin from "./PersistencePlugin"
import { useDocumentStore } from "../../documents/store"
import { useUiStore } from "../../../shared/store/uiStore"
import { useCollectionStore } from "@/features/collections/store/collectionStore"
import { $isPageLinkNode } from "../nodes/PageLinkNode"

interface Props {
  paneId?: string
}

export default function PageLinkPreviewPlugin({ paneId }: Props): React.ReactNode {
  const [editor] = useLexicalComposerContext()
  const [previewData, setPreviewData] = useState<{
    docId: string;
    position: { top: number; left: number };
  } | null>(null)
  
  const popupRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)
  const isInitialized = useDocumentStore(state => state.isInitialized)

  // Force-reconcile PageLinkNodes when the document store becomes initialized.
  // This solves timing/race conditions on initial load/page refresh.
  useEffect(() => {
    if (!isInitialized) return

    editor.update(() => {
      const root = $getRoot()
      const dirtyPageLinkNodes = (node: any) => {
        if ($isPageLinkNode(node)) {
          // Calling getWritable() marks the node as dirty, forcing Lexical
          // to re-run createDOM/updateDOM and fetch styling/emojis from the loaded store.
          node.getWritable()
        }
        if ($isElementNode(node)) {
          node.getChildren().forEach(dirtyPageLinkNodes)
        }
      }
      root.getChildren().forEach(dirtyPageLinkNodes)
    })
  }, [editor, isInitialized])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const handleMouseEnter = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".lexical-page-link") as HTMLElement | null
      if (!target) return

      hoveredElementRef.current = target

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }

      hoverTimeoutRef.current = setTimeout(() => {
        const docId = target.getAttribute("data-document-id")
        if (docId) {
          const rect = target.getBoundingClientRect()
          const width = 340
          const height = 350 // estimated default height
          
          let left = rect.left + window.scrollX
          if (left + width > window.innerWidth) {
            left = window.innerWidth - width - 16
          }
          left = Math.max(16, left)

          let top = rect.bottom + window.scrollY + 8
          if (rect.bottom + height > window.innerHeight) {
            top = rect.top + window.scrollY - height - 8
          }

          setPreviewData({
            docId,
            position: { top, left }
          })
        }
      }, 250) // 250ms hover delay
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".lexical-page-link") as HTMLElement | null
      if (!target) return

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }

      hoveredElementRef.current = null

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => {
        setPreviewData(null)
      }, 300)
    }

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".lexical-page-link") as HTMLElement | null
      if (!target) return

      e.preventDefault()
      e.stopPropagation()

      const docId = target.getAttribute("data-document-id")
      if (docId) {
        const uiStore = useUiStore.getState()
        const currentPaneId = paneId || uiStore.activePaneId || 'pane-main'

        if (docId.startsWith('item-')) {
          window.dispatchEvent(new CustomEvent('collection-item-detail-open', {
            detail: { itemId: docId }
          }));
        } else if (e.altKey) {
          // Alt+click: Open in new pane
          const newPaneId = `pane-${crypto.randomUUID()}`
          uiStore.addPane(newPaneId, currentPaneId)
          uiStore.openDocument(docId, newPaneId)
        } else {
          // Regular click: Open in current pane
          uiStore.openDocument(docId, currentPaneId)
        }
        
        // Instantly close preview popup
        setPreviewData(null)
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      }
    }

    rootElement.addEventListener("mouseover", handleMouseEnter)
    rootElement.addEventListener("mouseout", handleMouseLeave)
    rootElement.addEventListener("click", handleClick)

    return () => {
      rootElement.removeEventListener("mouseover", handleMouseEnter)
      rootElement.removeEventListener("mouseout", handleMouseLeave)
      rootElement.removeEventListener("click", handleClick)
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [editor, paneId])

  const handlePopupMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  const handlePopupMouseLeave = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setPreviewData(null)
    }, 300)
  }

  if (!previewData) return null

  return createPortal(
    <div
      ref={popupRef}
      onMouseEnter={handlePopupMouseEnter}
      onMouseLeave={handlePopupMouseLeave}
      className="absolute z-[9999] p-2"
      style={{
        top: previewData.position.top - 8, // Offset the padding gap for smooth cursor movements
        left: previewData.position.left,
      }}
    >
      <PageLinkPreviewPopup docId={previewData.docId} />
    </div>,
    document.body
  )
}

const PageLinkPreviewPopup = React.forwardRef<
  HTMLDivElement,
  {
    docId: string;
  }
>(({ docId }, ref) => {
  const doc = useDocumentStore((state) => state.documents[docId])
  const collections = useCollectionStore((state) => state.collections)
  const itemsMap = useCollectionStore((state) => state.items)

  const isCollectionItem = docId.startsWith('item-')
  const colItem = React.useMemo(() => {
    if (!isCollectionItem) return null
    for (const [colId, list] of Object.entries(itemsMap)) {
      const found = list.find(i => i.id === docId)
      if (found) {
        return { item: found, collection: collections[colId] }
      }
    }
    return null
  }, [docId, itemsMap, collections, isCollectionItem])

  if (!doc && !colItem) return null

  if (colItem) {
    const { item, collection } = colItem
    const nameField = collection.fields[0]
    const itemName = nameField ? String(item.values[nameField.id] || '') : 'Unnamed Item'
    const displayFields = collection.fields.slice(1, 4)

    return (
      <div
        ref={ref}
        className="w-[340px] bg-white dark:bg-[#1a1a1c] text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-200 ease-out mt-2"
      >
        <div 
          className="w-full h-14 shrink-0 relative flex items-center px-4" 
          style={{
            background: `linear-gradient(to right, ${collection.color}25, transparent)`
          }}
        >
          <span className="text-2xl mr-2 select-none">{collection.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{collection.name} Database</span>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <h4 className="text-sm font-bold font-sans tracking-tight text-foreground/90">
            {itemName || "Unnamed Item"}
          </h4>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/50 pt-2 text-[11px]">
            {displayFields.map(field => {
              const val = item.values[field.id]
              let displayVal = String(val || '')
              if (val === undefined || val === null || val === '') {
                displayVal = 'Empty'
              } else if (field.type === 'checkbox') {
                displayVal = val ? 'Yes' : 'No'
              } else if (field.type === 'select') {
                displayVal = field.options?.find(o => o.id === val)?.name || displayVal
              } else if (field.type === 'multi-select') {
                const sIds = Array.isArray(val) ? val : []
                displayVal = sIds.map(sid => field.options?.find(o => o.id === sid)?.name || '').filter(Boolean).join(', ')
              } else if (['document-relation', 'task-relation', 'tag-relation', 'collection-relation'].includes(field.type)) {
                displayVal = `${(Array.isArray(val) ? val : []).length} items linked`
              }
              
              return (
                <div key={field.id} className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{field.name}</span>
                  <span className="text-foreground/85 font-medium truncate mt-0.5">{displayVal || 'Empty'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const bannerStyle: React.CSSProperties = {};
  if (doc.topSectionColor) {
    bannerStyle.background = doc.topSectionColor;
  } else {
    bannerStyle.background = 'var(--background)';
  }

  const titleStyle: React.CSSProperties = {};
  if (doc.topSectionTextColor) {
    titleStyle.color = doc.topSectionTextColor;
  } else {
    titleStyle.color = 'var(--foreground)';
  }

  const editorConfig = {
    ...createEditorConfig(docId),
    editable: false,
  }

  return (
    <div
      ref={ref}
      className="w-[340px] max-h-[350px] bg-white dark:bg-[#1a1a1c] text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-all duration-200 ease-out mt-2"
    >
      {/* Banner */}
      <div className="w-full h-20 shrink-0 relative flex items-center justify-center" style={bannerStyle}>
        {doc.icon && (
          <span className="absolute -bottom-5 left-6 text-4xl select-none filter drop-shadow">
            {doc.icon}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="p-6 pt-7 flex-1 overflow-y-auto min-h-0 flex flex-col gap-2.5">
        {/* Title */}
        <h4 className="text-lg font-bold font-sans tracking-tight" style={titleStyle}>
          {doc.title || "Untitled"}
        </h4>

        {/* Read-only editor content */}
        <div className="lexical-editor-preview text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-h-[180px] overflow-y-auto pr-1">
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="lexical-root lexical-editor-root outline-none w-full text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-300 min-h-0 pointer-events-none"
                  readOnly
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <PersistencePlugin documentId={docId} />
          </LexicalComposer>
        </div>
      </div>
    </div>
  )
})
PageLinkPreviewPopup.displayName = "PageLinkPreviewPopup"
