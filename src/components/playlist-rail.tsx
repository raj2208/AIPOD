import Link from "next/link";

import type { Script } from "@/db/schema";
import { formatDuration } from "@/lib/duration";
import { estimateSeconds } from "@/lib/tts/chunks";
import { cn } from "@/lib/utils";

/**
 * The playlist beside the script, on screens wide enough to have room. It
 * lets you jump to any script without going back to the list. Hidden on a
 * phone, where the list has its own page.
 */
export function PlaylistRail({
  scripts,
  currentId,
}: {
  scripts: Script[];
  currentId: string;
}) {
  return (
    <aside aria-label="Playlist" className="hidden lg:block">
      <nav className="sticky top-20 max-h-[calc(100dvh-11rem)] overflow-y-auto pr-1 pb-4">
        <h2 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
          Playlist
        </h2>
        <ol className="space-y-0.5">
          {scripts.map((script, index) => {
            const current = script.id === currentId;
            return (
              <li key={script.id}>
                <Link
                  href={`/scripts/${script.id}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-ring",
                    current
                      ? "bg-accent font-medium text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className="w-4 shrink-0 pt-px text-right text-muted-foreground tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-snug">{script.title}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {formatDuration(estimateSeconds(script.content))}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
