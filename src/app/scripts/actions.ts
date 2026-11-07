"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createScript,
  deleteScript,
  scriptInputSchema,
  updateScript,
} from "@/lib/scripts";

export type ScriptFormState = {
  errors?: Partial<Record<"title" | "topic" | "content", string[]>>;
  message?: string;
};

function parseForm(formData: FormData) {
  return scriptInputSchema.safeParse({
    title: formData.get("title"),
    topic: formData.get("topic"),
    content: formData.get("content"),
  });
}

export async function createScriptAction(
  _prev: ScriptFormState,
  formData: FormData,
): Promise<ScriptFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const script = await createScript(parsed.data);
  revalidatePath("/scripts");
  redirect(`/scripts/${script.id}`);
}

export async function updateScriptAction(
  id: string,
  _prev: ScriptFormState,
  formData: FormData,
): Promise<ScriptFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const script = await updateScript(id, parsed.data);
  if (!script) return { message: "This script no longer exists." };

  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
  redirect(`/scripts/${id}`);
}

export async function deleteScriptAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await deleteScript(id);
  revalidatePath("/scripts");
  redirect("/scripts");
}
