import { describe, expect, it } from "vitest";

import { gitBlobSha } from "./git-hash";
import { isScriptPath, parseScriptFile } from "./script-file";

const HASH = "a".repeat(40);

function script(header: string, body = "Hello there.") {
  return `---\n${header}\n---\n${body}\n`;
}

const VALID_HEADER = [
  "id: terraform-basics",
  "title: Terraform basics",
  "topic: Terraform",
  "source: notes/terraform/basics.md",
  `source_hash: ${HASH}`,
].join("\n");

describe("gitBlobSha", () => {
  // Known values from `git hash-object`.
  it("matches git for an empty file", () => {
    expect(gitBlobSha("")).toBe("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  });

  it("matches git for a small file", () => {
    expect(gitBlobSha("hello\n")).toBe(
      "ce013625030ba8dba906f756967f9e9ca394464a",
    );
  });

  it("hashes bytes, not characters", () => {
    expect(gitBlobSha("é")).toBe(gitBlobSha(Buffer.from("é", "utf8")));
  });
});

describe("isScriptPath", () => {
  it("accepts script files under scripts/", () => {
    expect(isScriptPath("scripts/terraform/basics.script.md")).toBe(true);
    expect(isScriptPath("scripts/intro.script.md")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isScriptPath("notes/basics.md")).toBe(false);
    expect(isScriptPath("scripts/README.md")).toBe(false);
    expect(isScriptPath("other/scripts/a.script.md")).toBe(false);
  });
});

describe("parseScriptFile", () => {
  it("parses a valid script and applies defaults", () => {
    const result = parseScriptFile(script(VALID_HEADER, "First.\n\nSecond."));
    expect(result).toEqual({
      ok: true,
      script: {
        id: "terraform-basics",
        title: "Terraform basics",
        topic: "Terraform",
        source: "notes/terraform/basics.md",
        source_hash: HASH,
        status: "draft",
        content: "First.\n\nSecond.",
      },
    });
  });

  it("keeps optional fields and reads a numeric skill_version", () => {
    const result = parseScriptFile(
      script(`${VALID_HEADER}\nmodel: claude-sonnet-5-5\nskill_version: 2\nstatus: approved`),
    );
    expect(result.ok && result.script).toMatchObject({
      model: "claude-sonnet-5-5",
      skill_version: "2",
      status: "approved",
    });
  });

  it("handles Windows line endings and a byte order mark", () => {
    const raw = `﻿${script(VALID_HEADER, "Body.").replace(/\n/g, "\r\n")}`;
    expect(parseScriptFile(raw).ok).toBe(true);
  });

  it("does not treat a later --- in the body as the header end", () => {
    const result = parseScriptFile(script(VALID_HEADER, "One.\n---\nTwo."));
    expect(result.ok && result.script.content).toBe("One.\n---\nTwo.");
  });

  it("rejects a file with no header", () => {
    const result = parseScriptFile("Just some text.");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/header block/);
  });

  it("rejects invalid YAML", () => {
    const result = parseScriptFile(script("id: [unclosed"));
    expect(!result.ok && result.error).toMatch(/not valid YAML/);
  });

  it("names every invalid field", () => {
    const result = parseScriptFile(
      script("id: Not A Slug\ntitle: ''\ntopic: T\nsource: s\nsource_hash: abc"),
    );
    expect(result.ok).toBe(false);
    const error = !result.ok ? result.error : "";
    expect(error).toMatch(/id:/);
    expect(error).toMatch(/title:/);
    expect(error).toMatch(/source_hash:/);
  });

  it("rejects an unknown status", () => {
    const result = parseScriptFile(script(`${VALID_HEADER}\nstatus: done`));
    expect(!result.ok && result.error).toMatch(/status:/);
  });

  it("rejects a script with no spoken text", () => {
    const result = parseScriptFile(script(VALID_HEADER, "   "));
    expect(!result.ok && result.error).toMatch(/no spoken text/);
  });
});
