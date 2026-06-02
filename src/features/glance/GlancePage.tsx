import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { FocusTimeline } from "./components/FocusTimeline";
import { RecentDocuments } from "./components/RecentDocuments";
import { RecentCapturesList } from "./components/RecentCapturesList";
import { GlanceGreeting } from "./components/GlanceGreeting";
import { QuickCaptureBox } from "./components/QuickCaptureBox";
import { DailyActivitySummary } from "./components/DailyActivitySummary";
import { GlanceTasksSection } from "./components/GlanceTasksSection";

export const GlancePage = ({ paneId }: { paneId: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  const [captures, setCaptures] = useState<{
    id: string;
    content: string;
    type: string;
    createdAt: string;
    itemId?: string;
  }[]>([]);

  const [isLeftOverlaid, setIsLeftOverlaid] = useState(false);
  const [isRightOverlaid, setIsRightOverlaid] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glance-captures");
      if (saved) setCaptures(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const saveCaptures = (list: typeof captures) => {
    setCaptures(list);
    localStorage.setItem("glance-captures", JSON.stringify(list));
  };

  const handleCaptureAdded = (entry: typeof captures[0]) => {
    saveCaptures([entry, ...captures]);
  };

  const handleRemoveCapture = (id: string) => {
    saveCaptures(captures.filter((c) => c.id !== id));
  };

  const showLeftColumn = containerWidth >= 1150;
  const showRightColumn = containerWidth >= 950;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Trigger hover overlay for left column
    if (!showLeftColumn) {
      if (x <= 40) {
        setIsLeftOverlaid(true);
      } else if (x > 384) {
        setIsLeftOverlaid(false);
      }
    }

    // Trigger hover overlay for right column
    if (!showRightColumn) {
      const rightBoundary = containerWidth - 40;
      const rightCloseBoundary = containerWidth - 384;
      if (x >= rightBoundary) {
        setIsRightOverlaid(true);
      } else if (x < rightCloseBoundary) {
        setIsRightOverlaid(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsLeftOverlaid(false);
    setIsRightOverlaid(false);
  };

  const renderLeftColumn = () => {
    const isLeftOpen = showLeftColumn || isLeftOverlaid;
    const overlayClass = !showLeftColumn
      ? "absolute left-0 top-0 bottom-0 z-40 bg-background shadow-2xl"
      : "relative";
    const borderClass = isLeftOpen ? "border-r border-border/50" : "border-r-0 border-transparent";

    return (
      <motion.div
        className={`flex-shrink-0 flex flex-col gap-0 overflow-hidden ${overlayClass} ${borderClass}`}
        animate={{
          width: isLeftOpen ? 384 : 0,
          opacity: isLeftOpen ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 26,
          mass: 0.8
        }}
        style={{
          pointerEvents: isLeftOpen ? "auto" : "none"
        }}
      >
        <FocusTimeline />
        <div className="h-px bg-border/40 shrink-0 mx-5" />
        <RecentDocuments paneId={paneId} />
        <RecentCapturesList
          paneId={paneId}
          captures={captures}
          onRemoveCapture={handleRemoveCapture}
        />
      </motion.div>
    );
  };

  const renderRightColumn = () => {
    const isRightOpen = showRightColumn || isRightOverlaid;
    const overlayClass = !showRightColumn
      ? "absolute right-0 top-0 bottom-0 z-40 bg-background shadow-2xl"
      : "relative";
    const borderClass = isRightOpen ? "border-l border-border/50" : "border-l-0 border-transparent";

    return (
      <motion.div
        className={`flex-shrink-0 flex flex-col overflow-hidden ${overlayClass} ${borderClass}`}
        animate={{
          width: isRightOpen ? 384 : 0,
          opacity: isRightOpen ? 1 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 26,
          mass: 0.8
        }}
        style={{
          pointerEvents: isRightOpen ? "auto" : "none"
        }}
      >
        <GlanceTasksSection />
      </motion.div>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full w-full flex gap-0 overflow-hidden bg-background font-sans text-foreground select-none relative"
    >
      {/* ── LEFT COLUMN ── */}
      {renderLeftColumn()}

      {/* ── CENTER COLUMN: Greeting + Quick Capture ── */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-10 overflow-y-auto no-scrollbar">
        <GlanceGreeting />
        <QuickCaptureBox paneId={paneId} onCaptureAdded={handleCaptureAdded} />
        <DailyActivitySummary />
      </div>

      {/* ── RIGHT COLUMN ── */}
      {renderRightColumn()}

      {/* Hover edge visual cues */}
      {!showLeftColumn && !isLeftOverlaid && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-teal-500/20 to-transparent pointer-events-none hover:from-teal-500/40 transition-all duration-300" />
      )}
      {!showRightColumn && !isRightOverlaid && (
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-l from-teal-500/20 to-transparent pointer-events-none hover:from-teal-500/40 transition-all duration-300" />
      )}
    </div>
  );
};
