import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { CaretDown, Check, Sparkle, ArrowElbowDownLeft, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/lib/utils';
import { aiService } from '@/services/ai.service';
import { useSettingsStore } from '@/features/settings/store';
import { useUiStore } from '@/shared/store/uiStore';

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

export const AiBlockView = ({ node, editor, getPos, deleteNode, extension }: any) => {
  const paneId = extension?.options?.paneId || '';
  const activePaneId = useUiStore((s) => s.activePaneId);
  const isCurrentActive = activePaneId === paneId;

  const { 
    activeHighlightType, 
    activeHighlightColor, 
    activeHighlightGradient,
    inactiveHighlightType,
    inactiveHighlightColor,
    inactiveHighlightGradient
  } = useSettingsStore();

  const paneHighlightBg = React.useMemo(() => {
    if (isCurrentActive) {
      return activeHighlightType === 'gradient' ? activeHighlightGradient : activeHighlightColor;
    } else {
      const bg = inactiveHighlightType === 'gradient' ? inactiveHighlightGradient : inactiveHighlightColor;
      return bg && bg !== 'none' && bg !== 'transparent' ? bg : activeHighlightColor;
    }
  }, [
    isCurrentActive, 
    activeHighlightType, 
    activeHighlightColor, 
    activeHighlightGradient,
    inactiveHighlightType,
    inactiveHighlightColor,
    inactiveHighlightGradient
  ]);

  const paneHighlightSolid = React.useMemo(() => {
    if (isCurrentActive) {
      return activeHighlightColor;
    } else {
      return inactiveHighlightColor && inactiveHighlightColor !== 'transparent' ? inactiveHighlightColor : activeHighlightColor;
    }
  }, [isCurrentActive, activeHighlightColor, inactiveHighlightColor]);

  const borderStyle = React.useMemo(() => {
    if (paneHighlightBg && (paneHighlightBg.includes('gradient') || paneHighlightBg.includes('linear-gradient'))) {
      return {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'transparent',
        backgroundImage: `linear-gradient(var(--card-bg), var(--card-bg)), ${paneHighlightBg}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      };
    } else {
      return {
        borderColor: paneHighlightSolid,
      };
    }
  }, [paneHighlightBg, paneHighlightSolid]);

  const [promptText, setPromptText] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("templnote-selected-ai-model") || "Gemini 3.5 Flash";
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Autofocus the input when created
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("templnote-selected-ai-model", model);
    setIsModelDropdownOpen(false);
  };

  const handleCancel = () => {
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).insertContentAt(pos, { type: 'paragraph' }).run();
    } else {
      deleteNode();
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    try {
      const res = await aiService.rewrite(promptText);
      if (res.success && res.text) {
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + node.nodeSize })
            .insertContentAt(pos, `<p>${res.text}</p>`)
            .run();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Backspace' && !promptText) {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <NodeViewWrapper id="onboarding-ai-block" className="w-full my-1.5 font-sans select-none pointer-events-auto">
      <div 
        style={borderStyle}
        className="w-full max-w-[560px] bg-card border rounded-md px-3 py-1.5 flex items-center gap-2 shadow-sm-sm transition-all"
      >
        
        <input
          ref={textareaRef}
          id="onboarding-ai-input"
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to write, brainstorm, outline..."
          disabled={loading}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs placeholder:text-muted-foreground/45 py-0 text-foreground/90 disabled:opacity-50 font-sans"
        />

        {/* AI Model Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 bg-muted/10 hover:bg-muted/20 text-[9px] font-semibold text-muted-foreground/75 hover:text-foreground transition-all cursor-pointer select-none disabled:opacity-50"
            title="Select AI Model"
          >
            <span>{selectedModel}</span>
            <CaretDown size={8} className="text-muted-foreground/50" />
          </button>

          <AnimatePresence>
            {isModelDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 bottom-full mb-1.5 w-40 bg-card border border-border rounded shadow-lg py-1 z-50 text-[10px] max-h-60 overflow-y-auto no-scrollbar font-sans"
              >
                {MODEL_GROUPS.map((group) => (
                  <div key={group.provider} className="flex flex-col">
                    <div className="px-2 py-0.5 text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider border-b border-border/10 mb-1 font-mono">
                      {group.provider}
                    </div>
                    {group.models.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => handleSelectModel(model)}
                        className={cn(
                          "w-full px-2 py-1 text-left flex items-center justify-between hover:bg-muted/50 transition-all font-medium cursor-pointer",
                          selectedModel === model ? "text-purple-500 font-semibold" : "text-foreground/80"
                        )}
                      >
                        <span>{model}</span>
                        {selectedModel === model && <Check size={10} className="text-purple-500" />}
                      </button>
                    ))}
                    <div className="h-0.5" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enter Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !promptText.trim()}
          style={(!loading && promptText.trim()) ? { background: paneHighlightBg } : undefined}
          className={cn(
            "p-1 text-white rounded transition-all cursor-pointer flex items-center justify-center shadow-sm-sm disabled:cursor-not-allowed shrink-0",
            (!loading && promptText.trim())
              ? "hover:opacity-90"
              : "bg-muted text-muted-foreground/30 border border-border/30"
          )}
          title="Generate"
        >
          {loading ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowElbowDownLeft size={11} weight="bold" />
          )}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="text-muted-foreground/60 hover:text-foreground hover:bg-muted p-0.5 rounded transition-all cursor-pointer shrink-0"
          title="Cancel"
        >
          <X size={11} weight="bold" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};
export default AiBlockView;
