import { describe, expect, it } from "vitest";

import {
  claimIds,
  findRemoved,
  planSync,
  type ParsedFile,
  type StoredScript,
} from "./plan";
import type { ParsedScript } from "./script-file";
import type { RepoFile } from "./types";

const file = (path: string, sha: string): RepoFile => ({ path, sha });

function stored(overrides: Partial<StoredScript> = {}): StoredScript {
  return {
    id: "a",
    scriptPath: "scripts/a.script.md",
    scriptHash: "h1",
    notePath: "notes/a.md",
    sourceHash: "n1",
    noteHash: "n1",
    hasFidelity: true,
    removedAt: null,
    ...overrides,
  };
}

function parsed(path: string, id: string): ParsedFile {
  return {
    file: file(path, "x"),
    script: { id, content: "text" } as ParsedScript,
  };
}

describe("planSync", () => {
  it("skips scripts whose hash is unchanged", () => {
    const plan = planSync(
      [file("scripts/a.script.md", "h1"), file("notes/a.md", "n1")],
      [stored()],
    );
    expect(plan.toFetch).toEqual([]);
    expect(plan.unchanged).toHaveLength(1);
    expect(plan.noteHashUpdates).toEqual([]);
  });

  it("fetches only the script that changed", () => {
    const plan = planSync(
      [
        file("scripts/a.script.md", "h2"),
        file("scripts/b.script.md", "hb"),
        file("notes/a.md", "n1"),
      ],
      [
        stored(),
        stored({ id: "b", scriptPath: "scripts/b.script.md", scriptHash: "hb" }),
      ],
    );
    expect(plan.toFetch.map((f) => f.path)).toEqual(["scripts/a.script.md"]);
    expect(plan.unchanged.map((r) => r.id)).toEqual(["b"]);
  });

  it("fetches new script files", () => {
    const plan = planSync([file("scripts/new.script.md", "h")], []);
    expect(plan.toFetch).toHaveLength(1);
  });

  it("fetches a script again if it had been marked removed", () => {
    const plan = planSync(
      [file("scripts/a.script.md", "h1")],
      [stored({ removedAt: new Date() })],
    );
    expect(plan.toFetch).toHaveLength(1);
  });

  it("ignores files that are not scripts", () => {
    const plan = planSync(
      [file("notes/a.md", "n1"), file("README.md", "r")],
      [],
    );
    expect(plan.toFetch).toEqual([]);
  });

  it("notices a changed note without fetching the script", () => {
    const plan = planSync(
      [file("scripts/a.script.md", "h1"), file("notes/a.md", "n2")],
      [stored()],
    );
    expect(plan.toFetch).toEqual([]);
    expect(plan.noteHashUpdates).toEqual([{ id: "a", noteHash: "n2" }]);
  });

  it("records a deleted note as a missing hash", () => {
    const plan = planSync([file("scripts/a.script.md", "h1")], [stored()]);
    expect(plan.noteHashUpdates).toEqual([{ id: "a", noteHash: null }]);
  });

  it("does not touch a note hash that has not changed", () => {
    const plan = planSync(
      [file("scripts/a.script.md", "h1"), file("notes/a.md", "n1")],
      [stored()],
    );
    expect(plan.noteHashUpdates).toHaveLength(0);
  });
});

describe("planSync: fidelity", () => {
  const files = (noteSha: string) => [
    file("scripts/a.script.md", "h1"),
    file("notes/a.md", noteSha),
  ];

  it("does nothing when the report is already there and the note matches", () => {
    const plan = planSync(files("n1"), [stored()]);
    expect(plan.fidelityToCompute).toEqual([]);
    expect(plan.fidelityToClear).toEqual([]);
  });

  it("computes a missing report when the note matches the script", () => {
    const row = stored({ hasFidelity: false });
    const plan = planSync(files("n1"), [row]);
    expect(plan.fidelityToCompute).toEqual([{ row, noteHash: "n1" }]);
  });

  it("clears the report when the note has changed", () => {
    const plan = planSync(files("n2"), [stored()]);
    expect(plan.fidelityToClear).toEqual(["a"]);
    expect(plan.fidelityToCompute).toEqual([]);
  });

  it("does not compute against a note that no longer matches", () => {
    const plan = planSync(files("n2"), [stored({ hasFidelity: false })]);
    expect(plan.fidelityToCompute).toEqual([]);
    expect(plan.fidelityToClear).toEqual([]);
  });

  it("clears the report when the note is deleted", () => {
    const plan = planSync([file("scripts/a.script.md", "h1")], [stored()]);
    expect(plan.fidelityToClear).toEqual(["a"]);
  });

  it("computes again once a changed note is reverted", () => {
    const row = stored({ hasFidelity: false, noteHash: "n2" });
    const plan = planSync(files("n1"), [row]);
    expect(plan.fidelityToCompute).toEqual([{ row, noteHash: "n1" }]);
  });
});

describe("claimIds", () => {
  it("accepts scripts with distinct ids", () => {
    const result = claimIds(
      [parsed("scripts/a.script.md", "a"), parsed("scripts/b.script.md", "b")],
      [],
    );
    expect(result.accepted).toHaveLength(2);
    expect(result.errors).toEqual([]);
  });

  it("accepts a rename, where the same id moves to a new path", () => {
    const result = claimIds([parsed("scripts/new-name.script.md", "a")], []);
    expect(result.accepted).toHaveLength(1);
  });

  it("rejects an id already used by an unchanged file", () => {
    const result = claimIds(
      [parsed("scripts/copy.script.md", "a")],
      [stored()],
    );
    expect(result.accepted).toEqual([]);
    expect(result.errors[0].path).toBe("scripts/copy.script.md");
    expect(result.errors[0].message).toMatch(/already used by scripts\/a.script.md/);
  });

  it("keeps the first of two new files that share an id", () => {
    const result = claimIds(
      [parsed("scripts/one.script.md", "x"), parsed("scripts/two.script.md", "x")],
      [],
    );
    expect(result.accepted.map((p) => p.file.path)).toEqual([
      "scripts/one.script.md",
    ]);
    expect(result.errors).toHaveLength(1);
  });
});

describe("findRemoved", () => {
  const files = [file("scripts/b.script.md", "hb")];

  it("removes a script whose file is gone", () => {
    expect(findRemoved(files, [stored()], new Set())).toEqual(["a"]);
  });

  it("keeps a script that moved to a new path", () => {
    expect(findRemoved(files, [stored()], new Set(["a"]))).toEqual([]);
  });

  it("keeps a script whose file is still there but failed to parse", () => {
    const row = stored({ scriptPath: "scripts/b.script.md" });
    expect(findRemoved(files, [row], new Set())).toEqual([]);
  });

  it("does not remove an already removed script again", () => {
    expect(
      findRemoved(files, [stored({ removedAt: new Date() })], new Set()),
    ).toEqual([]);
  });
});
