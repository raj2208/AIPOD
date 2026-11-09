import { describe, expect, it } from "vitest";

import { neighbours, orderScripts, parsePlaylist } from "./playlist";

describe("parsePlaylist", () => {
  it("reads a list of ids", () => {
    expect(parsePlaylist("- a\n- b\n- c\n")).toEqual({ ok: true, ids: ["a", "b", "c"] });
  });

  it("ignores comments", () => {
    expect(parsePlaylist("# order\n- a # first\n- b")).toEqual({ ok: true, ids: ["a", "b"] });
  });

  it("treats an empty file as an empty playlist", () => {
    expect(parsePlaylist("")).toEqual({ ok: true, ids: [] });
    expect(parsePlaylist("# nothing yet\n")).toEqual({ ok: true, ids: [] });
  });

  it("keeps the first place of a repeated id", () => {
    expect(parsePlaylist("- a\n- b\n- a")).toEqual({ ok: true, ids: ["a", "b"] });
  });

  it("rejects something that is not a list of text", () => {
    expect(parsePlaylist("order: [a, b]").ok).toBe(false);
    expect(parsePlaylist("- a\n- {x: 1}").ok).toBe(false);
    expect(parsePlaylist("just text").ok).toBe(false);
  });

  it("rejects invalid YAML", () => {
    const result = parsePlaylist("- [unclosed");
    expect(!result.ok && result.error).toMatch(/not valid YAML/i);
  });
});

const script = (id: string, topic = "T", title = id) => ({ id, topic, title });

describe("orderScripts", () => {
  it("puts playlist scripts first, in playlist order", () => {
    const ordered = orderScripts([script("a"), script("b"), script("c")], ["c", "a"]);
    expect(ordered.map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts the rest by topic, then title", () => {
    const ordered = orderScripts(
      [script("1", "Zed", "A"), script("2", "Alpha", "B"), script("3", "Alpha", "A")],
      [],
    );
    expect(ordered.map((s) => s.id)).toEqual(["3", "2", "1"]);
  });

  it("ignores ids that match no script", () => {
    const ordered = orderScripts([script("a"), script("b")], ["ghost", "b"]);
    expect(ordered.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("does not change the input", () => {
    const input = [script("b"), script("a")];
    orderScripts(input, ["a"]);
    expect(input.map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("neighbours", () => {
  const ordered = [script("a"), script("b"), script("c")];

  it("finds the scripts either side", () => {
    const { previous, next } = neighbours(ordered, "b");
    expect([previous?.id, next?.id]).toEqual(["a", "c"]);
  });

  it("has no previous at the start and no next at the end", () => {
    expect(neighbours(ordered, "a").previous).toBeNull();
    expect(neighbours(ordered, "c").next).toBeNull();
  });

  it("returns nothing for an unknown id", () => {
    expect(neighbours(ordered, "zzz")).toEqual({
      previous: null,
      next: null,
      position: 0,
      total: 3,
    });
  });

  it("says where the script sits, counting from 1", () => {
    expect(neighbours(ordered, "a")).toMatchObject({ position: 1, total: 3 });
    expect(neighbours(ordered, "c")).toMatchObject({ position: 3, total: 3 });
  });
});
