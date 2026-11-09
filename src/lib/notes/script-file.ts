import { parse as parseYaml } from "yaml";
import { z } from "zod";

/** Scripts are the `*.script.md` files under `scripts/`. */
export const SCRIPT_PATH_PATTERN = /^scripts\/.+\.script\.md$/;

export function isScriptPath(path: string): boolean {
  return SCRIPT_PATH_PATTERN.test(path);
}

const sha = z
  .string()
  .regex(/^[0-9a-f]{40}$/, "must be a 40-character git hash");

export const scriptHeaderSchema = z.object({
  id: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "must be lowercase words joined by dashes, e.g. terraform-basics",
    ),
  title: z.string().trim().min(1).max(200),
  topic: z.string().trim().min(1).max(100),
  // The note this script was written from, and that note's hash at the time.
  source: z.string().trim().min(1),
  source_hash: sha,
  model: z.string().trim().min(1).optional(),
  // YAML reads `skill_version: 1` as a number, so accept both.
  skill_version: z
    .union([z.string(), z.number()])
    .transform(String)
    .optional(),
  status: z.enum(["draft", "approved"]).default("draft"),
});

export type ScriptHeader = z.infer<typeof scriptHeaderSchema>;

export type ParsedScript = ScriptHeader & {
  /** The spoken text, with the header removed. */
  content: string;
};

export type ParseResult =
  | { ok: true; script: ParsedScript }
  | { ok: false; error: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Turns the raw text of a script file into a validated script, or an error. */
export function parseScriptFile(raw: string): ParseResult {
  const text = raw.replace(/^﻿/, "");
  const match = FRONTMATTER.exec(text);
  if (!match) {
    return {
      ok: false,
      error: "Missing the header block (--- ... ---) at the top of the file.",
    };
  }

  let header: unknown;
  try {
    header = parseYaml(match[1]);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `The header is not valid YAML: ${reason}` };
  }

  const parsed = scriptHeaderSchema.safeParse(header);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "header"}: ${issue.message}`)
      .join("; ");
    return { ok: false, error: `Invalid header. ${problems}` };
  }

  const content = text.slice(match[0].length).trim();
  if (!content) {
    return { ok: false, error: "The script has no spoken text after the header." };
  }

  return { ok: true, script: { ...parsed.data, content } };
}
