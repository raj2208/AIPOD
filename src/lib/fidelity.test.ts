import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { checkFidelity, needsReview } from "./fidelity";
import { parseScriptFile } from "./notes/script-file";

describe("checkFidelity: terms", () => {
  it("passes when every code term appears", () => {
    const report = checkFidelity(
      "Run `terraform plan` before `terraform apply`.",
      "First run terraform plan, and only then terraform apply.",
    );
    expect(report.missing).toEqual([]);
    expect(report.checked).toBe(2);
  });

  it("reports a dropped code term", () => {
    const report = checkFidelity(
      "Use `terraform fmt` and `terraform validate`.",
      "Use terraform fmt to tidy your code.",
    );
    expect(report.missing).toEqual(["terraform validate"]);
  });

  it("accepts a dot spoken as the word dot", () => {
    const report = checkFidelity(
      "Files end in `.tf`. State is `terraform.tfstate`.",
      "Files end in dot tf. State lives in terraform dot tfstate.",
    );
    expect(report.missing).toEqual([]);
  });

  it("accepts underscores and hyphens spoken as spaces", () => {
    const report = checkFidelity(
      "Use `for_each` or `depends_on`, never `local-exec`.",
      "Use for each, or depends on, but avoid local exec.",
    );
    expect(report.missing).toEqual([]);
  });

  it("accepts a plural of a bold concept", () => {
    const report = checkFidelity(
      "A **provider** is a plugin.",
      "Providers are plugins.",
    );
    expect(report.missing).toEqual([]);
  });

  it("accepts a reworded multi-word concept but not a dropped one", () => {
    const note = "**State locking** stops corruption. **Drift** is a gap.";
    expect(
      checkFidelity(note, "Locking the state stops corruption. Drift is a gap.")
        .missing,
    ).toEqual([]);
    expect(checkFidelity(note, "Locking the state stops corruption.").missing).toEqual(
      ["Drift"],
    );
  });

  it("ignores code blocks, which a script describes rather than reads", () => {
    const note = "Example:\n```hcl\nresource \"aws_instance\" \"web\" {}\n```\n";
    expect(checkFidelity(note, "There is an example.").checked).toBe(0);
  });

  it("ignores front matter in the note", () => {
    const note = "---\ntags: [a, b]\n---\nUse `init`.";
    expect(checkFidelity(note, "Use init.").missing).toEqual([]);
  });
});

describe("checkFidelity: numbers", () => {
  it("accepts a number as digits or as a word", () => {
    expect(checkFidelity("It takes 2 steps.", "It takes 2 steps.").missing).toEqual([]);
    expect(checkFidelity("It takes 2 steps.", "It takes two steps.").missing).toEqual([]);
  });

  it("reports a dropped number", () => {
    expect(checkFidelity("The limit is 500 requests.", "There is a limit.").missing).toEqual([
      "500",
    ]);
  });

  it("does not list a number twice when it is inside a missing term", () => {
    const report = checkFidelity("Back up every **6 hours**.", "Back up often.");
    expect(report.missing).toEqual(["6 hours"]);
  });

  it("flags a number the note never had", () => {
    const report = checkFidelity("It takes steps.", "It takes 7 steps.");
    expect(report.added).toEqual(["7"]);
  });

  it("does not treat names like S3 or list numbering as numbers", () => {
    const report = checkFidelity(
      "## 1. Storage\n1. Use S3.\n2. Encrypt it.",
      "Use S3 and encrypt it.",
    );
    expect(report.missing).toEqual([]);
    expect(report.checked).toBe(0);
  });

  it("handles thousands separators and decimals", () => {
    const report = checkFidelity("Costs 1,000 or 2.5 units.", "Costs 1000 or 2.5 units.");
    expect(report.missing).toEqual([]);
    expect(report.added).toEqual([]);
  });
});

describe("checkFidelity: length", () => {
  const longNote = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");

  it("flags a script much shorter than the note", () => {
    const report = checkFidelity(longNote, "Just a few words here.");
    expect(report.tooShort).toBe(true);
    expect(needsReview(report)).toBe(true);
  });

  it("does not flag a script as long as the note", () => {
    expect(checkFidelity(longNote, longNote).tooShort).toBe(false);
  });

  it("does not judge the length of a tiny note", () => {
    expect(checkFidelity("A short note.", "Hi.").tooShort).toBe(false);
  });
});

describe("needsReview", () => {
  it("is false for a clean report", () => {
    expect(
      needsReview({ missing: [], added: [], checked: 3, noteWords: 100, scriptWords: 150, tooShort: false }),
    ).toBe(false);
  });

  it("is true for missing terms or added numbers", () => {
    const base = { checked: 3, noteWords: 100, scriptWords: 150, tooShort: false };
    expect(needsReview({ ...base, missing: ["x"], added: [] })).toBe(true);
    expect(needsReview({ ...base, missing: [], added: ["9"] })).toBe(true);
  });
});

describe("the sample note and script", () => {
  const note = readFileSync("notes-template/notes/terraform/basics.md", "utf8");
  const parsed = parseScriptFile(
    readFileSync("notes-template/scripts/terraform/basics.script.md", "utf8"),
  );

  it("is faithful", () => {
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const report = checkFidelity(note, parsed.script.content);
    expect(report.missing).toEqual([]);
    expect(report.added).toEqual([]);
    expect(needsReview(report)).toBe(false);
  });
});
