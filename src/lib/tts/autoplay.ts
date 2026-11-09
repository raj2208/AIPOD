/**
 * Passing "start playing" from one script page to the next.
 *
 * When a script ends and the next one opens, the new page needs to know it was
 * opened by playback and should start by itself, rather than because someone
 * browsed to it. The request is kept in session storage, names the script it is
 * for, and expires quickly so it can never start something later by surprise.
 */

const KEY = "aipod.autoplay";
export const AUTOPLAY_WINDOW_MS = 20_000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null; // Storage can be blocked.
  }
}

export function requestAutoplay(
  scriptId: string,
  now: number = Date.now(),
  storage: StorageLike | null = defaultStorage(),
) {
  try {
    storage?.setItem(KEY, JSON.stringify({ scriptId, at: now }));
  } catch {
    // Without storage the next script simply waits to be played by hand.
  }
}

/** True when this script was opened by playback that should carry on. */
export function isAutoplayRequested(
  scriptId: string,
  now: number = Date.now(),
  storage: StorageLike | null = defaultStorage(),
): boolean {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return false;
    const request = JSON.parse(raw) as { scriptId?: unknown; at?: unknown };
    return (
      request.scriptId === scriptId &&
      typeof request.at === "number" &&
      now - request.at >= 0 &&
      now - request.at <= AUTOPLAY_WINDOW_MS
    );
  } catch {
    return false;
  }
}

export function clearAutoplay(storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
