import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ReviewPanel } from "@/components/review-panel";
import { ScriptReader } from "@/components/script-reader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/duration";
import { getNeighbours, getScript } from "@/lib/scripts";
import { estimateSeconds } from "@/lib/tts/chunks";

function BackToPlaylist() {
  return (
    <Link
      href="/scripts"
      className="-ml-2 mb-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring"
    >
      <ArrowLeft className="size-4" />
      Playlist
    </Link>
  );
}

async function ScriptDetail({
  params,
}: {
  params: PageProps<"/scripts/[id]">["params"];
}) {
  await connection();
  const { id } = await params;
  const [script, { previous, next, position, total }] = await Promise.all([
    getScript(id),
    getNeighbours(id),
  ]);
  if (!script) notFound();

  const length = formatDuration(estimateSeconds(script.content));

  return (
    <>
      <BackToPlaylist />

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
    </>
  );
}

function ScriptDetailSkeleton() {
  return (
    <>
      <BackToPlaylist />
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
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10 outline-none">
      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetail params={props.params} />
      </Suspense>
    </main>
  );
}
