import {
  folderOf,
  metaPathFor,
  slugify,
  type CollectionMeta,
} from "./collection-file";
import type { RepoFile, SyncError } from "./types";

/** What the database already knows about a collection. */
export type StoredCollection = {
  slug: string;
  folder: string;
  title: string;
  description: string | null;
  position: number | null;
  metaHash: string | null;
  /** Where its cover should be, whether or not the file is there. */
  coverPath: string | null;
  /** Hash of the cover bytes we hold. Null when we hold none. */
  coverHash: string | null;
  /** Whether the bytes are actually in the row. */
  hasCover: boolean;
  removedAt: Date | null;
};

export type WantedCollection = {
  slug: string;
  folder: string;
  stored: StoredCollection | null;
  /** The collection.yml in the repo, when there is one. */
  metaFile: RepoFile | null;
  /** True when collection.yml is exactly what we read last time. */
  metaUnchanged: boolean;
};

export type CollectionPlan = {
  wanted: WantedCollection[];
  /** Slugs with no scripts left. */
  removed: string[];
  errors: SyncError[];
};

/** Cover file names tried when nothing names one, in this order. */
const COVER_NAMES = ["cover.png", "cover.jpg", "cover.jpeg", "cover.webp", "cover.avif", "cover.gif"];

/**
 * Which collections should exist, from the scripts that are live. A collection
 * exists because scripts are in it, never because a folder is there: an empty
 * folder is not a card.
 */
export function planCollections(
  files: RepoFile[],
  liveScriptPaths: string[],
  stored: StoredCollection[],
): CollectionPlan {
  const byPath = new Map(files.map((file) => [file.path, file]));
  const storedBySlug = new Map(stored.map((row) => [row.slug, row]));
  const errors: SyncError[] = [];

  // Folder names are what the repo has; slugs are what urls can carry. Two
  // folders can want the same slug, and only one can have it.
  const folderBySlug = new Map<string, string>();
  for (const path of [...liveScriptPaths].sort()) {
    const folder = folderOf(path);
    const slug = slugify(folder);
    const taken = folderBySlug.get(slug);
    if (taken === undefined) {
      folderBySlug.set(slug, folder);
    } else if (taken !== folder) {
      errors.push({
        path,
        message: `The folders "${taken}" and "${folder}" both become "${slug}" in a web address. Rename one of them.`,
      });
    }
  }

  const wanted: WantedCollection[] = [...folderBySlug.entries()].map(
    ([slug, folder]) => {
      const row = storedBySlug.get(slug) ?? null;
      const metaFile = byPath.get(metaPathFor(folder)) ?? null;
      return {
        slug,
        folder,
        stored: row,
        metaFile,
        metaUnchanged:
          row !== null &&
          !row.removedAt &&
          row.folder === folder &&
          (metaFile?.sha ?? null) === row.metaHash,
      };
    },
  );

  const wantedSlugs = new Set(wanted.map((item) => item.slug));
  const removed = stored
    .filter((row) => !row.removedAt && !wantedSlugs.has(row.slug))
    .map((row) => row.slug);

  return { wanted, removed, errors };
}

/**
 * Where a collection's cover should come from: the image its settings name,
 * or a file called `cover` in its folder. The path is reported even when the
 * file is missing, so adding the image later is noticed.
 */
export function resolveCover(
  files: RepoFile[],
  folder: string,
  meta: CollectionMeta | null,
  stored: StoredCollection | null,
): { path: string | null; file: RepoFile | null } {
  const byPath = new Map(files.map((file) => [file.path, file]));
  const named =
    meta !== null
      ? meta.cover
        ? `notes/${folder}/${meta.cover}`
        : null
      : (stored?.coverPath ?? null);

  const path =
    named ??
    COVER_NAMES.map((name) => `notes/${folder}/${name}`).find((candidate) =>
      byPath.has(candidate),
    ) ??
    null;

  return { path, file: path ? (byPath.get(path) ?? null) : null };
}

/** True when the cover bytes have to be downloaded again. */
export function coverNeedsFetch(
  file: RepoFile | null,
  stored: StoredCollection | null,
): boolean {
  if (!file) return false;
  return file.sha !== stored?.coverHash || !stored?.hasCover;
}
