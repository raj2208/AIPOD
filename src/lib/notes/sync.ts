import { eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../../db/schema";
import { checkFidelity, type FidelityReport } from "../fidelity";
import { scripts, syncState } from "../../db/schema";
import {
  claimIds,
  findRemoved,
  indexByPath,
  planSync,
  type ParsedFile,
} from "./plan";
import { PLAYLIST_PATH, parsePlaylist } from "./playlist";
import { parseScriptFile } from "./script-file";
import {
  SYNC_STATE_ID,
  type NotesSource,
  type SyncError,
  type SyncReport,
} from "./types";

// Takes the database as an argument (rather than importing it) so the same
// code runs from the CLI, a server action, and a webhook.
export type Db = PostgresJsDatabase<typeof schema>;

const FETCH_CONCURRENCY = 8;

/** Runs `fn` over `items`, with at most `limit` running at once. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

export type SyncResult = SyncReport & { commit: string | null };

/**
 * Brings the database in line with the notes source, writing only what
 * changed. Never calls an AI model. See docs/architecture.md.
 */
export async function runSync(
  db: Db,
  source: NotesSource,
  now: Date = new Date(),
): Promise<SyncResult> {
  const { files, commit } = await source.list();

  const stored = await db
    .select({
      id: scripts.id,
      scriptPath: scripts.scriptPath,
      scriptHash: scripts.scriptHash,
      notePath: scripts.notePath,
      sourceHash: scripts.sourceHash,
      noteHash: scripts.noteHash,
      hasFidelity: sql<boolean>`${scripts.fidelity} is not null and ${scripts.noteContent} is not null`,
      removedAt: scripts.removedAt,
    })
    .from(scripts);

  const plan = planSync(files, stored);
  const hashByPath = indexByPath(files);

  // Download and read only the script files that are new or changed.
  const outcomes = await mapLimit(
    plan.toFetch,
    FETCH_CONCURRENCY,
    async (file): Promise<ParsedFile | SyncError> => {
      try {
        const result = parseScriptFile(await source.read(file));
        return result.ok
          ? { file, script: result.script }
          : { path: file.path, message: result.error };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { path: file.path, message: `Could not read the file: ${reason}` };
      }
    },
  );

  const parsed = outcomes.filter((o): o is ParsedFile => "script" in o);
  const errors: SyncError[] = outcomes.filter((o): o is SyncError => "message" in o);

  const claimed = claimIds(parsed, plan.unchanged);
  errors.push(...claimed.errors);

  const knownIds = new Set(stored.map((row) => row.id));
  const acceptedIds = new Set(claimed.accepted.map((p) => p.script.id));
  const added = claimed.accepted
    .map((p) => p.script.id)
    .filter((id) => !knownIds.has(id));
  const updated = claimed.accepted
    .map((p) => p.script.id)
    .filter((id) => knownIds.has(id));
  const removed = findRemoved(files, stored, acceptedIds);

  // The playlist is one small file. It is downloaded only when its hash
  // differs from the one we stored, like everything else.
  const [previousState] = await db
    .select({ playlist: syncState.playlist, playlistHash: syncState.playlistHash })
    .from(syncState)
    .where(eq(syncState.id, SYNC_STATE_ID));
  let playlist = previousState?.playlist ?? [];
  let playlistHash = previousState?.playlistHash ?? null;
  const playlistFile = files.find((file) => file.path === PLAYLIST_PATH);
  if (!playlistFile) {
    playlist = [];
    playlistHash = null;
  } else if (playlistFile.sha !== playlistHash) {
    try {
      const result = parsePlaylist(await source.read(playlistFile));
      if (result.ok) {
        playlist = result.ids;
        playlistHash = playlistFile.sha;
      } else {
        // Keep the old playlist, and try again next sync.
        errors.push({ path: PLAYLIST_PATH, message: result.error });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({ path: PLAYLIST_PATH, message: `Could not read the file: ${reason}` });
    }
  }

  // A typo in the playlist would otherwise be skipped without a word.
  const removedIds = new Set(removed);
  const liveIds = new Set([
    ...stored.filter((row) => !removedIds.has(row.id) && !row.removedAt).map((row) => row.id),
    ...acceptedIds,
  ]);
  for (const id of playlist) {
    if (!liveIds.has(id)) {
      errors.push({
        path: PLAYLIST_PATH,
        message: `"${id}" is not the id of any script.`,
      });
    }
  }

  // The fidelity check compares a script with the exact note it was written
  // from. A note is downloaded only when a script is new or changed, or when
  // its note matches again, and never twice in one run.
  const noteReads = new Map<string, Promise<string>>();
  const readNote = (path: string, sha: string) => {
    const key = `${path}@${sha}`;
    if (!noteReads.has(key)) noteReads.set(key, source.read({ path, sha }));
    return noteReads.get(key)!;
  };
  type Checked = { fidelity: FidelityReport; noteContent: string };
  const check = async (
    path: string,
    noteHash: string,
    content: string,
  ): Promise<Checked | null> => {
    try {
      const noteContent = await readNote(path, noteHash);
      return { fidelity: checkFidelity(noteContent, content), noteContent };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({ path, message: `Could not check against the note: ${reason}` });
      return null;
    }
  };

  const checkedById = new Map<string, Checked | null>();
  await mapLimit(claimed.accepted, FETCH_CONCURRENCY, async ({ script }) => {
    const noteHash = hashByPath.get(script.source) ?? null;
    const fresh = noteHash !== null && noteHash === script.source_hash;
    checkedById.set(
      script.id,
      fresh ? await check(script.source, noteHash, script.content) : null,
    );
  });

  const pendingContent =
    plan.fidelityToCompute.length > 0
      ? await db
          .select({ id: scripts.id, content: scripts.content })
          .from(scripts)
          .where(inArray(scripts.id, plan.fidelityToCompute.map((x) => x.row.id)))
      : [];
  const contentById = new Map(pendingContent.map((row) => [row.id, row.content]));
  // Clearing a report keeps the stored note: it is the version the script was
  // written from, which is what a reader wants once the note has moved on.
  const fidelityUpdates: {
    id: string;
    fidelity: FidelityReport | null;
    noteContent?: string;
  }[] = plan.fidelityToClear.map((id) => ({ id, fidelity: null }));
  await mapLimit(plan.fidelityToCompute, FETCH_CONCURRENCY, async ({ row, noteHash }) => {
    const content = contentById.get(row.id);
    if (content === undefined) return;
    const checked = await check(row.notePath, noteHash, content);
    if (checked) fidelityUpdates.push({ id: row.id, ...checked });
  });

  const report: SyncReport = {
    added,
    updated,
    removed,
    unchanged: plan.unchanged.length,
    errors,
  };

  await db.transaction(async (tx) => {
    if (claimed.accepted.length > 0) {
      await tx
        .insert(scripts)
        .values(
          claimed.accepted.map(({ file, script }) => ({
            id: script.id,
            title: script.title,
            topic: script.topic,
            content: script.content,
            status: script.status,
            scriptPath: file.path,
            scriptHash: file.sha,
            notePath: script.source,
            sourceHash: script.source_hash,
            noteHash: hashByPath.get(script.source) ?? null,
            model: script.model ?? null,
            skillVersion: script.skill_version ?? null,
            fidelity: checkedById.get(script.id)?.fidelity ?? null,
            noteContent: checkedById.get(script.id)?.noteContent ?? null,
            updatedAt: now,
          })),
        )
        .onConflictDoUpdate({
          target: scripts.id,
          set: {
            title: sql`excluded.title`,
            topic: sql`excluded.topic`,
            content: sql`excluded.content`,
            status: sql`excluded.status`,
            scriptPath: sql`excluded.script_path`,
            scriptHash: sql`excluded.script_hash`,
            notePath: sql`excluded.note_path`,
            sourceHash: sql`excluded.source_hash`,
            noteHash: sql`excluded.note_hash`,
            model: sql`excluded.model`,
            skillVersion: sql`excluded.skill_version`,
            fidelity: sql`excluded.fidelity`,
            noteContent: sql`excluded.note_content`,
            removedAt: null,
            updatedAt: now,
          },
          // A second safeguard: even if unchanged rows were sent, they are
          // left alone unless something about them actually differs.
          setWhere: sql`${scripts.scriptHash} is distinct from excluded.script_hash
            or ${scripts.scriptPath} is distinct from excluded.script_path
            or ${scripts.noteHash} is distinct from excluded.note_hash
            or ${scripts.removedAt} is not null`,
        });
    }

    // Scripts that were not re-downloaded still need their note hash kept
    // current, since that is what makes a script stale.
    for (const { id, noteHash } of plan.noteHashUpdates) {
      await tx
        .update(scripts)
        .set({ noteHash })
        .where(sql`${scripts.id} = ${id}`);
    }

    for (const { id, ...values } of fidelityUpdates) {
      await tx.update(scripts).set(values).where(sql`${scripts.id} = ${id}`);
    }

    if (removed.length > 0) {
      await tx
        .update(scripts)
        .set({ removedAt: now })
        .where(inArray(scripts.id, removed));
    }

    await tx
      .insert(syncState)
      .values({ id: SYNC_STATE_ID, commit, syncedAt: now, report, playlist, playlistHash })
      .onConflictDoUpdate({
        target: syncState.id,
        set: { commit, syncedAt: now, report, playlist, playlistHash },
      });
  });

  return { ...report, commit };
}

/** A short sentence for the UI, such as "Added 1 and updated 2." */
export function summarizeReport(report: SyncReport): string {
  const parts = [
    report.added.length && `added ${report.added.length}`,
    report.updated.length && `updated ${report.updated.length}`,
    report.removed.length && `removed ${report.removed.length}`,
  ].filter(Boolean) as string[];

  const summary =
    parts.length === 0
      ? "Already up to date."
      : `${parts.join(", ").replace(/^./, (c) => c.toUpperCase())}.`;
  return report.errors.length > 0
    ? `${summary} ${report.errors.length} ${report.errors.length === 1 ? "file has" : "files have"} problems.`
    : summary;
}

/** One line per outcome, for the CLI and logs. */
export function formatReport(result: SyncResult): string {
  const lines = [
    `Added ${result.added.length}, updated ${result.updated.length}, removed ${result.removed.length}, unchanged ${result.unchanged}.`,
  ];
  for (const id of result.added) lines.push(`  + ${id}`);
  for (const id of result.updated) lines.push(`  ~ ${id}`);
  for (const id of result.removed) lines.push(`  - ${id}`);
  for (const error of result.errors) {
    lines.push(`  ! ${error.path}: ${error.message}`);
  }
  return lines.join("\n");
}
