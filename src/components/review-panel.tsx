import { ChevronDown, CircleAlert, FileText, TriangleAlert } from "lucide-react";

import { isStale, type Script } from "@/db/schema";
import { needsReview } from "@/lib/fidelity";
import { cn } from "@/lib/utils";

type Props = {
  script: Pick<
    Script,
    "status" | "notePath" | "noteContent" | "sourceHash" | "noteHash" | "fidelity"
  >;
};

/**
 * Everything about how far to trust a script, in one row that opens on
 * demand: whether the note has changed, what the automatic fact check found,
 * and the note itself to read the script against. Closed, it is one line.
 */
export function ReviewPanel({ script }: Props) {
  const stale = isStale(script);
  const report = script.fidelity;
  const flagged = !stale && report !== null && needsReview(report);
  const hasNote = Boolean(script.noteContent);

  if (!stale && !flagged && !hasNote) return null;

  const differences = report
    ? report.missing.length + report.added.length + (report.tooShort ? 1 : 0)
    : 0;

  const tone = stale ? "danger" : flagged ? "warning" : "neutral";
  const Icon = stale ? TriangleAlert : flagged ? CircleAlert : FileText;
  const title = stale
    ? script.noteHash
      ? "Your note has changed"
      : "Your note is missing"
    : flagged
      ? "Check against your note"
      : "Compare with your note";
  const hint = stale
    ? "This script may be out of date."
    : flagged
      ? `${differences} ${differences === 1 ? "difference" : "differences"} found.`
      : script.status === "draft"
        ? "Read it against your note first."
        : "The note this was written from.";

  return (
    <details
      className={cn(
        "group mb-8 overflow-hidden rounded-xl border",
        tone === "danger" && "border-destructive/30 bg-destructive/5",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/5 dark:border-amber-400/30",
        tone === "neutral" && "bg-card",
      )}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 select-none focus-ring-inset [&::-webkit-details-marker]:hidden">
        <Icon
          aria-hidden
          className={cn(
            "size-5 shrink-0",
            tone === "danger" && "text-destructive",
            tone === "warning" && "text-amber-600 dark:text-amber-400",
            tone === "neutral" && "text-muted-foreground",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block leading-snug font-medium">{title}</span>
          <span className="block text-sm text-muted-foreground">{hint}</span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="space-y-5 border-t px-4 py-4 text-sm">
        {stale && (
          <p>
            <code className="text-xs">{script.notePath}</code>{" "}
            {script.noteHash
              ? "changed after this script was written."
              : "could not be found."}{" "}
            Run <code className="text-xs">/script</code> in your notes repo to
            refresh the script.
          </p>
        )}

        {flagged && report && (
          <div>
            <p className="text-muted-foreground">
              It is only a guide: the script may be saying the same thing in
              different words.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              {report.missing.length > 0 && (
                <li>
                  Not found in the script:{" "}
                  {report.missing.map((term, index) => (
                    <span key={term}>
                      {index > 0 && ", "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {term}
                      </code>
                    </span>
                  ))}
                </li>
              )}
              {report.added.length > 0 && (
                <li>
                  Numbers in the script that are not in your note:{" "}
                  {report.added.join(", ")}
                </li>
              )}
              {report.tooShort && (
                <li>
                  Much shorter than the note ({report.scriptWords} words
                  against {report.noteWords}), so points may be missing.
                </li>
              )}
            </ul>
          </div>
        )}

        {hasNote && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {stale
                ? "Your note as it was when this script was written"
                : "Your note"}{" "}
              · <code>{script.notePath}</code>
            </p>
            <pre
              tabIndex={0}
              aria-label={`Text of ${script.notePath}`}
              className="max-h-80 overflow-auto rounded-lg border bg-background px-3 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
            >
              {script.noteContent}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
