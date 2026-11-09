import { isStale, type Script } from "@/db/schema";

/**
 * The note a script was written from, so a draft can be read against it. Closed
 * until asked for. Once the note has changed, this is still the old version,
 * which is the one the script has to match.
 */
export function NoteComparison({
  script,
}: {
  script: Pick<Script, "notePath" | "noteContent" | "sourceHash" | "noteHash">;
}) {
  if (!script.noteContent) return null;

  return (
    <details className="mb-6 rounded-lg border">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
        Compare with your note
        <span className="ml-2 font-normal text-muted-foreground">
          {isStale(script)
            ? "as it was when this script was written"
            : script.notePath}
        </span>
      </summary>
      <pre
        tabIndex={0}
        aria-label={`Text of ${script.notePath}`}
        className="max-h-96 overflow-auto border-t px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
      >
        {script.noteContent}
      </pre>
    </details>
  );
}
