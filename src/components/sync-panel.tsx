import { formatDistanceToNow } from "date-fns";
import { TriangleAlert } from "lucide-react";

import { SyncButton } from "@/components/sync-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SyncState } from "@/db/schema";

/** Shows when the notes repo was last synced, and problems from that sync. */
export function SyncPanel({ state }: { state: SyncState | null }) {
  const errors = state?.report.errors ?? [];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {state
            ? `Synced ${formatDistanceToNow(state.syncedAt, { addSuffix: true })}${
                state.commit ? ` at commit ${state.commit.slice(0, 7)}` : ""
              }.`
            : "Not synced yet."}
        </p>
        <SyncButton />
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>
            {errors.length === 1
              ? "1 file needs attention"
              : `${errors.length} files need attention`}
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-1">
              {errors.map((error) => (
                <li key={error.path}>
                  <code>{error.path}</code>: {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
