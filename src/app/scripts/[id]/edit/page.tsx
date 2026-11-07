import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { updateScriptAction } from "@/app/scripts/actions";
import { ScriptForm } from "@/components/script-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getScript } from "@/lib/scripts";

async function EditScriptForm({
  params,
}: {
  params: PageProps<"/scripts/[id]/edit">["params"];
}) {
  await connection();
  const { id } = await params;
  const script = await getScript(id);
  if (!script) notFound();

  return (
    <ScriptForm
      action={updateScriptAction.bind(null, script.id)}
      defaultValues={{
        title: script.title,
        topic: script.topic,
        content: script.content,
      }}
      submitLabel="Save changes"
      cancelHref={`/scripts/${script.id}`}
    />
  );
}

export default function EditScriptPage(
  props: PageProps<"/scripts/[id]/edit">,
) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit script</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EditScriptForm params={props.params} />
      </Suspense>
    </main>
  );
}
