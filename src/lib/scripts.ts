import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { scripts, syncState, type Script, type SyncState } from "@/db/schema";
import { neighbours, orderScripts } from "@/lib/notes/playlist";
import { SYNC_STATE_ID } from "@/lib/notes/types";

// Scripts are read-only here: they come from the notes repo and are loaded by
// a sync (see docs/architecture.md). Removed scripts are hidden, not deleted.

/** Scripts in play order: the playlist first, then the rest by topic. */
export async function listScripts(): Promise<Script[]> {
  const [rows, state] = await Promise.all([
    db.select().from(scripts).where(isNull(scripts.removedAt)),
    getSyncState(),
  ]);
  return orderScripts(rows, state?.playlist ?? []);
}

/** The scripts either side of one in play order. */
export async function getNeighbours(id: string) {
  return neighbours(await listScripts(), id);
}

export async function getScript(id: string): Promise<Script | null> {
  const [row] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, id), isNull(scripts.removedAt)));
  return row ?? null;
}

export async function getSyncState(): Promise<SyncState | null> {
  const [row] = await db
    .select()
    .from(syncState)
    .where(eq(syncState.id, SYNC_STATE_ID));
  return row ?? null;
}

