"use client";

import { useMemo, useSyncExternalStore } from "react";

import { sanitizeProgress } from "@/lib/tts/settings";
import { createLocalStore } from "@/lib/tts/storage";

export type ScriptProgress = { id: string };

/**
 * How far through a collection the listener is, counted in this browser. A
 * script counts as started once the player has moved past its first line.
 * Shows nothing until at least one has been.
 */
export function CollectionProgress({ scripts }: { scripts: ScriptProgress[] }) {
  // One subscription over every script's saved position. The snapshot is a
  // count, so React can compare it by value.
  const store = useMemo(() => {
    const stores = scripts.map((script) =>
      createLocalStore(
        `aipod.player.progress.${script.id}`,
        { index: 0 },
        sanitizeProgress,
      ),
    );
    return {
      subscribe(onChange: () => void) {
        const stop = stores.map((item) => item.subscribe(onChange));
        return () => stop.forEach((off) => off());
      },
      getSnapshot: () =>
        stores.filter((item) => item.getSnapshot().index > 0).length,
      getServerSnapshot: () => 0,
    };
  }, [scripts]);

  const started = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  if (started === 0 || scripts.length === 0) return null;

  const done = Math.min(1, started / scripts.length);
  return (
    <span className="mt-2 flex items-center gap-2">
      <span
        role="progressbar"
        aria-label="How far through this collection"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(done * 100)}
        className="h-1 w-10 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${done * 100}%` }}
        />
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {started} of {scripts.length} started
      </span>
    </span>
  );
}
