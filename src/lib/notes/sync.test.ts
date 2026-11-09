import { describe, expect, it } from "vitest";

import { formatReport, mapLimit, summarizeReport } from "./sync";

describe("mapLimit", () => {
  it("keeps results in input order", async () => {
    const result = await mapLimit([30, 5, 15], 2, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms * 2;
    });
    expect(result).toEqual([60, 10, 30]);
  });

  it("never runs more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    await mapLimit(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 2));
      running--;
    });
    expect(peak).toBe(3);
  });

  it("handles an empty list", async () => {
    expect(await mapLimit([], 4, async (x) => x)).toEqual([]);
  });
});

describe("formatReport", () => {
  it("summarises counts and lists each change and error", () => {
    const text = formatReport({
      added: ["a"],
      updated: ["b"],
      removed: ["c"],
      unchanged: 4,
      errors: [{ path: "scripts/x.script.md", message: "bad" }],
      commit: null,
    });
    expect(text).toContain("Added 1, updated 1, removed 1, unchanged 4.");
    expect(text).toContain("+ a");
    expect(text).toContain("~ b");
    expect(text).toContain("- c");
    expect(text).toContain("! scripts/x.script.md: bad");
  });
});

describe("summarizeReport", () => {
  const empty = { added: [], updated: [], removed: [], unchanged: 3, errors: [] };

  it("says so when nothing changed", () => {
    expect(summarizeReport(empty)).toBe("Already up to date.");
  });

  it("lists only what happened", () => {
    expect(summarizeReport({ ...empty, added: ["a"], updated: ["b", "c"] })).toBe(
      "Added 1, updated 2.",
    );
  });

  it("counts problem files", () => {
    const one = { path: "x", message: "bad" };
    expect(summarizeReport({ ...empty, errors: [one] })).toBe(
      "Already up to date. 1 file has problems.",
    );
    expect(summarizeReport({ ...empty, errors: [one, one] })).toContain("2 files have problems");
  });
});
