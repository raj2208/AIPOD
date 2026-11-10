"use client";

import { RefreshCw } from "lucide-react";
import { useActionState, useEffect } from "react";

import {
  syncNowAction,
  type SyncActionState,
} from "@/app/library/sync-action";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const IDLE: SyncActionState = { status: "idle" };

/** Pulls the latest scripts from the notes repo and says how it went. */
export function SyncButton() {
  const [state, action, pending] = useActionState(syncNowAction, IDLE);

  // The result arrives as a toast, so it is seen wherever you are on the page
  // and announced to screen readers.
  useEffect(() => {
    if (state.status === "done") {
      toast.add({ type: "success", title: "Synced", description: state.summary });
    } else if (state.status === "error") {
      toast.add({
        type: "error",
        title: "Could not sync",
        description: state.message,
        timeout: 8000,
      });
    }
  }, [state]);

  return (
    <form action={action}>
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
    </form>
  );
}
