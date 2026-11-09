import type { ParsedScript } from "./script-file";
import { isScriptPath } from "./script-file";
import type { RepoFile, SyncError } from "./types";

/** What the database already knows about a script. */
export type StoredScript = {
  id: string;
  scriptPath: string;
  scriptHash: string;
  notePath: string;
  noteHash: string | null;
  removedAt: Date | null;
};

export type SyncPlan = {
  /** Script files that are new or have changed, and so must be downloaded. */
  toFetch: RepoFile[];
  /** Script files that are already up to date. */
  unchanged: StoredScript[];
  /** Up-to-date scripts whose note has changed since we last looked. */
  noteHashUpdates: { id: string; noteHash: string | null }[];
};

export function indexByPath(files: RepoFile[]): Map<string, string> {
  return new Map(files.map((file) => [file.path, file.sha]));
}

/**
 * Compares the repo listing with the database and decides what to download.
 * A script file is skipped when the database already holds that exact hash.
 */
export function planSync(files: RepoFile[], stored: StoredScript[]): SyncPlan {
  const hashByPath = indexByPath(files);
  const live = new Map<string, StoredScript>();
  for (const row of stored) {
    if (!row.removedAt) live.set(row.scriptPath, row);
  }

  const toFetch: RepoFile[] = [];
  const unchanged: StoredScript[] = [];
  for (const file of files) {
    if (!isScriptPath(file.path)) continue;
    const row = live.get(file.path);
    if (row && row.scriptHash === file.sha) unchanged.push(row);
    else toFetch.push(file);
  }

  const noteHashUpdates = unchanged.flatMap((row) => {
    const noteHash = hashByPath.get(row.notePath) ?? null;
    return noteHash === row.noteHash ? [] : [{ id: row.id, noteHash }];
  });

  return { toFetch, unchanged, noteHashUpdates };
}

export type ParsedFile = { file: RepoFile; script: ParsedScript };

/**
 * Makes sure each script id is used by one file only. A file whose id is
 * already taken by a different file is rejected, so copying a script and
 * forgetting to change its id cannot overwrite the original.
 */
export function claimIds(
  parsed: ParsedFile[],
  unchanged: StoredScript[],
): { accepted: ParsedFile[]; errors: SyncError[] } {
  const owner = new Map<string, string>();
  for (const row of unchanged) owner.set(row.id, row.scriptPath);

  const accepted: ParsedFile[] = [];
  const errors: SyncError[] = [];
  for (const item of parsed) {
    const current = owner.get(item.script.id);
    if (current && current !== item.file.path) {
      errors.push({
        path: item.file.path,
        message: `The id "${item.script.id}" is already used by ${current}. Each script needs its own id.`,
      });
      continue;
    }
    owner.set(item.script.id, item.file.path);
    accepted.push(item);
  }
  return { accepted, errors };
}

/**
 * Scripts to mark as removed: their file is gone from the repo and no file
 * took over their id (which is what a rename looks like). A script whose file
 * is still there but failed to parse is kept, not removed.
 */
export function findRemoved(
  files: RepoFile[],
  stored: StoredScript[],
  acceptedIds: Set<string>,
): string[] {
  const present = new Set(files.map((file) => file.path));
  return stored
    .filter(
      (row) =>
        !row.removedAt &&
        !present.has(row.scriptPath) &&
        !acceptedIds.has(row.id),
    )
    .map((row) => row.id);
}
