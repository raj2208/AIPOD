import { createLocalStore } from "./storage";

export type HighlightMode = "off" | "sentence" | "word";

export type PlayerSettings = {
  /** Name of the chosen voice. Empty means the system default. */
  voiceName: string;
  rate: number;
  pitch: number;
  highlight: HighlightMode;
  autoScroll: boolean;
  /** Start the next script by itself when one ends. */
  autoPlayNext: boolean;
  /** Keep the screen on while playing. Costs battery. */
  keepScreenOn: boolean;
  /**
   * Play a silent audio loop while speaking. On Android this makes the browser
   * treat the page as playing media, which shows lock-screen controls and may
   * keep speech going with the screen off. Experimental.
   */
  backgroundAudio: boolean;
};

export const SPEED_PRESETS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export const DEFAULT_SETTINGS: PlayerSettings = {
  voiceName: "",
  rate: 1,
  pitch: 1,
  highlight: "word",
  autoScroll: true,
  autoPlayNext: true,
  keepScreenOn: false,
  backgroundAudio: true,
};

function number(raw: unknown, fallback: number, min: number, max: number) {
  return typeof raw === "number" && Number.isFinite(raw)
    ? Math.min(max, Math.max(min, raw))
    : fallback;
}

function bool(raw: unknown, fallback: boolean) {
  return typeof raw === "boolean" ? raw : fallback;
}

export function sanitizeSettings(raw: unknown): PlayerSettings {
  const d = DEFAULT_SETTINGS;
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Record<string, unknown>;
  return {
    voiceName: typeof r.voiceName === "string" ? r.voiceName : d.voiceName,
    rate: number(r.rate, d.rate, 0.5, 4),
    pitch: number(r.pitch, d.pitch, 0.5, 2),
    highlight:
      r.highlight === "off" || r.highlight === "sentence" || r.highlight === "word"
        ? r.highlight
        : d.highlight,
    autoScroll: bool(r.autoScroll, d.autoScroll),
    autoPlayNext: bool(r.autoPlayNext, d.autoPlayNext),
    keepScreenOn: bool(r.keepScreenOn, d.keepScreenOn),
    backgroundAudio: bool(r.backgroundAudio, d.backgroundAudio),
  };
}

export const settingsStore = createLocalStore(
  "aipod.player.settings.v1",
  DEFAULT_SETTINGS,
  sanitizeSettings,
);

export type SavedProgress = { index: number };

export function sanitizeProgress(raw: unknown): SavedProgress {
  const index =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).index
      : 0;
  return {
    index:
      typeof index === "number" && Number.isInteger(index) && index >= 0
        ? index
        : 0,
  };
}
