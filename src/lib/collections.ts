import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  collections,
  type CollectionSummary,
  type Script,
} from "@/db/schema";
import { listScripts } from "@/lib/scripts";

// Collections are read-only here, like scripts: they come from the notes repo
// and are loaded by a sync. See docs/architecture.md.

/** A collection and the scripts filed under it, in play order. */
export type Shelf = {
  collection: CollectionSummary;
  scripts: Script[];
};

/** Everything but the cover bytes, which no page should carry in its payload. */
const summary = {
  slug: collections.slug,
  folder: collections.folder,
  title: collections.title,
  description: collections.description,
  position: collections.position,
  metaPath: collections.metaPath,
  metaHash: collections.metaHash,
  coverPath: collections.coverPath,
  coverHash: collections.coverHash,
  coverType: collections.coverType,
  removedAt: collections.removedAt,
  createdAt: collections.createdAt,
  updatedAt: collections.updatedAt,
};

/** Collections in library order: the places they ask for, then by title. */
export async function listCollections(): Promise<Shelf[]> {
  const [rows, scripts] = await Promise.all([
    db
      .select(summary)
      .from(collections)
      .where(isNull(collections.removedAt))
      .orderBy(
        sql`${collections.position} asc nulls last`,
        asc(collections.title),
      ),
    listScripts(),
  ]);

  const byCollection = new Map<string, Script[]>();
  for (const script of scripts) {
    const list = byCollection.get(script.collection);
    if (list) list.push(script);
    else byCollection.set(script.collection, [script]);
  }

  return rows.map((collection) => ({
    collection,
    scripts: byCollection.get(collection.slug) ?? [],
  }));
}

export async function getCollection(slug: string): Promise<Shelf | null> {
  const [collection] = await db
    .select(summary)
    .from(collections)
    .where(and(eq(collections.slug, slug), isNull(collections.removedAt)));
  if (!collection) return null;

  const scripts = await listScripts();
  return {
    collection,
    scripts: scripts.filter((script) => script.collection === slug),
  };
}

/** The cover image itself, for the route that serves it. */
export async function getCover(
  slug: string,
): Promise<{ data: Buffer; type: string; hash: string } | null> {
  const [row] = await db
    .select({
      data: collections.coverData,
      type: collections.coverType,
      hash: collections.coverHash,
    })
    .from(collections)
    .where(eq(collections.slug, slug));
  if (!row?.data || !row.type || !row.hash) return null;
  return { data: row.data, type: row.type, hash: row.hash };
}
