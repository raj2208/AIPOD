import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { CollectionCover } from "@/components/collection-card";
import { PlayAllButton } from "@/components/play-all-button";
import { ScriptRow } from "@/components/script-row";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollection } from "@/lib/collections";
import { formatDuration } from "@/lib/duration";
import { buildChunks, estimateSeconds } from "@/lib/tts/chunks";

export async function generateMetadata({
  params,
}: PageProps<"/library/[slug]">) {
  await connection();
  const { slug } = await params;
  const shelf = await getCollection(slug);
  return {
    title: shelf ? `${shelf.collection.title} | AIPOD` : "Collection not found | AIPOD",
  };
}

async function CollectionDetail({
  params,
}: {
  params: PageProps<"/library/[slug]">["params"];
}) {
  await connection();
  const { slug } = await params;
  const shelf = await getCollection(slug);
  if (!shelf) notFound();

  const { collection, scripts } = shelf;
  const seconds = scripts.reduce(
    (total, script) => total + estimateSeconds(script.content),
    0,
  );

  return (
    <>
      <Link
        href="/library"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-sm pr-2 text-sm text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Library
      </Link>

      {/* On a phone the cover is a thumbnail beside the title: this is a page
          for listening from, so the scripts should be near the top. */}
      <header className="mt-2 mb-8 grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-6">
        <span className="col-start-1 row-start-1 block overflow-hidden rounded-xl border bg-muted sm:row-span-2 sm:rounded-2xl">
          <CollectionCover
            collection={collection}
            className="aspect-3/2 size-full object-cover"
          />
        </span>

        <div className="col-start-2 row-start-1">
          <h1 className="text-2xl leading-tight font-semibold text-balance sm:text-3xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
              {collection.description}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {scripts.length === 0
              ? "No scripts in this collection yet."
              : `${scripts.length} ${scripts.length === 1 ? "script" : "scripts"}, about ${formatDuration(seconds)}`}
          </p>
        </div>

        {scripts.length > 0 && (
          <div className="col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2">
            <PlayAllButton firstId={scripts[0].id} />
          </div>
        )}
      </header>

      {scripts.length > 0 && (
        <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
          {scripts.map((script, index) => (
            <ScriptRow
              key={script.id}
              script={script}
              position={index + 1}
              seconds={estimateSeconds(script.content)}
              chunks={buildChunks(script.content).length}
              showTopic={false}
            />
          ))}
        </ol>
      )}
    </>
  );
}

function CollectionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-20" />
      <div className="gap-6 sm:grid sm:grid-cols-[14rem_minmax(0,1fr)]">
        <Skeleton className="aspect-3/2 rounded-2xl" />
        <div className="mt-4 space-y-3 sm:mt-0">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage(props: PageProps<"/library/[slug]">) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 outline-none sm:pt-8"
    >
      <div className="max-w-3xl">
        <Suspense fallback={<CollectionSkeleton />}>
          <CollectionDetail params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}
