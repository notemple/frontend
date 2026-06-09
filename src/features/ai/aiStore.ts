import { create } from 'zustand';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const RESPONSE_AGENDA = `### 📅 Product Sync Meeting Agenda
**Date:** June 8, 2026 | **Time:** 10:00 AM EST

#### 🎯 Objectives
- Review Q2 roadmap milestones and feature completion status.
- Align engineering, product, and design on beta testing rollout.
- Resolve blocking issues for the mobile offline synchronization.

#### 📑 Agenda Items
1. **Product Update & Goals** (10 mins) — *Led by Sarah*
   - Recap of user feedback from onboarding tests.
   - Highlight of main priority: Font Family selections in workspace style.
2. **Engineering Sync & Roadblocks** (20 mins) — *Led by Alex*
   - DB scaling for real-time document search logs.
   - Verification of page link preview caching behavior.
3. **Design Walkthrough** (15 mins) — *Led by Marcus*
   - Presentation of the new "Ask AI" dashboard and feedback system.
4. **Open Q&A & Action Items** (15 mins)

#### 🚀 Next Steps
- [ ] Engineering to ship the Font Family selection pull request.
- [ ] Design team to deliver mobile layout specifications.`;

export const RESPONSE_ANALYZE = `### 🔍 Document Analysis Report

I have analyzed the provided document structure and extracted the core metadata and key findings.

#### 📊 Document Summary Table
| Property | Value | Notes |
| :--- | :--- | :--- |
| **Document Type** | Financial Forecast Report | Q3 Fiscal Review |
| **File Size** | 2.4 MB (PDF Format) | Caching active |
| **Confidence Score** | 98.6% accuracy | OCR verified |

#### 💡 Key Takeaways
- **Revenue Growth:** The project shows a **14.2% quarter-over-quarter growth**, driven by templates customization.
- **Resource Allocation:** Developer onboarding tasks took **30% less time** after introducing the interactive onboarding widget.
- **Recommendations:** Focus expansion on customizable backdrops and gradients to increase premium engagement.`;

export const RESPONSE_TRACKER = `### 📋 Custom Task Tracker Created!

I have prepared a task board with lists categorized by priority and completion status.

#### 🔴 Urgent Priority
- [ ] **Fix page link duplications** — *LEXICAL-102* (Assigned to: Alex)
- [ ] **Test font selector in Right Sidebar** — *THEME-03* (Assigned to: Marcus)

#### 🟡 Medium Priority
- [ ] **Implement Ask AI chat simulation interface** — *AI-01* (Assigned to: AI Assistant)
- [ ] **Configure midnight reset for Focus Timer** — *TIME-09* (Assigned to: Sarah)

#### 🟢 Completed
- [x] **Setup Outfit, Crimson Text and Fira Code fonts in CSS theme** — *THEME-01*
- [x] **Deploy beta staging server** — *INFRA-02*`;

export const RESPONSE_NOTION = `### ✍️ Notion Editor Typography Guide

Notion uses a carefully curated set of fonts for its clean, minimal aesthetic:

- **Sans-Serif (Default):** Notion defaults to a sans-serif stack consisting of \`Inter\`, system font fallbacks (\`Segoe UI\`, \`-apple-system\`, \`BlinkMacSystemFont\`), and generic \`sans-serif\`. This is used for ultimate readability and a modern, neutral look.
- **Serif:** For a more literary or structured look, Notion uses a serif stack centered around \`Lyon-Text\` or fallback serif fonts like \`Georgia\` and \`Times New Roman\`.
- **Mono:** For code snippets, math formulas, and tabular data, Notion uses a monospaced font stack featuring \`SFMono-Regular\`, \`Consolas\`, \`Liberation Mono\`, and \`monospace\`.

#### 💡 How to map this in templ:
In templ, we have successfully mapped these styles under the Style Tab in the Right Sidebar:
- **Sans** -> Outfit (\`var(--font-sans)\`)
- **Serif** -> Crimson Text (\`var(--font-serif)\`)
- **Mono** -> Fira Code (\`var(--font-mono)\`)`;

export const RESPONSE_GENERIC = (query: string) => `### 🤖 AI Assistant Response

I've received your query: "**${query}**"

As an AI assistant integrated with templ, I can help you:
- **Write and format** meeting agendas, essays, or notes.
- **Create task lists** and track priorities.
- **Explain concepts** like editor typography and styles.
- **Organize templates** and customize gradients.

Let me know how you'd like to proceed!`;

interface AiState {
  messages: Message[];
  input: string;
  isThinking: boolean;
  isTyping: boolean;
  currentTypingText: string;
  isMinimizedOpen: boolean;
  selectedModel: string;
  typingIntervalId: any | null;
  setInput: (input: string) => void;
  setIsMinimizedOpen: (open: boolean) => void;
  setSelectedModel: (model: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  clearHistory: () => void;
  handleSendQuery: (queryText: string) => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  messages: [],
  input: '',
  isThinking: false,
  isTyping: false,
  currentTypingText: '',
  isMinimizedOpen: false,
  selectedModel: localStorage.getItem("templnote-selected-ai-model") || "Gemini 3.5 Flash",
  typingIntervalId: null,

  setInput: (input) => set({ input }),
  setIsMinimizedOpen: (isMinimizedOpen) => set({ isMinimizedOpen }),
  setSelectedModel: (selectedModel) => {
    localStorage.setItem("templnote-selected-ai-model", selectedModel);
    set({ selectedModel });
  },
  setMessages: (messagesOrFn) => {
    if (typeof messagesOrFn === 'function') {
      set((state) => ({ messages: messagesOrFn(state.messages) }));
    } else {
      set({ messages: messagesOrFn });
    }
  },
  clearHistory: () => {
    const { typingIntervalId } = get();
    if (typingIntervalId) {
      clearInterval(typingIntervalId);
    }
    set({
      messages: [],
      input: '',
      isThinking: false,
      isTyping: false,
      currentTypingText: '',
      typingIntervalId: null
    });
  },
  handleSendQuery: (queryText) => {
    const { isThinking, isTyping, messages, typingIntervalId } = get();
    if (!queryText.trim() || isThinking || isTyping) return;

    if (typingIntervalId) {
      clearInterval(typingIntervalId);
    }

    // Add user query
    set({
      messages: [...messages, { sender: 'user', text: queryText }],
      input: '',
      isThinking: true,
      currentTypingText: '',
      typingIntervalId: null
    });

    let fullResponse = '';
    const queryLower = queryText.toLowerCase().trim();
    if (queryLower.includes('agenda') || queryLower.includes('meeting')) {
      fullResponse = RESPONSE_AGENDA;
    } else if (queryLower.includes('pdf') || queryLower.includes('image') || queryLower.includes('analyze')) {
      fullResponse = RESPONSE_ANALYZE;
    } else if (queryLower.includes('task') || queryLower.includes('tracker')) {
      fullResponse = RESPONSE_TRACKER;
    } else if (queryLower.includes('notion') || queryLower.includes('font')) {
      fullResponse = RESPONSE_NOTION;
    } else {
      fullResponse = RESPONSE_GENERIC(queryText);
    }

    setTimeout(() => {
      set({ isThinking: false, isTyping: true });
      let index = 0;
      
      const interval = setInterval(() => {
        const state = get();
        if (index < fullResponse.length) {
          const chunk = fullResponse.slice(index, index + 5);
          set({ currentTypingText: state.currentTypingText + chunk });
          index += 5;
        } else {
          clearInterval(interval);
          set({
            messages: [...state.messages, { sender: 'ai', text: fullResponse }],
            isTyping: false,
            currentTypingText: '',
            typingIntervalId: null
          });
        }
      }, 15);

      set({ typingIntervalId: interval });
    }, 1100);
  }
}));
