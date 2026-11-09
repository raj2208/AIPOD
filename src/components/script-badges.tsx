import { isStale, type Script } from "@/db/schema";
import { Badge } from "@/components/ui/badge";

/** Flags a script that needs the user's attention. Shows nothing otherwise. */
export function ScriptBadges({
  script,
}: {
  script: Pick<Script, "status" | "sourceHash" | "noteHash">;
}) {
  const stale = isStale(script);
  if (script.status === "approved" && !stale) return null;

  return (
    <>
      {script.status === "draft" && (
        <Badge variant="outline" title="Not marked approved yet">
          Draft
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
