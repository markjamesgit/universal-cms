/** Abstract avatar presets — no real-person stock photos */

export interface AvatarPreset {
  id: string;
  label: string;
  url: string;
}

function svgAvatar(bg: string, symbol: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="60" fill="${bg}"/>
    <text x="60" y="68" text-anchor="middle" fill="#ffffff" font-size="42" font-family="system-ui,sans-serif">${symbol}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "indigo", label: "Indigo", url: svgAvatar("#6366f1", "◆") },
  { id: "emerald", label: "Emerald", url: svgAvatar("#10b981", "●") },
  { id: "rose", label: "Rose", url: svgAvatar("#ec4899", "✦") },
  { id: "amber", label: "Amber", url: svgAvatar("#f59e0b", "▲") },
  { id: "sky", label: "Sky", url: svgAvatar("#38bdf8", "◇") },
  { id: "violet", label: "Violet", url: svgAvatar("#8b5cf6", "○") },
];

export const DEFAULT_AVATAR_URL = AVATAR_PRESETS[0].url;
