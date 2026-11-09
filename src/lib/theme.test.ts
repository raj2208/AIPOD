import { describe, expect, it } from "vitest";

import {
  THEME_INIT_SCRIPT,
  THEME_KEY,
  resolveTheme,
  sanitizeTheme,
} from "./theme";

describe("sanitizeTheme", () => {
  it("keeps the three choices", () => {
    for (const choice of ["system", "light", "dark"] as const) {
      expect(sanitizeTheme(choice)).toBe(choice);
    }
  });

  it("falls back to following the phone", () => {
    for (const junk of [null, undefined, "", "blue", 1, {}]) {
      expect(sanitizeTheme(junk)).toBe("system");
    }
  });
});

describe("resolveTheme", () => {
  it("follows the phone when asked to", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("ignores the phone when a theme is chosen", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

// The pre-paint script is plain JavaScript that must agree with resolveTheme.
describe("THEME_INIT_SCRIPT", () => {
  function run(stored: string | null, systemDark: boolean, storageBroken = false) {
    const classes = new Set<string>();
    const root = {
      classList: {
        toggle: (name: string, on: boolean) =>
          on ? classes.add(name) : classes.delete(name),
      },
      style: { colorScheme: "" },
    };
    const localStorage = {
      getItem: (key: string) => {
        if (storageBroken) throw new Error("blocked");
        return key === THEME_KEY ? stored : null;
      },
    };
    const window = { matchMedia: () => ({ matches: systemDark }) };
    new Function("localStorage", "window", "document", THEME_INIT_SCRIPT)(
      localStorage,
      window,
      { documentElement: root },
    );
    return { dark: classes.has("dark"), scheme: root.style.colorScheme };
  }

  it("follows the phone when nothing is saved", () => {
    expect(run(null, true)).toEqual({ dark: true, scheme: "dark" });
    expect(run(null, false)).toEqual({ dark: false, scheme: "light" });
  });

  it("honours a saved choice over the phone", () => {
    expect(run('"light"', true)).toEqual({ dark: false, scheme: "light" });
    expect(run('"dark"', false)).toEqual({ dark: true, scheme: "dark" });
    expect(run('"system"', true)).toEqual({ dark: true, scheme: "dark" });
  });

  it("does not break the page when storage is blocked or holds junk", () => {
    expect(() => run(null, false, true)).not.toThrow();
    expect(() => run("{not json", true)).not.toThrow();
  });
});
