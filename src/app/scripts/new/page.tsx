import { createScriptAction } from "@/app/scripts/actions";
import { ScriptForm } from "@/components/script-form";

export const metadata = { title: "New script | AIPOD" };

export default function NewScriptPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">New script</h1>
      <ScriptForm
        action={createScriptAction}
        submitLabel="Create script"
        cancelHref="/scripts"
      />
    </main>
  );
}
