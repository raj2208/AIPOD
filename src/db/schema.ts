import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { FidelityReport } from "@/lib/fidelity";
import type { SyncReport } from "@/lib/notes/types";

export type ScriptStatus = "draft" | "approved";

/**
 * A cache of the scripts in the notes repo. Git owns the content, so every
 * column here can be rebuilt by running a sync. See docs/architecture.md.
 */
export const scripts = pgTable(
  "scripts",
  {
    /** Stable id from the script's header. Survives renames. */
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    /** The spoken text. */
    content: text("content").notNull(),
    status: text("status").$type<ScriptStatus>().notNull().default("draft"),

    /** Where the script file is, and its git hash. Drives change detection. */
    scriptPath: text("script_path").notNull(),
    scriptHash: text("script_hash").notNull(),

    /** The note this script was written from. */
    notePath: text("note_path").notNull(),
    /** Hash of the note when the script was written (from the header). */
    sourceHash: text("source_hash").notNull(),
    /** Hash of the note now. Null when the note is gone. */
    noteHash: text("note_hash"),

    model: text("model"),
    skillVersion: text("skill_version"),

    /**
     * How well the script kept the note's facts. Null when it has not been
     * checked, which includes when the note has changed since.
     */
    fidelity: jsonb("fidelity").$type<FidelityReport>(),

    /** Set when the file disappears from the repo. Rows are never deleted. */
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Changes only when the script file changes. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("scripts_script_path_idx").on(table.scriptPath)],
);

export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;

/** True when the note has changed (or vanished) since the script was written. */
export function isStale(
  script: Pick<Script, "sourceHash" | "noteHash">,
): boolean {
  return script.noteHash !== script.sourceHash;
}

/** One row per synced source; today only "notes". */
export const syncState = pgTable("sync_state", {
  id: text("id").primaryKey(),
  /** The commit that was last synced, when the source reports one. */
  commit: text("commit"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
  report: jsonb("report").$type<SyncReport>().notNull(),
  /** Script ids in play order, from playlist.yml. */
  playlist: jsonb("playlist").$type<string[]>().notNull().default([]),
  /** Hash of playlist.yml when it was read, so it is only re-read when it changes. */
  playlistHash: text("playlist_hash"),
});

export type SyncState = typeof syncState.$inferSelect;
