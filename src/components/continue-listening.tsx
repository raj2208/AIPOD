"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { resumeStore } from "@/lib/tts/resume";

/**
 * Takes the listener back to the script they stopped part way through. Shown
 * only when there is one, and the position is remembered in this browser.
 */
export function ContinueListening({
  scripts,
}: {
  scripts: { id: string; title: string }[];
}) {
  const resume = useSyncExternalStore(
    resumeStore.subscribe,
    resumeStore.getSnapshot,
    resumeStore.getServerSnapshot,
  );

  const script = scripts.find((item) => item.id === resume.scriptId);
  if (!script || resume.index <= 0) return null;

  return (
    <Link
      href={`/scripts/${script.id}`}
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border bg-card p-4 hover:bg-muted"
    >
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">
          Continue listening
        </span>
        <span className="block truncate font-medium">{script.title}</span>
      </span>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Play className="size-4" />
      </span>
    </Link>
  );
}
