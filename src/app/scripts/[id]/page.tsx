import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PlaylistRail } from "@/components/playlist-rail";
import { ReviewPanel } from "@/components/review-panel";
import { ScriptReader } from "@/components/script-reader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/duration";
import { neighbours } from "@/lib/notes/playlist";
import { getScript, listScripts } from "@/lib/scripts";
import { estimateSeconds } from "@/lib/tts/chunks";

export async function generateMetadata({ params }: PageProps<"/scripts/[id]">) {
  await connection();
  const { id } = await params;
  const script = await getScript(id);
  return {
    title: script ? `${script.title} | AIPOD` : "Script not found | AIPOD",
  };
}

async function ScriptDetail({
  params,
}: {
  params: PageProps<"/scripts/[id]">["params"];
}) {
  await connection();
  const { id } = await params;
  const [script, scripts] = await Promise.all([getScript(id), listScripts()]);
  if (!script) notFound();
  const { previous, next, position, total } = neighbours(scripts, id);

  const length = formatDuration(estimateSeconds(script.content));

  return (
    <div className="lg:grid lg:grid-cols-[var(--rail)_minmax(0,var(--column))] lg:gap-x-[var(--rail-gap)]">
      <PlaylistRail scripts={scripts} currentId={script.id} />

      <div className="min-w-0">
        <header className="mb-6">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {position > 0 && (
              <>
                <span>
                  {position} of {total}
                </span>
                <span aria-hidden>·</span>
              </>
            )}
            <span>{script.topic}</span>
            <span aria-hidden>·</span>
            <span>{length}</span>
            {script.status === "draft" && (
              <Badge variant="outline" title="Not marked approved yet">
                Draft
              </Badge>
            )}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-balance">
            {script.title}
          </h1>
        </header>

        <ReviewPanel script={script} />

        <ScriptReader
          scriptId={script.id}
          title={script.title}
          topic={script.topic}
          content={script.content}
          previous={previous && { id: previous.id, title: previous.title }}
          next={next && { id: next.id, title: next.title }}
        />
      </div>
    </div>
  );
}

function ScriptDetailSkeleton() {
  return (
    <>
      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    </>
  );
}

export default function ScriptPage(props: PageProps<"/scripts/[id]">) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10 outline-none lg:max-w-[calc(var(--rail)+var(--rail-gap)+var(--column)+2rem)] lg:pt-8"
    >
      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetail params={props.params} />
      </Suspense>
    </main>
  );
}
