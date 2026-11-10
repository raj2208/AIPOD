import { createLocalStore } from "./tts/storage";

/**
 * Light, dark, or follow the phone. Following the phone is the default, so a
 * commuter in a dark carriage gets a dark app without asking.
 */
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "aipod.theme";

/** The colour of the browser bar and the installed app's window. */
export const THEME_COLORS = { light: "#f4f9f7", dark: "#06181a" } as const;

export function sanitizeTheme(raw: unknown): ThemeChoice {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function resolveTheme(
  choice: ThemeChoice,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (choice === "system") return systemPrefersDark ? "dark" : "light";
  return choice;
}

export const themeStore = createLocalStore<ThemeChoice>(
  THEME_KEY,
  "system",
  sanitizeTheme,
);

/** Puts the theme on the page. Safe to call as often as needed. */
export function applyTheme(choice: ThemeChoice) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = resolveTheme(choice, systemDark);
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
}

/**
 * Runs in the page head before anything is painted, so the right theme is
 * there from the first frame instead of flashing light and then switching.
 * It repeats the logic above in plain JavaScript, and is tested against it.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(THEME_KEY)});c=c?JSON.parse(c):"system";var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
