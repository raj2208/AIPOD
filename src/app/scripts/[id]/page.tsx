import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { FidelityNotice } from "@/components/fidelity-notice";
import { NoteComparison } from "@/components/note-comparison";
import { ScriptBadges } from "@/components/script-badges";
import { ScriptReader } from "@/components/script-reader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getNeighbours, getScript } from "@/lib/scripts";

async function ScriptDetail({
  params,
}: {
  params: PageProps<"/scripts/[id]">["params"];
}) {
  await connection();
  const { id } = await params;
  const [script, { previous, next }] = await Promise.all([
    getScript(id),
    getNeighbours(id),
  ]);
  if (!script) notFound();

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{script.topic}</Badge>
          <ScriptBadges script={script} />
        </div>
        <h1 className="text-3xl font-semibold">{script.title}</h1>
        <p className="text-xs text-muted-foreground">
          From <code>{script.notePath}</code>
        </p>
      </div>

      <FidelityNotice script={script} />
      <NoteComparison script={script} />

      <ScriptReader
        scriptId={script.id}
        title={script.title}
        topic={script.topic}
        content={script.content}
        previous={previous && { id: previous.id, title: previous.title }}
        next={next && { id: next.id, title: next.title }}
      />
    </>
  );
}

function ScriptDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function ScriptPage(props: PageProps<"/scripts/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/scripts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All scripts
      </Link>

      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetail params={props.params} />
      </Suspense>
    </main>
  );
}
