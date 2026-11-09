import { describe, expect, it } from "vitest";

import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("rounds to whole minutes", () => {
    expect(formatDuration(5 * 60 + 20)).toBe("5 min");
    expect(formatDuration(5 * 60 + 40)).toBe("6 min");
  });

  it("says so when it is under a minute", () => {
    expect(formatDuration(20)).toBe("under 1 min");
  });

  it("switches to hours", () => {
    expect(formatDuration(59 * 60)).toBe("59 min");
    expect(formatDuration(60 * 60)).toBe("1 h");
    expect(formatDuration(65 * 60)).toBe("1 h 5 min");
    expect(formatDuration(2 * 3600 + 30 * 60)).toBe("2 h 30 min");
  });

  it("copes with nothing", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(-5)).toBe("0 min");
    expect(formatDuration(Number.NaN)).toBe("0 min");
  });
});
