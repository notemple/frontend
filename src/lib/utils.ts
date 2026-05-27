import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CARD_COLORS = [
  { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.30)", text: "text-rose-800 dark:text-rose-300", iconBg: "rgba(244,63,94,0.18)", iconBorder: "rgba(244,63,94,0.36)", iconText: "text-rose-800 dark:text-rose-400" },
  { bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.32)", text: "text-amber-900 dark:text-amber-300", iconBg: "rgba(245,158,11,0.20)", iconBorder: "rgba(245,158,11,0.38)", iconText: "text-amber-900 dark:text-amber-400" },
  { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.30)", text: "text-emerald-800 dark:text-emerald-300", iconBg: "rgba(16,185,129,0.18)", iconBorder: "rgba(16,185,129,0.36)", iconText: "text-emerald-800 dark:text-emerald-400" },
  { bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.30)", text: "text-sky-800 dark:text-sky-300", iconBg: "rgba(14,165,233,0.18)", iconBorder: "rgba(14,165,233,0.36)", iconText: "text-sky-800 dark:text-sky-400" },
  { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.30)", text: "text-purple-800 dark:text-purple-300", iconBg: "rgba(139,92,246,0.18)", iconBorder: "rgba(139,92,246,0.36)", iconText: "text-purple-800 dark:text-purple-400" },
  { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.30)", text: "text-pink-800 dark:text-pink-300", iconBg: "rgba(236,72,153,0.18)", iconBorder: "rgba(236,72,153,0.36)", iconText: "text-pink-800 dark:text-pink-400" }
];

export function getItemColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}
