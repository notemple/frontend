import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TAG_COLOR_PRESETS } from "../constants/colors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CARD_COLORS = [
  { bg: "rgba(224,108,129,0.09)", border: "rgba(224,108,129,0.24)", text: "text-rose-800 dark:text-rose-300", iconBg: "rgba(224,108,129,0.14)", iconBorder: "rgba(224,108,129,0.30)", iconText: "text-rose-800 dark:text-rose-400" },
  { bg: "rgba(217,143,62,0.10)", border: "rgba(217,143,62,0.26)", text: "text-amber-900 dark:text-amber-300", iconBg: "rgba(217,143,62,0.16)", iconBorder: "rgba(217,143,62,0.32)", iconText: "text-amber-900 dark:text-amber-400" },
  { bg: "rgba(107,171,144,0.09)", border: "rgba(107,171,144,0.24)", text: "text-emerald-800 dark:text-emerald-300", iconBg: "rgba(107,171,144,0.14)", iconBorder: "rgba(107,171,144,0.30)", iconText: "text-emerald-800 dark:text-emerald-400" },
  { bg: "rgba(119,165,189,0.09)", border: "rgba(119,165,189,0.24)", text: "text-sky-800 dark:text-sky-300", iconBg: "rgba(119,165,189,0.14)", iconBorder: "rgba(119,165,189,0.30)", iconText: "text-sky-800 dark:text-sky-400" },
  { bg: "rgba(149,127,189,0.09)", border: "rgba(149,127,189,0.24)", text: "text-purple-800 dark:text-purple-300", iconBg: "rgba(149,127,189,0.14)", iconBorder: "rgba(149,127,189,0.30)", iconText: "text-purple-800 dark:text-purple-400" },
  { bg: "rgba(209,121,164,0.09)", border: "rgba(209,121,164,0.24)", text: "text-pink-800 dark:text-pink-300", iconBg: "rgba(209,121,164,0.14)", iconBorder: "rgba(209,121,164,0.30)", iconText: "text-pink-800 dark:text-pink-400" }
];

export function getItemColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}



export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 };
}

export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function getTagStyle(tag: string, tagColors?: Record<string, string>) {
  let hex = tagColors?.[tag];
  if (!hex) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    hex = TAG_COLOR_PRESETS[Math.abs(hash) % TAG_COLOR_PRESETS.length].hex;
  }

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    '--tag-bg-light': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.12)`,
    '--tag-border-light': `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.32)`,
    '--tag-text-light': `hsla(${hsl.h}, ${hsl.s}%, 30%, 1)`,

    '--tag-bg-dark': `hsla(${hsl.h}, ${hsl.s}%, 60%, 0.14)`,
    '--tag-border-dark': `hsla(${hsl.h}, ${hsl.s}%, 60%, 0.35)`,
    '--tag-text-dark': `hsla(${hsl.h}, ${hsl.s}%, 75%, 1)`,
  } as React.CSSProperties;
}

export function getTagHexColor(tag: string, tagColors?: Record<string, string>) {
  let hex = tagColors?.[tag];
  if (!hex) {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    hex = TAG_COLOR_PRESETS[Math.abs(hash) % TAG_COLOR_PRESETS.length].hex;
  }
  return hex;
}

/**
 * Returns CSS custom-property overrides for a folder's card and icon colours.
 * Falls back to the same CARD_COLORS palette when no custom colour is set.
 */
export function getFolderStyle(
  folderId: string,
  folderColors?: Record<string, string>,
  folderName?: string
) {
  const hex = folderColors?.[folderId];
  if (!hex) return null; // signal "use default hash colour"

  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    bg:          `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.10)`,
    border:      `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.26)`,
    iconBg:      `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.16)`,
    iconBorder:  `hsla(${hsl.h}, ${hsl.s}%, 55%, 0.32)`,
    // For icon/text we embed the light/dark variant as CSS custom props
    '--folder-text-light':  `hsla(${hsl.h}, ${hsl.s}%, 28%, 1)`,
    '--folder-text-dark':   `hsla(${hsl.h}, ${hsl.s}%, 75%, 1)`,
  };
}

export function getFolderHexColor(
  folderId: string,
  folderColors?: Record<string, string>
): string | null {
  return folderColors?.[folderId] ?? null;
}
