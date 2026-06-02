import { create } from 'zustand';
import { useTaskStore } from '@/features/tasks/store';
import { useDocumentStore } from '@/features/documents/store';
import { aiService } from '@/services/ai.service';

export interface CaptureItem {
  id: string;
  content: string;
  type: 'Note' | 'Task' | 'Doc' | 'Link' | 'AI';
  createdAt: string;
  targetId?: string; // Links to the created Task or Document ID
}

interface CaptureStore {
  captures: CaptureItem[];
  addCapture: (content: string, type: 'Note' | 'Task' | 'Doc' | 'Link' | 'AI') => Promise<void>;
  removeCapture: (id: string) => void;
  clearCaptures: () => void;
}

const STORAGE_KEY = 'notemple-quick-captures';

const getInitialCaptures = (): CaptureItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to parse captures", e);
  }
  
  // Seed with realistic default captures to match the designs
  const now = new Date();
  return [
    {
      id: 'seed-1',
      content: 'Call client tomorrow at 3pm',
      type: 'Task',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString()
    },
    {
      id: 'seed-2',
      content: 'Ideas for productivity onboarding',
      type: 'Note',
      createdAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString()
    },
    {
      id: 'seed-3',
      content: 'https://linear.app/changelog/2026',
      type: 'Link',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    },
    {
      id: 'seed-4',
      content: '@Web Planning add dashboard metrics',
      type: 'Note',
      createdAt: new Date(now.getTime() - 120 * 60 * 1000).toISOString()
    }
  ];
};

export const useCaptureStore = create<CaptureStore>((set, get) => {
  const initialCaptures = getInitialCaptures();

  const saveToStorage = (captures: CaptureItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captures));
  };

  return {
    captures: initialCaptures,

    addCapture: async (content, type) => {
      const id = `capture-${crypto.randomUUID()}`;
      let targetId: string | undefined = undefined;

      const trimmed = content.trim();
      if (!trimmed) return;

      // Sync capture with global stores where appropriate
      if (type === 'Task') {
        const taskId = `task-${crypto.randomUUID()}`;
        targetId = taskId;
        await useTaskStore.getState().addTask({
          id: taskId,
          title: trimmed,
          list: 'Today',
          completed: false,
          status: 'open'
        });
      } else if (type === 'Note' || type === 'Doc') {
        const docId = `doc-${crypto.randomUUID()}`;
        targetId = docId;
        await useDocumentStore.getState().addDocument({
          id: docId,
          title: trimmed.slice(0, 50) || 'Untitled Note',
          content: `<p>${trimmed}</p>`,
          type: 'page',
          tags: type === 'Note' ? ['Note'] : ['Doc'],
          updatedAt: new Date().toISOString()
        });
      } else if (type === 'Link') {
        const docId = `doc-${crypto.randomUUID()}`;
        targetId = docId;
        await useDocumentStore.getState().addDocument({
          id: docId,
          title: trimmed.slice(0, 50) || 'Bookmark Link',
          content: `<p><a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a></p>`,
          type: 'page',
          tags: ['Link'],
          updatedAt: new Date().toISOString()
        });
      } else if (type === 'AI') {
        const docId = `doc-${crypto.randomUUID()}`;
        targetId = docId;

        // Create temporary document first
        await useDocumentStore.getState().addDocument({
          id: docId,
          title: trimmed.slice(0, 50) || 'AI Prompt',
          content: `<p>Thinking...</p>`,
          type: 'page',
          tags: ['AI'],
          updatedAt: new Date().toISOString()
        });

        // Trigger AI rewrite/writing in the background
        aiService.continueWriting("", trimmed).then(async (response) => {
          if (response.success) {
            await useDocumentStore.getState().updateDocument(docId, {
              content: `<p><strong>Prompt:</strong> ${trimmed}</p><p>${response.text.replace(/\n/g, '<br/>')}</p>`,
              updatedAt: new Date().toISOString()
            });
          }
        });
      }

      const newItem: CaptureItem = {
        id,
        content: trimmed,
        type,
        createdAt: new Date().toISOString(),
        targetId
      };

      set((state) => {
        const updated = [newItem, ...state.captures];
        saveToStorage(updated);
        return { captures: updated };
      });
    },

    removeCapture: (id) => {
      set((state) => {
        const updated = state.captures.filter((c) => c.id !== id);
        saveToStorage(updated);
        return { captures: updated };
      });
    },

    clearCaptures: () => {
      set(() => {
        saveToStorage([]);
        return { captures: [] };
      });
    }
  };
});
