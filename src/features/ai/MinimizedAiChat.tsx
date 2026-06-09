import React, { useRef, useEffect } from 'react';
import { Sparkle, X, ArrowUp, ArrowsOutSimple, ArrowCounterClockwise } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useAiStore } from './aiStore';
import { MarkdownRenderer } from './AskAiPage';
import { useUiStore } from '@/shared/store/uiStore';
import { cn } from '@/shared/lib/utils';

export const MinimizedAiChat = () => {
  const {
    messages,
    input,
    setInput,
    isThinking,
    isTyping,
    currentTypingText,
    handleSendQuery,
    isMinimizedOpen,
    setIsMinimizedOpen,
    clearHistory
  } = useAiStore();

  const openDocument = useUiStore((state) => state.openDocument);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll chat to bottom
  useEffect(() => {
    if (isMinimizedOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, currentTypingText, isMinimizedOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleSendQuery(input);
      }
    }
  };

  const handleExpand = () => {
    openDocument('section-ask-ai');
    setIsMinimizedOpen(false);
  };

  if (!isMinimizedOpen) return null;

  const canSubmit = input.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed right-6 bottom-6 w-96 h-[480px] bg-popover/90 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans select-none"
      style={{
        boxShadow: '0 20px 25px -5px rgba(168, 85, 247, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Visual top border line with purple gradient */}
      <div className="h-1 w-full bg-gradient-to-right from-purple-500 via-pink-500 to-indigo-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkle size={15} weight="fill" />
          </div>
          <span className="font-bold text-sm text-foreground">Ask AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear History"
            >
              <ArrowCounterClockwise size={14} />
            </button>
          )}
          <button
            onClick={handleExpand}
            className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Expand to Full Page"
          >
            <ArrowsOutSimple size={14} />
          </button>
          <button
            onClick={() => setIsMinimizedOpen(false)}
            className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Sparkle size={28} className="text-purple-500/40 mb-2 animate-pulse" />
            <p className="text-xs text-muted-foreground font-semibold">How can I help you today?</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
              Ask questions, write outlines, or summarize text.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={idx}
                className={cn(
                  "flex flex-col gap-1 max-w-[85%]",
                  isAi ? "self-start" : "self-end items-end"
                )}
              >
                <span className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  {isAi ? 'AI' : 'You'}
                </span>
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[11px] leading-relaxed shadow-sm-sm",
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
              </div>
            );
          })
        )}

        {isThinking && (
          <div className="self-start flex flex-col gap-1">
            <span className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-wider animate-pulse">
              AI Thinking
            </span>
            <div className="bg-card border border-border px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-1.5 shadow-sm-sm">
              <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {isTyping && currentTypingText.length > 0 && (
          <div className="self-start flex flex-col gap-1 max-w-[85%]">
            <span className="text-[9px] font-mono font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider animate-pulse">
              AI Writing
            </span>
            <div className="bg-card border border-border px-3 py-2 rounded-xl rounded-tl-sm text-[11px] leading-relaxed shadow-sm-sm">
              <MarkdownRenderer text={currentTypingText} />
              <span className="inline-block w-1 h-3 ml-0.5 bg-purple-500 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border bg-muted/10">
        <div className="relative flex flex-col rounded-lg bg-popover border border-border/80 p-2 shadow-sm focus-within:border-purple-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI..."
            className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[11px] placeholder-muted-foreground/45 resize-none h-12 pr-8 no-scrollbar text-foreground"
          />
          <div className="absolute right-2 bottom-2">
            <button
              onClick={() => {
                if (canSubmit) {
                  handleSendQuery(input);
                }
              }}
              disabled={!canSubmit || isThinking || isTyping}
              className={cn(
                "p-1 rounded flex items-center justify-center transition-all cursor-pointer",
                canSubmit && !isThinking && !isTyping
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-muted text-muted-foreground/35 cursor-not-allowed"
              )}
            >
              <ArrowUp size={11} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
