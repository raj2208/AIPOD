"use client";

import { useState, useSyncExternalStore } from "react";

import { formatDuration } from "@/lib/duration";
import { sanitizeProgress } from "@/lib/tts/settings";
import { createLocalStore } from "@/lib/tts/storage";

/**
 * A thin bar under a playlist row for a script that has been started, with
 * the time left. Shows nothing for a script that has not been started. The
 * position is the one the player saves in this browser.
 */
export function RowProgress({
  scriptId,
  chunks,
  seconds,
}: {
  scriptId: string;
  /** How many sentences the script has. */
  chunks: number;
  /** Speaking time at normal speed. */
  seconds: number;
}) {
  const [store] = useState(() =>
    createLocalStore(
      `aipod.player.progress.${scriptId}`,
      { index: 0 },
      sanitizeProgress,
    ),
  );
  const { index } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  if (index <= 0 || chunks <= 0) return null;

  const done = Math.min(1, index / chunks);
  return (
    <span className="mt-2.5 flex items-center gap-3">
      <span
        role="progressbar"
        aria-label="How far through"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(done * 100)}
        className="h-1 max-w-40 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${done * 100}%` }}
        />
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDuration(seconds * (1 - done))} left
      </span>
    </span>
  );
}
