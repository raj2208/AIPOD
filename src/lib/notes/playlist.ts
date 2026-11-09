import { parse as parseYaml } from "yaml";
import { z } from "zod";

/** The optional file that sets the order scripts are played in. */
export const PLAYLIST_PATH = "playlist.yml";

const playlistSchema = z.array(z.string().trim().min(1));

export type PlaylistResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string };

/**
 * Reads playlist.yml: a list of script ids, first to last. An empty file is
 * an empty playlist. A repeated id keeps its first place.
 */
export function parsePlaylist(raw: string): PlaylistResult {
  let data: unknown;
  try {
    data = parseYaml(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Not valid YAML: ${reason}` };
  }

  if (data === null || data === undefined) return { ok: true, ids: [] };

  const parsed = playlistSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        "Expected a list of script ids, one per line, each starting with a dash.",
    };
  }
  return { ok: true, ids: [...new Set(parsed.data)] };
}

type Orderable = { id: string; topic: string; title: string };

/**
 * Puts scripts in play order: the playlist first, in the order written, then
 * every other script by topic and title. Ids in the playlist that match no
 * script are ignored.
 */
export function orderScripts<T extends Orderable>(
  scripts: T[],
  playlist: string[],
): T[] {
  const rank = new Map(playlist.map((id, position) => [id, position]));
  return [...scripts].sort((a, b) => {
    const rankA = rank.get(a.id);
    const rankB = rank.get(b.id);
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return a.topic.localeCompare(b.topic) || a.title.localeCompare(b.title);
  });
}

/**
 * Where `id` sits in play order: the scripts either side of it, its place
 * counting from 1, and how many scripts there are. The place is 0 when the id
 * is not in the list.
 */
export function neighbours<T extends { id: string }>(
  ordered: T[],
  id: string,
): { previous: T | null; next: T | null; position: number; total: number } {
  const index = ordered.findIndex((script) => script.id === id);
  if (index === -1) {
    return { previous: null, next: null, position: 0, total: ordered.length };
  }
  return {
    previous: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
    position: index + 1,
    total: ordered.length,
  };
}
