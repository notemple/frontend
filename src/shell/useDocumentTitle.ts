import { useCollectionStore } from '@/features/collections/store/collectionStore';
import { useDocumentStore } from '@/features/documents/store';
import { useUiStore } from '@/shared/store/uiStore';
import { useEffect } from 'react';

function computeTitle(activeTabId: string | null): string {
  if (!activeTabId) return 'templ';

  if (activeTabId === 'new-note') return 'Untitled - templ';

  if (activeTabId.startsWith('section-collection-')) {
    const collectionId = activeTabId.replace('section-collection-', '');
    const colState = useCollectionStore.getState();
    const name = colState.collections[collectionId]?.name || 'Collection';
    return `${name} - templ`;
  }

  if (activeTabId.startsWith('section-folder-')) {
    const folderId = activeTabId.replace('section-folder-', '');
    const docState = useDocumentStore.getState();
    const folder = docState.folders.find(f => f?.id === folderId);
    const name = folder?.name || 'Folder';
    return `${name} - templ`;
  }

  if (activeTabId.startsWith('section-')) {
    const cleanId = activeTabId.replace('section-', '');
    const label = cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
    return `${label} - templ`;
  }

  const docState = useDocumentStore.getState();
  const doc = docState.documents[activeTabId];
  if (doc) {
    return `${doc.title || 'Untitled'} - templ`;
  }

  return 'templ';
}

export function useDocumentTitle() {
  const activeTabId = useUiStore(
    state => {
      const pane = state.panes.find(p => p.id === state.activePaneId) || state.panes[0];
      return pane?.activeTabId ?? null;
    }
  );

  useEffect(() => {
    document.title = computeTitle(activeTabId);
  }, [activeTabId]);
}
