import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  SPEED_CYCLE,
  SPEED_PRESETS,
  formatSpeed,
  nextSpeed,
  sanitizeSettings,
} from "./settings";

describe("nextSpeed", () => {
  it("steps up from normal speed", () => {
    expect(nextSpeed(1)).toBe(1.25);
    expect(nextSpeed(1.25)).toBe(1.5);
  });

  it("goes to the slowest speed after the fastest, then back to normal", () => {
    expect(nextSpeed(3)).toBe(0.75);
    expect(nextSpeed(0.75)).toBe(1);
  });

  it("returns to the start from a speed that is not a preset", () => {
    expect(nextSpeed(1.1)).toBe(SPEED_CYCLE[0]);
  });

  it("cycles through exactly the speeds the picker offers", () => {
    expect([...SPEED_CYCLE].sort((a, b) => a - b)).toEqual(SPEED_PRESETS);
  });
});

describe("formatSpeed", () => {
  it("writes speeds the way people say them", () => {
    expect(formatSpeed(1)).toBe("1x");
    expect(formatSpeed(1.25)).toBe("1.25x");
    expect(formatSpeed(2.5)).toBe("2.5x");
    expect(formatSpeed(0.75)).toBe("0.75x");
  });
});

describe("sanitizeSettings", () => {
  it("falls back to the defaults for junk", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("x")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps good values and clamps wild ones", () => {
    const result = sanitizeSettings({ rate: 99, pitch: 1.5, highlight: "off" });
    expect(result.rate).toBe(4);
    expect(result.pitch).toBe(1.5);
    expect(result.highlight).toBe("off");
  });
});
