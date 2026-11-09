"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { formatDuration } from "@/lib/duration";
import { resumeStore } from "@/lib/tts/resume";

export type ContinueScript = {
  id: string;
  title: string;
  /** How many sentences the script has, to show how far through it is. */
  chunks: number;
  /** Speaking time at normal speed. */
  seconds: number;
};

/**
 * Takes the listener back to the script they stopped part way through. Shown
 * only when there is one, and the position is remembered in this browser.
 */
export function ContinueListening({ scripts }: { scripts: ContinueScript[] }) {
  const resume = useSyncExternalStore(
    resumeStore.subscribe,
    resumeStore.getSnapshot,
    resumeStore.getServerSnapshot,
  );

  const script = scripts.find((item) => item.id === resume.scriptId);
  if (!script || resume.index <= 0) return null;

  const done = Math.min(1, resume.index / Math.max(1, script.chunks));
  const left = formatDuration(script.seconds * (1 - done));

  return (
    <Link
      href={`/scripts/${script.id}`}
      className="group mb-8 flex items-center gap-4 rounded-2xl bg-primary p-4 text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-[0.99] focus-ring dark:border dark:border-primary/30 dark:bg-primary/15 dark:text-foreground dark:shadow-none"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium opacity-70">
          Continue listening
        </span>
        <span className="mt-0.5 block truncate text-base font-semibold">
          {script.title}
        </span>
        <span className="mt-3 flex items-center gap-3">
          <span
            role="progressbar"
            aria-label="How far through"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(done * 100)}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-foreground/25 dark:bg-foreground/15"
          >
            <span
              className="block h-full rounded-full bg-primary-foreground dark:bg-primary"
              style={{ width: `${done * 100}%` }}
            />
          </span>
          <span className="shrink-0 text-xs opacity-70 tabular-nums">
            {left} left
          </span>
        </span>
      </span>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary transition-transform group-hover:scale-105 dark:bg-primary dark:text-primary-foreground">
        <Play className="size-5 fill-current" />
      </span>
    </Link>
  );
}
