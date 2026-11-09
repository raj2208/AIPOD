import { describe, expect, it } from "vitest";

import { NO_RESUME, sanitizeResume } from "./resume";

describe("sanitizeResume", () => {
  it("keeps a valid position", () => {
    expect(sanitizeResume({ scriptId: "terraform-basics", index: 12 })).toEqual({
      scriptId: "terraform-basics",
      index: 12,
    });
  });

  it("falls back for anything else", () => {
    for (const junk of [null, undefined, "x", 4, [], {}, { scriptId: "a" }, { index: 1 },
      { scriptId: 5, index: 1 }, { scriptId: "a", index: -1 }, { scriptId: "a", index: 1.5 },
      { scriptId: "a", index: "3" }]) {
      expect(sanitizeResume(junk)).toEqual(NO_RESUME);
    }
  });
});
