import { formatDistanceToNow } from "date-fns";
import { TriangleAlert } from "lucide-react";

import { SyncButton } from "@/components/sync-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SyncState } from "@/db/schema";

/** Problems found by the last sync. Shows nothing when there were none. */
export function SyncErrors({ state }: { state: SyncState | null }) {
  const errors = state?.report.errors ?? [];
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <TriangleAlert />
      <AlertTitle>
        {errors.length === 1
          ? "1 file needs attention"
          : `${errors.length} files need attention`}
      </AlertTitle>
      <AlertDescription>
        <ul className="mt-1 space-y-1">
          {errors.map((error, index) => (
            <li key={`${error.path}-${index}`}>
              <code>{error.path}</code>: {error.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/** When the notes repo was last synced, with a way to sync again. */
export function SyncStatus({ state }: { state: SyncState | null }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <p>
        {state
          ? `Synced ${formatDistanceToNow(state.syncedAt, { addSuffix: true })}${
              state.commit ? ` at commit ${state.commit.slice(0, 7)}` : ""
            }.`
          : "Not synced yet."}
      </p>
      <SyncButton />
    </div>
  );
}
