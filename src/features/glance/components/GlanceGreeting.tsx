import React from "react";
import { useSettingsStore } from "@/features/settings/store";
import { formatInTimeZone } from "date-fns-tz";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good morning", emoji: "🌅" };
  if (h >= 12 && h < 17) return { text: "Good afternoon", emoji: "☀️" };
  if (h >= 17 && h < 22) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌌" };
};

export const GlanceGreeting = () => {
  const timezone = useSettingsStore((s) => s.timezone);
  const userName = useSettingsStore((s) => s.userName);
  const greeting = getGreeting();

  return (
    <div className="absolute top-16 text-center shrink-0">
      <h1 className="text-3xl font-bold tracking-tight text-foreground/90">
        {greeting.text}{userName ? `, ${userName}` : ""} {greeting.emoji}
      </h1>
      <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mt-1">
        {formatInTimeZone(new Date(), timezone, "EEEE, MMMM d, yyyy")}
      </p>
    </div>
  );
};
