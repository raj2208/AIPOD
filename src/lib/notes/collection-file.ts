import { parse } from "yaml";
import { z } from "zod";

/**
 * Collections: the folders directly inside `notes/`. Each one is a card in the
 * library, and the scripts under it are its chapters. See
 * notes-template/README.md for the layout this reads.
 */

/** Where a note that is in no folder at all ends up. */
export const UNFILED_FOLDER = "Unfiled";
export const UNFILED_SLUG = "unfiled";

export const COLLECTION_META_FILE = "collection.yml";

/** Image types a cover may be, and what to serve them as. */
export const COVER_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** Covers are held in the database, so they have to stay small. */
export const MAX_COVER_BYTES = 2 * 1024 * 1024;

const metaSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  cover: z.string().trim().min(1).max(200).optional(),
  order: z.number().int().optional(),
});

export type CollectionMeta = z.infer<typeof metaSchema>;

/** A url-safe id for a folder name. "My notes" becomes "my-notes". */
export function slugify(folder: string): string {
  const slug = folder
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || UNFILED_SLUG;
}

/** A readable title when a collection has no collection.yml. */
export function titleFromFolder(folder: string): string {
  const words = folder.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The collection folder a file belongs to: the first folder under `notes/` or
 * `scripts/`. A file kept straight in either is unfiled.
 */
export function folderOf(path: string): string {
  const parts = path.split("/");
  if (parts.length < 3) return UNFILED_FOLDER;
  if (parts[0] !== "notes" && parts[0] !== "scripts") return UNFILED_FOLDER;
  return parts[1];
}

export function metaPathFor(folder: string): string {
  return `notes/${folder}/${COLLECTION_META_FILE}`;
}

export function isCollectionMetaPath(path: string): boolean {
  const parts = path.split("/");
  return (
    parts.length === 3 &&
    parts[0] === "notes" &&
    parts[2] === COLLECTION_META_FILE
  );
}

/** The media type for a cover file, or null when it is not an image we serve. */
export function coverType(path: string): string | null {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return COVER_TYPES[extension] ?? null;
}

/** True for any image sitting directly inside a collection folder. */
export function isCoverPath(path: string): boolean {
  const parts = path.split("/");
  return parts.length === 3 && parts[0] === "notes" && coverType(path) !== null;
}

export type ParsedCollection =
  | { ok: true; meta: CollectionMeta }
  | { ok: false; error: string };

/** Reads a collection.yml. Every field is optional; an empty file is fine. */
export function parseCollectionFile(text: string): ParsedCollection {
  let data: unknown;
  try {
    data = parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Not valid YAML: ${reason}` };
  }
  if (data === null || data === undefined) return { ok: true, meta: {} };
  if (typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Expected a mapping of settings, such as `title: Terraform`." };
  }

  const result = metaSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".") || "file";
    return { ok: false, error: `${field}: ${issue.message}` };
  }

  const cover = result.data.cover;
  if (cover !== undefined) {
    if (cover.includes("/") || cover.includes("\\") || cover.startsWith(".")) {
      return {
        ok: false,
        error: `cover: must be the name of an image in this folder, not a path (got "${cover}").`,
      };
    }
    if (coverType(cover) === null) {
      return {
        ok: false,
        error: `cover: "${cover}" is not an image AIPOD can show. Use ${Object.keys(COVER_TYPES).join(", ")}.`,
      };
    }
  }

  return { ok: true, meta: result.data };
}
