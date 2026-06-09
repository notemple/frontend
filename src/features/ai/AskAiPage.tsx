import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  SlidersHorizontal, 
  Microphone, 
  ArrowUp, 
  ChatCircle, 
  Sparkle, 
  FilePdf, 
  CheckCircle,
  X,
  Check,
  ArrowCounterClockwise,
  Paperclip,
  CaretDown
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/lib/utils';
import { TnLogo } from '@/shared/ui/TnLogo';
import { useAiStore, type Message } from './aiStore';

// ── Types ──────────────────────────────────────────────────────────────────

// ── AI Model Presets (matching QuickCaptureBox) ─────────────────────────────

const MODEL_GROUPS = [
  {
    provider: "Gemini",
    models: ["Gemini 3.5 Flash", "Gemini 3.5 Pro", "Gemini 3.1 Pro"]
  },
  {
    provider: "Claude",
    models: ["Claude 4.8 Opus", "Claude 4.7 Opus", "Claude 4.6 Sonnet"]
  },
  {
    provider: "GPT (OpenAI)",
    models: ["GPT-5.5", "GPT-5.4", "GPT-5.2"]
  }
];

// ── Simulated AI Responses ──────────────────────────────────────────────────

const RESPONSE_AGENDA = `### 📅 Product Sync Meeting Agenda
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

const RESPONSE_ANALYZE = `### 🔍 Document Analysis Report

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

const RESPONSE_TRACKER = `### 📋 Custom Task Tracker Created!

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

const RESPONSE_NOTION = `### ✍️ Notion Editor Typography Guide

Notion uses a carefully curated set of fonts for its clean, minimal aesthetic:

- **Sans-Serif (Default):** Notion defaults to a sans-serif stack consisting of \`Inter\`, system font fallbacks (\`Segoe UI\`, \`-apple-system\`, \`BlinkMacSystemFont\`), and generic \`sans-serif\`. This is used for ultimate readability and a modern, neutral look.
- **Serif:** For a more literary or structured look, Notion uses a serif stack centered around \`Lyon-Text\` or fallback serif fonts like \`Georgia\` and \`Times New Roman\`.
- **Mono:** For code snippets, math formulas, and tabular data, Notion uses a monospaced font stack featuring \`SFMono-Regular\`, \`Consolas\`, \`Liberation Mono\`, and \`monospace\`.

#### 💡 How to map this in templ:
In templ, we have successfully mapped these styles under the Style Tab in the Right Sidebar:
- **Sans** -> Outfit (\`var(--font-sans)\`)
- **Serif** -> Crimson Text (\`var(--font-serif)\`)
- **Mono** -> Fira Code (\`var(--font-mono)\`)`;

const RESPONSE_GENERIC = (query: string) => `### 🤖 AI Assistant Response

I've received your query: "**${query}**"

As an AI assistant integrated with templ, I can help you:
- **Write and format** meeting agendas, essays, or notes.
- **Create task lists** and track priorities.
- **Explain concepts** like editor typography and styles.
- **Organize templates** and customize gradients.

Let me know how you'd like to proceed!`;

// ── Markdown Parser Sub-component ──────────────────────────────────────────

export const MarkdownRenderer = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const parseBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part);
  };

  const renderTable = (rows: string[][], key: string) => {
    return (
      <div key={key} className="my-3 overflow-x-auto rounded-md border border-border bg-black/10 dark:bg-white/[0.02]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
              {rows[0]?.map((cell, idx) => (
                <th key={idx} className="px-3 py-2 font-semibold">{parseBold(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rIdx) => (
              <tr key={rIdx} className="border-t border-border/40 hover:bg-muted/10 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-foreground/80 leading-normal">{parseBold(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.every(c => c.startsWith(':') || c.startsWith('-') || c.endsWith('-'))) {
        continue;
      }
      currentTable.push(cells);
    } else {
      if (currentTable.length > 0) {
        elements.push(renderTable([...currentTable], `table-${i}`));
        currentTable = [];
      }

      if (line.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-4 mb-2 flex items-center gap-2">{parseBold(line.slice(4))}</h3>);
      } else if (line.startsWith('#### ')) {
        elements.push(<h4 key={`h4-${i}`} className="text-[11px] font-semibold text-muted-foreground mt-3 mb-1 uppercase tracking-wider">{parseBold(line.slice(5))}</h4>);
      } else if (line.startsWith('- [ ] ')) {
        elements.push(
          <div key={`todo-${i}`} className="flex items-center gap-2 py-0.5 text-xs text-foreground/85">
            <div className="w-3.5 h-3.5 rounded border border-border flex items-center justify-center bg-black/5 dark:bg-white/5 shrink-0" />
            <span>{parseBold(line.slice(6))}</span>
          </div>
        );
      } else if (line.startsWith('- [x] ')) {
        elements.push(
          <div key={`todo-${i}`} className="flex items-center gap-2 py-0.5 text-xs text-foreground/60 line-through">
            <div className="w-3.5 h-3.5 rounded border border-purple-500 bg-purple-500/10 flex items-center justify-center shrink-0">
              <Check size={9} className="text-purple-500 font-bold" />
            </div>
            <span>{parseBold(line.slice(6))}</span>
          </div>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <div key={`li-${i}`} className="flex items-start gap-2 py-0.5 pl-2 text-xs text-foreground/85">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80 mt-1.5 shrink-0" />
            <span>{parseBold(line.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.*)/);
        if (match) {
          elements.push(
            <div key={`ol-${i}`} className="flex items-start gap-2 py-0.5 pl-1 text-xs text-foreground/85">
              <span className="font-mono text-purple-500/90 text-[10px] font-semibold mt-0.5 shrink-0 w-4.5 text-right">{match[1]}.</span>
              <span>{parseBold(match[2])}</span>
            </div>
          );
        }
      } else if (line.trim() === '') {
        elements.push(<div key={`space-${i}`} className="h-1.5" />);
      } else {
        elements.push(<p key={`p-${i}`} className="text-xs text-foreground/85 leading-relaxed py-0.5">{parseBold(line)}</p>);
      }
    }
  }

  if (currentTable.length > 0) {
    elements.push(renderTable(currentTable, `table-end`));
  }

  return <div className="space-y-0.5">{elements}</div>;
};

// ── Main Page Component ─────────────────────────────────────────────────────

export const AskAiPage = () => {
  const {
    messages,
    input,
    setInput,
    isThinking,
    isTyping,
    currentTypingText,
    selectedModel,
    setSelectedModel,
    handleSendQuery,
    clearHistory
  } = useAiStore();

  const [voicePulse, setVoicePulse] = useState(false);

  // Settings & Plus menu popovers
  const [showSettings, setShowSettings] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [creativity, setCreativity] = useState('Medium');

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, currentTypingText]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setIsModelDropdownOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(target)) {
        setShowPlusMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    setIsModelDropdownOpen(false);
  };

  const handleVoiceClick = () => {
    if (voicePulse) {
      setVoicePulse(false);
    } else {
      setVoicePulse(true);
      setInput('Listening...');
      setTimeout(() => {
        setInput('Write a meeting agenda');
        setVoicePulse(false);
      }, 1800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery(input);
    }
  };

  const canSubmit = input.trim().length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar relative w-full items-center bg-gradient-to-b from-background via-background to-muted/20 text-foreground transition-all duration-300 font-sans p-6 md:p-8">
      {/* Absolute top gradients for visual depth */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />

      {/* Floating reset button when in chat view */}
      {messages.length > 0 && (
        <button
          onClick={clearHistory}
          className="absolute top-4 right-6 flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border px-3 py-1.5 rounded-sm transition-all cursor-pointer select-none shadow-sm-sm z-20"
          title="New Chat"
        >
          <ArrowCounterClockwise size={11} />
          New Chat
        </button>
      )}

      {/* ── MAIN DASHBOARD VIEW (No Messages) ── */}
      {messages.length === 0 && (
        <div className="w-full max-w-[720px] flex flex-col items-center justify-center flex-1 py-12">
          {/* Templnote Logo */}
          <TnLogo className="w-20 h-20 mb-6 scale-105 hover:scale-110 transition-transform duration-300" />

          {/* Heading */}
          <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-foreground font-sans">
            How can I help you today?
          </h1>

          {/* Main Input Box - Styled exactly like QuickCaptureBox */}
          <div className="w-full relative z-10">
            <div className="w-full bg-muted/10 border border-border/60 rounded-lg p-4 flex flex-col gap-3 shadow-sm focus-within:border-border/90 focus-within:shadow-md transition-all shrink-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Do anything with AI..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-base placeholder-muted-foreground/40 resize-none h-16 py-1 text-foreground/90"
                autoFocus
              />

              <div className="flex items-center justify-between border-t border-border/20 pt-3">
                {/* Left side actions (Plus and settings) */}
                <div className="flex items-center gap-1.5 relative">
                  <div ref={plusMenuRef} className="relative">
                    <button
                      onClick={() => {
                        setShowPlusMenu(!showPlusMenu);
                        setShowSettings(false);
                      }}
                      className="p-2 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                      title="Add Attachment"
                    >
                      <Plus size={17} />
                    </button>

                    {/* Attachment Popover */}
                    <AnimatePresence>
                      {showPlusMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 bottom-full mb-1.5 w-40 bg-popover/95 backdrop-blur-md border border-border rounded shadow-lg py-1 z-50 text-[10px] flex flex-col gap-0.5 font-mono"
                        >
                          <button
                            onClick={() => {
                              setInput('Analyze PDF: /workspace/report.pdf');
                              setShowPlusMenu(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-muted text-foreground/80 hover:text-foreground text-left transition-colors cursor-pointer"
                          >
                            <Paperclip size={12} />
                            Upload PDF
                          </button>
                          <button
                            onClick={() => {
                              setInput('Analyze Image: screenshot.png');
                              setShowPlusMenu(false);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-muted text-foreground/80 hover:text-foreground text-left transition-colors cursor-pointer"
                          >
                            <Paperclip size={12} />
                            Upload Image
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div ref={settingsRef} className="relative">
                    <button
                      onClick={() => {
                        setShowSettings(!showSettings);
                        setShowPlusMenu(false);
                      }}
                      className="p-2 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                      title="AI Settings"
                    >
                      <SlidersHorizontal size={17} />
                    </button>

                    {/* Settings Popover */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 bottom-full mb-1.5 w-52 bg-popover/95 backdrop-blur-md border border-border rounded shadow-lg p-3 z-50 text-[10px] flex flex-col gap-2 font-mono"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground">Creativity Mode</span>
                            <div className="grid grid-cols-3 bg-muted border border-border/50 p-0.5 rounded">
                              {['Low', 'Medium', 'High'].map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => setCreativity(mode)}
                                  className={cn(
                                    "py-1 rounded text-center cursor-pointer transition-all",
                                    creativity === mode
                                      ? "bg-popover text-foreground font-bold"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2">
                  {/* AI Model Dropdown */}
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-border/80 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-all cursor-pointer select-none"
                      title="Select AI Model"
                    >
                      <span>{selectedModel}</span>
                      <CaretDown size={10} className="text-muted-foreground/60" />
                    </button>

                    <AnimatePresence>
                      {isModelDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 bottom-full mb-1.5 w-48 bg-popover/95 backdrop-blur-md border border-border rounded shadow-lg py-1.5 z-50 text-[11px] max-h-80 overflow-y-auto no-scrollbar"
                        >
                          {MODEL_GROUPS.map((group) => (
                            <div key={group.provider} className="flex flex-col">
                              <div className="px-2.5 py-1 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider border-b border-border/30 mb-1">
                                {group.provider}
                              </div>
                              {group.models.map((model) => (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() => handleSelectModel(model)}
                                  className={cn(
                                    "w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-muted/50 transition-all font-medium cursor-pointer",
                                    selectedModel === model ? "text-purple-500 font-semibold" : "text-foreground/80"
                                  )}
                                >
                                  <span>{model}</span>
                                  {selectedModel === model && <Check size={11} className="text-purple-500" />}
                                </button>
                              ))}
                              <div className="h-1.5" />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mic Button */}
                  <button 
                    onClick={handleVoiceClick}
                    type="button" 
                    className={cn(
                      "p-2 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer",
                      voicePulse && "text-purple-500 animate-pulse scale-110"
                    )}
                  >
                    <Microphone size={17} />
                  </button>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={() => handleSendQuery(input)}
                    disabled={!canSubmit}
                    style={canSubmit ? { color: '#a855f7' } : undefined}
                    className={cn(
                      "relative p-2 rounded flex items-center justify-center transition-all cursor-pointer overflow-hidden",
                      canSubmit
                        ? "shadow-sm hover:opacity-90 border border-transparent"
                        : "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/30"
                    )}
                  >
                    {canSubmit && (
                      <div 
                        style={{ background: '#a855f7' }} 
                        className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18] pointer-events-none" 
                      />
                    )}
                    <ArrowUp size={17} weight="bold" className="relative z-10" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested & Recent chats list columns */}
          <div className="w-full mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 select-none">
            {/* Column 1: Recent chats */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-1">
                Recent chats
              </span>
              <div className="flex flex-col gap-1">
                {[
                  "Analyze PDFs or images",
                  "Notion editor font"
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(item)}
                    className="flex items-center gap-3.5 py-2.5 px-3 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/35 text-left text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-all duration-200 group/item hover:translate-x-1 cursor-pointer"
                  >
                    <ChatCircle size={15} className="text-zinc-600 group-hover/item:text-zinc-400 transition-colors shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Suggested */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 pl-1">
                Suggested
              </span>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Write meeting agenda", icon: <Sparkle size={15} className="text-purple-400/80" /> },
                  { label: "Analyze PDFs or images", icon: <FilePdf size={15} className="text-red-400/80" /> },
                  { label: "Create a task tracker", icon: <CheckCircle size={15} className="text-emerald-400/80" /> }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(item.label)}
                    className="flex items-center gap-3.5 py-2.5 px-3 rounded-lg border border-transparent hover:border-zinc-800 hover:bg-zinc-900/35 text-left text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-all duration-200 group/item hover:translate-x-1 cursor-pointer"
                  >
                    <span className="shrink-0 transition-transform group-hover/item:scale-110">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT HISTORY VIEW (Messages Exist) ── */}
      {messages.length > 0 && (
        <div className="w-full max-w-[720px] flex flex-col flex-1 pb-24 pt-6">
          {/* Chat bubbles */}
          <div className="flex-1 flex flex-col gap-6">
            {messages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  key={idx}
                  className={cn(
                    "flex flex-col gap-1.5 max-w-[85%]",
                    isAi ? "self-start" : "self-end items-end"
                  )}
                >
                  {/* Sender label */}
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                    {isAi ? 'AI Assistant' : 'You'}
                  </span>

                  {/* Bubble content */}
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl border text-sm leading-relaxed shadow-sm-sm",
                      isAi
                        ? "bg-card border-border text-foreground rounded-tl-sm"
                        : "bg-purple-600/90 dark:bg-purple-950/25 border-purple-500/30 text-white dark:text-purple-300 rounded-tr-sm"
                    )}
                  >
                    {isAi ? (
                      <MarkdownRenderer text={msg.text} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Thinking Indicator */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="self-start flex flex-col gap-1.5"
              >
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                  AI is thinking
                </span>
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            {/* Simulated Typewriter output */}
            {isTyping && currentTypingText.length > 0 && (
              <div className="self-start flex flex-col gap-1.5 max-w-[85%]">
                <span className="text-[10px] font-mono font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest animate-pulse">
                  AI is writing
                </span>
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm-sm">
                  <MarkdownRenderer text={currentTypingText} />
                  {/* Blinking typing cursor */}
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-500 animate-pulse" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sticky smaller Input Box at bottom of chat view */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[720px] px-6 md:px-0 z-10">
            <div className="w-full flex flex-col rounded-lg bg-popover/95 backdrop-blur-md border border-border/60 shadow-lg focus-within:border-border/90 focus-within:shadow-md transition-all shrink-0 p-3 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask follow up..."
                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm placeholder-muted-foreground/45 resize-none h-10 py-1 pr-20 text-foreground/90 no-scrollbar"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={handleVoiceClick}
                  className={cn(
                    "p-1 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-all cursor-pointer",
                    voicePulse && "text-purple-500 animate-pulse"
                  )}
                  title="Voice input"
                >
                  <Microphone size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleSendQuery(input)}
                  disabled={!input.trim() || isThinking || isTyping}
                  style={input.trim() && !isThinking && !isTyping ? { color: '#a855f7' } : undefined}
                  className={cn(
                    "relative p-1.5 rounded flex items-center justify-center transition-all cursor-pointer overflow-hidden",
                    input.trim() && !isThinking && !isTyping
                      ? "shadow-sm hover:opacity-90 border border-transparent"
                      : "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/30"
                  )}
                >
                  {input.trim() && !isThinking && !isTyping && (
                    <div 
                      className="absolute inset-0 bg-purple-500/10 dark:bg-purple-500/20 pointer-events-none" 
                    />
                  )}
                  <ArrowUp size={15} weight="bold" className="relative z-10" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
