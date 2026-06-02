import React, { useState, useEffect } from "react";
import { FocusTimeline } from "./components/FocusTimeline";
import { RecentDocuments } from "./components/RecentDocuments";
import { RecentCapturesList } from "./components/RecentCapturesList";
import { GlanceGreeting } from "./components/GlanceGreeting";
import { QuickCaptureBox } from "./components/QuickCaptureBox";
import { DailyActivitySummary } from "./components/DailyActivitySummary";
import { GlanceTasksSection } from "./components/GlanceTasksSection";

export const GlancePage = ({ paneId }: { paneId: string }) => {
  const [captures, setCaptures] = useState<{
    id: string;
    content: string;
    type: string;
    createdAt: string;
    itemId?: string;
  }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("glance-captures");
      if (saved) setCaptures(JSON.parse(saved));
    } catch (_) {}
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

  return (
    <div className="h-full w-full flex gap-0 overflow-hidden bg-background font-sans text-foreground select-none">
      {/* ── LEFT COLUMN: Time Bar Graph + Recent Docs ── */}
      <div className="w-96 flex-shrink-0 border-r border-border/50 flex flex-col gap-0 overflow-hidden">
        <FocusTimeline />
        <div className="h-px bg-border/40 shrink-0 mx-5" />
        <RecentDocuments paneId={paneId} />
        <RecentCapturesList
          paneId={paneId}
          captures={captures}
          onRemoveCapture={handleRemoveCapture}
        />
      </div>

      {/* ── CENTER COLUMN: Greeting + Quick Capture ── */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-10 overflow-y-auto no-scrollbar">
        <GlanceGreeting />
        <QuickCaptureBox paneId={paneId} onCaptureAdded={handleCaptureAdded} />
        <DailyActivitySummary />
      </div>

      {/* ── RIGHT COLUMN: Completed + Incomplete + Upcoming Tasks ── */}
      <div className="w-96 flex-shrink-0 border-l border-border/50 flex flex-col overflow-hidden">
        <GlanceTasksSection />
      </div>
    </div>
  );
};
