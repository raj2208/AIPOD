import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { FidelityReport } from "@/lib/fidelity";
import type { SyncReport } from "@/lib/notes/types";

export type ScriptStatus = "draft" | "approved";

/** Raw bytes. Used for cover images, which are small and come from the repo. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * A folder directly inside `notes/`: one card in the library, holding the
 * scripts written from the notes under it. Like everything else here it is a
 * cache of the repo and can be rebuilt by a sync.
 */
export const collections = pgTable("collections", {
  /** Url-safe id made from the folder name. */
  slug: text("slug").primaryKey(),
  /** The folder's name in the repo, which is how its files are found. */
  folder: text("folder").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  /** `order` from collection.yml. Collections without one come after. */
  position: integer("position"),

  /** collection.yml, when there is one, and its hash for change detection. */
  metaPath: text("meta_path"),
  metaHash: text("meta_hash"),

  /** The cover image, held here so the app never reaches back to the repo. */
  coverPath: text("cover_path"),
  coverHash: text("cover_hash"),
  coverType: text("cover_type"),
  coverData: bytea("cover_data"),

  /** Set when the collection has no scripts left. Rows are never deleted. */
  removedAt: timestamp("removed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
/** A collection without its cover bytes, which no page needs in its payload. */
export type CollectionSummary = Omit<Collection, "coverData">;

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

    /** The collection this belongs to: the first folder of its path. */
    collection: text("collection").notNull().default("unfiled"),

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
    /**
     * The note as it was when the script was written, kept so the script can be
     * read against it. Kept even after the note changes, which is when it is
     * most useful. Null if the note had already changed by the first sync.
     */
    noteContent: text("note_content"),

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
  (table) => [
    index("scripts_script_path_idx").on(table.scriptPath),
    index("scripts_collection_idx").on(table.collection),
  ],
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
