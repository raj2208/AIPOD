"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { sourceFromEnv } from "@/lib/notes/sources";
import { runSync, summarizeReport } from "@/lib/notes/sync";

export type SyncActionState =
  | { status: "idle" }
  | { status: "done"; summary: string }
  | { status: "error"; message: string };

/** Loads changed scripts from the notes repo. Triggered by the Sync button. */
export async function syncNowAction(): Promise<SyncActionState> {
  try {
    const result = await runSync(db, sourceFromEnv());
    revalidatePath("/scripts");
    return { status: "done", summary: summarizeReport(result) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Sync failed.",
    };
  }
}
