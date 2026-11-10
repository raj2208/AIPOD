import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { RowProgress } from "@/components/row-progress";
import { ScriptBadges } from "@/components/script-badges";
import type { Script } from "@/db/schema";
import { formatDuration } from "@/lib/duration";

/** One script in the playlist. The whole row is the tap target. */
export function ScriptRow({
  script,
  position,
  seconds,
  chunks,
  showTopic = true,
}: {
  script: Script;
  position: number;
  seconds: number;
  chunks: number;
  /** Off inside a collection, where every row would say the same thing. */
  showTopic?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/scripts/${script.id}`}
        className="flex min-h-[4.5rem] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted focus-ring-inset"
      >
        <span
          aria-hidden
          className="w-5 shrink-0 text-center text-sm text-muted-foreground tabular-nums"
        >
          {position}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 leading-snug font-medium">
            {script.title}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              {showTopic ? `${script.topic}, ` : ""}
              {formatDuration(seconds)}
            </span>
            <ScriptBadges script={script} />
          </span>
          <RowProgress scriptId={script.id} chunks={chunks} seconds={seconds} />
        </span>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground/50"
        />
      </Link>
    </li>
  );
}
