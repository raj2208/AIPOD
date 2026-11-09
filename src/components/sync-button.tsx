"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import {
  syncNowAction,
  type SyncActionState,
} from "@/app/scripts/sync-action";
import { Button } from "@/components/ui/button";

const IDLE: SyncActionState = { status: "idle" };

export function SyncButton() {
  const [state, action, pending] = useActionState(syncNowAction, IDLE);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="outline" disabled={pending}>
        <RefreshCw
          data-icon="inline-start"
          className={pending ? "animate-spin" : undefined}
        />
        {pending ? "Syncing..." : "Sync now"}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {state.status === "done" && state.summary}
        {state.status === "error" && (
          <span className="text-destructive">{state.message}</span>
        )}
      </p>
    </form>
  );
}
