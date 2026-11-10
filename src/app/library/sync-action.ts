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
    // A sync can change any page: the library, any collection, any script.
    revalidatePath("/library", "layout");
    revalidatePath("/scripts", "layout");
    return { status: "done", summary: summarizeReport(result) };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Sync failed.",
    };
  }
}
