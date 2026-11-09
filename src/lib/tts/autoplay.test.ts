import { describe, expect, it } from "vitest";

import {
  AUTOPLAY_WINDOW_MS,
  clearAutoplay,
  isAutoplayRequested,
  requestAutoplay,
} from "./autoplay";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("autoplay request", () => {
  it("is honoured by the script it names", () => {
    const storage = memoryStorage();
    requestAutoplay("next", 1000, storage);
    expect(isAutoplayRequested("next", 1500, storage)).toBe(true);
  });

  it("is ignored by any other script", () => {
    const storage = memoryStorage();
    requestAutoplay("next", 1000, storage);
    expect(isAutoplayRequested("other", 1500, storage)).toBe(false);
  });

  it("expires so it cannot start playback later by surprise", () => {
    const storage = memoryStorage();
    requestAutoplay("next", 1000, storage);
    expect(isAutoplayRequested("next", 1000 + AUTOPLAY_WINDOW_MS, storage)).toBe(true);
    expect(isAutoplayRequested("next", 1001 + AUTOPLAY_WINDOW_MS, storage)).toBe(false);
  });

  it("stays valid until cleared, so a page that renders twice still plays", () => {
    const storage = memoryStorage();
    requestAutoplay("next", 1000, storage);
    expect(isAutoplayRequested("next", 1100, storage)).toBe(true);
    expect(isAutoplayRequested("next", 1200, storage)).toBe(true);
    clearAutoplay(storage);
    expect(isAutoplayRequested("next", 1300, storage)).toBe(false);
  });

  it("is false when nothing was requested", () => {
    expect(isAutoplayRequested("next", 1000, memoryStorage())).toBe(false);
  });

  it("copes with junk in storage", () => {
    const storage = memoryStorage();
    storage.setItem("aipod.autoplay", "{not json");
    expect(isAutoplayRequested("next", 1000, storage)).toBe(false);
    storage.setItem("aipod.autoplay", JSON.stringify({ scriptId: "next" }));
    expect(isAutoplayRequested("next", 1000, storage)).toBe(false);
  });

  it("does nothing, without failing, when storage is unavailable", () => {
    expect(() => requestAutoplay("next", 1000, null)).not.toThrow();
    expect(isAutoplayRequested("next", 1000, null)).toBe(false);
    expect(() => clearAutoplay(null)).not.toThrow();
  });

  it("does not fail when storage throws", () => {
    const broken = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(() => requestAutoplay("next", 1000, broken)).not.toThrow();
    expect(isAutoplayRequested("next", 1000, broken)).toBe(false);
    expect(() => clearAutoplay(broken)).not.toThrow();
  });
});
