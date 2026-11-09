"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import {
  syncNowAction,
  type SyncActionState,
} from "@/app/scripts/sync-action";
import { Button } from "@/components/ui/button";

const IDLE: SyncActionState = { status: "idle" };

/**
 * Sits inside a flex row: the button joins the row and the result message
 * drops onto its own line underneath.
 */
export function SyncButton() {
  const [state, action, pending] = useActionState(syncNowAction, IDLE);

  return (
    <form action={action} className="contents">
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        className="-mr-3 h-11 px-3"
      >
        <RefreshCw
          data-icon="inline-start"
          className={pending ? "animate-spin" : undefined}
        />
        {pending ? "Syncing..." : "Sync now"}
      </Button>
      <p role="status" className="basis-full text-sm empty:hidden">
        {state.status === "done" && state.summary}
        {state.status === "error" && (
          <span className="text-destructive">{state.message}</span>
        )}
      </p>
    </form>
  );
}
