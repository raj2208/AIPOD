import "server-only";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { scripts, type Script } from "@/db/schema";

export const scriptInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  topic: z.string().trim().min(1, "Topic is required").max(100),
  content: z.string().trim().min(1, "Script text is required"),
});

export type ScriptInput = z.infer<typeof scriptInputSchema>;

const idSchema = z.uuid();

export async function listScripts(): Promise<Script[]> {
  return db.select().from(scripts).orderBy(desc(scripts.updatedAt));
}

export async function getScript(id: string): Promise<Script | null> {
  // An id that is not a UUID can never match, and would make Postgres error.
  if (!idSchema.safeParse(id).success) return null;
  const [row] = await db.select().from(scripts).where(eq(scripts.id, id));
  return row ?? null;
}

export async function createScript(input: ScriptInput): Promise<Script> {
  const [row] = await db.insert(scripts).values(input).returning();
  return row;
}

export async function updateScript(
  id: string,
  input: ScriptInput,
): Promise<Script | null> {
  if (!idSchema.safeParse(id).success) return null;
  const [row] = await db
    .update(scripts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(scripts.id, id))
    .returning();
  return row ?? null;
}

export async function deleteScript(id: string): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  await db.delete(scripts).where(eq(scripts.id, id));
}
