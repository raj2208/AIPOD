import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PlaylistRail } from "@/components/playlist-rail";
import { ReviewPanel } from "@/components/review-panel";
import { ScriptReader } from "@/components/script-reader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollection } from "@/lib/collections";
import { formatDuration } from "@/lib/duration";
import { neighbours } from "@/lib/notes/playlist";
import { getScript } from "@/lib/scripts";
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
  const script = await getScript(id);
  if (!script) notFound();

  // A script is read inside its collection: what comes next, and what the
  // rail lists, is the rest of that collection rather than everything.
  const shelf = await getCollection(script.collection);
  const scripts = shelf?.scripts.length ? shelf.scripts : [script];
  const collection = {
    slug: script.collection,
    title: shelf?.collection.title ?? script.topic,
  };
  const { previous, next, position, total } = neighbours(scripts, id);

  const length = formatDuration(estimateSeconds(script.content));

  return (
    <div className="lg:grid lg:grid-cols-[var(--rail)_minmax(0,var(--column))] lg:gap-x-[var(--rail-gap)]">
      <PlaylistRail
        scripts={scripts}
        currentId={script.id}
        collection={collection}
      />

      <div className="min-w-0">
        <header className="mb-6">
          {/* Said as a sentence rather than joined up with middle dots, which
              is template chrome wherever it appears. */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Link
              href={`/library/${collection.slug}`}
              className="rounded-sm underline-offset-4 hover:underline focus-ring"
            >
              {collection.title}
            </Link>
            <span>
              {position > 0 ? `${position} of ${total}, ${length}` : length}
            </span>
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
      className="mx-auto w-full max-w-2xl px-4 pt-4 pb-10 outline-none lg:max-w-5xl lg:pt-8"
    >
      <Suspense fallback={<ScriptDetailSkeleton />}>
        <ScriptDetail params={props.params} />
      </Suspense>
    </main>
  );
}
