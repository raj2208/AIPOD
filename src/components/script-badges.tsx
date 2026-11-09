import { isStale, type Script } from "@/db/schema";
import { needsReview } from "@/lib/fidelity";
import { Badge } from "@/components/ui/badge";

/** Flags a script that needs the user's attention. Shows nothing otherwise. */
export function ScriptBadges({
  script,
}: {
  script: Pick<Script, "status" | "sourceHash" | "noteHash" | "fidelity">;
}) {
  const stale = isStale(script);
  const check = !stale && script.fidelity !== null && needsReview(script.fidelity);
  if (script.status === "approved" && !stale && !check) return null;

  return (
    <>
      {script.status === "draft" && (
        <Badge variant="outline" title="Not marked approved yet">
          Draft
        </Badge>
      )}
      {check && (
        <Badge variant="secondary" title="The automatic fact check found differences from the note">
          Check facts
        </Badge>
      )}
      {stale && (
        <Badge variant="destructive" title="The note changed after this script was written">
          Note changed
        </Badge>
      )}
    </>
  );
}
