import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { sourceFromEnv } from "@/lib/notes/sources";
import { runSync, summarizeReport } from "@/lib/notes/sync";
import { isPushToBranch, verifyGitHubSignature } from "@/lib/notes/webhook";

/**
 * GitHub push webhook for the notes repo. Point it at /api/sync with content
 * type application/json and the secret from SYNC_WEBHOOK_SECRET. It runs the
 * same full comparison as the Sync button, so a missed delivery can never
 * cause drift: the next sync catches up.
 */
export async function POST(request: Request) {
  const secret = process.env.SYNC_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyGitHubSignature(secret, body, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "ping") return Response.json({ ok: true, message: "pong" });
  if (event !== "push") {
    return Response.json({ ok: true, skipped: `Ignored ${event} event.` });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Body is not JSON." }, { status: 400 });
  }
  const branch = process.env.NOTES_REF || "main";
  if (!isPushToBranch(payload, branch)) {
    return Response.json({ ok: true, skipped: `Not a push to ${branch}.` });
  }

  try {
    const result = await runSync(db, sourceFromEnv());
    revalidatePath("/library", "layout");
    revalidatePath("/scripts", "layout");
    return Response.json({ ok: true, summary: summarizeReport(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
