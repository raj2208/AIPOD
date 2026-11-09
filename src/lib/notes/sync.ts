import { inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "../../db/schema";
import { scripts, syncState } from "../../db/schema";
import {
  claimIds,
  findRemoved,
  indexByPath,
  planSync,
  type ParsedFile,
} from "./plan";
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
      noteHash: scripts.noteHash,
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

    if (removed.length > 0) {
      await tx
        .update(scripts)
        .set({ removedAt: now })
        .where(inArray(scripts.id, removed));
    }

    await tx
      .insert(syncState)
      .values({ id: SYNC_STATE_ID, commit, syncedAt: now, report })
      .onConflictDoUpdate({
        target: syncState.id,
        set: { commit, syncedAt: now, report },
      });
  });

  return { ...report, commit };
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
