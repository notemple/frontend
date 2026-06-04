import React, { useState, useEffect, useRef } from "react";
import {
  CalendarBlank,
  CheckSquare,
  FileText,
  Lightning,
  Microphone,
  ArrowUp,
  CaretDown,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useDocumentStore } from "@/features/documents/store";
import { useTaskStore } from "@/features/tasks/store";
import { useUiStore } from "@/shared/store/uiStore";
import { useSettingsStore } from "@/features/settings/store";
import { cn } from "@/shared/lib/utils";
import { formatInTimeZone } from "date-fns-tz";

const getCaptureIcon = (type: string, activeColor?: string) => {
  switch (type) {
    case "Note":
      return <CalendarBlank size={16} className={activeColor ? "" : "text-emerald-500"} style={activeColor ? { color: activeColor } : undefined} />;
    case "Task":
      return <CheckSquare size={16} className={activeColor ? "" : "text-sky-500"} style={activeColor ? { color: activeColor } : undefined} />;
    case "Doc":
      return <FileText size={16} className={activeColor ? "" : "text-purple-500"} style={activeColor ? { color: activeColor } : undefined} />;
    case "Link":
      return <Lightning size={16} className={activeColor ? "" : "text-amber-500"} style={activeColor ? { color: activeColor } : undefined} />;
    default:
      return null;
  }
};

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

interface QuickCaptureBoxProps {
  paneId: string;
  onCaptureAdded: (entry: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    itemId?: string;
  }) => void;
}

export const QuickCaptureBox = ({ paneId, onCaptureAdded }: QuickCaptureBoxProps) => {
  const documents = useDocumentStore((s) => s.documents) || {};
  const addDocument = useDocumentStore((s) => s.addDocument);
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const addTask = useTaskStore((s) => s.addTask);
  const openDocument = useUiStore((s) => s.openDocument);
  const timezone = useSettingsStore((s) => s.timezone);

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

  const [captureText, setCaptureText] = useState("");
  const [activeType, setActiveType] = useState<"Note" | "Task" | "Doc" | "Link" | null>(null);

  const isTutorialActive = useUiStore((s) => s.isTutorialActive);
  const tutorialIndex = useUiStore((s) => s.tutorialIndex);
  const isFirstStep = isTutorialActive && tutorialIndex === 0;

  const effectiveActiveType = activeType !== null ? activeType : (isFirstStep ? null : "Note");

  useEffect(() => {
    if (isFirstStep && !captureText.trim()) {
      setActiveType(null);
    }
  }, [captureText, isFirstStep]);

  // AI model select state
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("templnote-selected-ai-model") || "Gemini 3.5 Flash";
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("templnote-selected-ai-model", model);
    setIsModelDropdownOpen(false);
  };

  const handleSubmitCapture = async () => {
    if (!captureText.trim()) return;
    const captureId = `capture-${Date.now()}`;
    let itemId: string | undefined = undefined;

    const typeToSubmit = (isFirstStep ? "Note" : effectiveActiveType) || "Note";
    if (isFirstStep && effectiveActiveType !== "Note") return;

    if (typeToSubmit === "Note") {
      const todayDateStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
      const dailyNoteId = `daily-note-${todayDateStr}`;
      itemId = dailyNoteId;
      const existingDoc = documents[dailyNoteId];
      const captureTextTrimmed = captureText.trim();
      let newContent = "";
      if (existingDoc && existingDoc.content) {
        newContent = existingDoc.content + `<p>${captureTextTrimmed}</p>`;
      } else {
        newContent = `<p>${captureTextTrimmed}</p>`;
      }
      await updateDocument(dailyNoteId, {
        content: newContent,
        type: "page",
        updatedAt: new Date().toISOString()
      });
      openDocument(dailyNoteId, paneId);
    } else if (typeToSubmit === "Doc") {
      const newId = `doc-${crypto.randomUUID()}`;
      itemId = newId;
      await addDocument({
        id: newId,
        title: captureText.trim().substring(0, 40),
        content: `<h1>${captureText.trim()}</h1><p>Captured from Glance.</p>`,
        type: "page",
        tags: [],
        updatedAt: new Date().toISOString(),
      });
      openDocument(newId, paneId);
    } else if (typeToSubmit === "Task") {
      const newTaskId = `task-${crypto.randomUUID()}`;
      itemId = newTaskId;
      addTask({
        id: newTaskId,
        title: captureText.trim(),
        completed: false,
        status: "open",
        list: "All Tasks"
      });
    }

    const entry = {
      id: captureId,
      content: captureText.trim(),
      type: typeToSubmit,
      createdAt: new Date().toISOString(),
      itemId,
    };
    onCaptureAdded(entry);
    setCaptureText("");
  };

  const handleCaptureKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isFirstStep && effectiveActiveType !== "Note") return;
      handleSubmitCapture();
    }
  };

  const canSubmit = captureText.trim() && !(isFirstStep && effectiveActiveType !== "Note");

  return (
    <div id="onboarding-quick-capture" className="w-full max-w-3xl bg-muted/10 border border-border/60 rounded-lg p-4 flex flex-col gap-3 shadow-sm focus-within:border-border/90 focus-within:shadow-md transition-all shrink-0">
      <textarea
        value={captureText}
        onChange={(e) => setCaptureText(e.target.value)}
        onKeyDown={handleCaptureKey}
        placeholder="Capture a thought, task, or note…"
        className="w-full bg-transparent border-0 outline-none focus:ring-0 text-base placeholder-muted-foreground/40 resize-none h-16 py-1 text-foreground/90"
      />
      <div className="flex items-center justify-between border-t border-border/20 pt-3">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["Note", "Task", "Doc", "Link"] as const).map((type) => {
            const isSelected = effectiveActiveType === type;
            const isDisabled = isFirstStep && type !== "Note";
            return (
              <button
                key={type}
                type="button"
                disabled={isDisabled}
                onClick={() => setActiveType(type)}
                style={isSelected ? { color: paneHighlightSolid, borderColor: 'transparent' } : undefined}
                className={cn(
                  "relative px-3 py-1.5 rounded border flex items-center gap-2 text-sm font-medium transition-all cursor-pointer select-none overflow-hidden",
                  isSelected
                    ? "shadow-sm-sm"
                    : "border-border/50 hover:border-border/80 hover:bg-muted/20 text-foreground/70",
                  isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:border-border/50",
                  type === "Note" && isFirstStep && captureText.trim() !== "" && effectiveActiveType !== "Note" && "animate-pulse border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                )}
                id={type === "Note" ? "onboarding-quick-capture-note-pill" : undefined}
                data-selected={isSelected}
              >
                {isSelected && (
                  <div 
                    style={{ background: paneHighlightBg }} 
                    className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18] pointer-events-none" 
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {getCaptureIcon(type, isSelected ? paneHighlightSolid : undefined)}
                  <span>{type}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* AI Model Dropdown */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              type="button"
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

          {/* Mic Icon */}
          <button type="button" className="p-2 rounded hover:bg-muted/20 text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer">
            <Microphone size={17} />
          </button>

          {/* Submit Button */}
          <button
            id="onboarding-quick-capture-submit-button"
            type="button"
            onClick={handleSubmitCapture}
            disabled={!canSubmit}
            style={canSubmit ? { color: paneHighlightSolid } : undefined}
            className={cn(
              "relative p-2 rounded flex items-center justify-center transition-all cursor-pointer overflow-hidden",
              canSubmit
                ? "shadow-sm hover:opacity-90 border border-transparent"
                : "bg-muted text-muted-foreground/30 cursor-not-allowed border border-border/30"
            )}
          >
            {canSubmit && (
              <div 
                style={{ background: paneHighlightBg }} 
                className="absolute inset-0 opacity-[0.12] dark:opacity-[0.18] pointer-events-none" 
              />
            )}
            <ArrowUp size={17} weight="bold" className="relative z-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
