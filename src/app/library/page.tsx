import { Library } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { CollectionCard } from "@/components/collection-card";
import { ContinueListening } from "@/components/continue-listening";
import { Skeleton } from "@/components/ui/skeleton";
import { StatePanel } from "@/components/state-panel";
import { SyncErrors, SyncStatus } from "@/components/sync-panel";
import { listCollections } from "@/lib/collections";
import { formatDuration } from "@/lib/duration";
import { getSyncState } from "@/lib/scripts";
import { buildChunks, estimateSeconds } from "@/lib/tts/chunks";

export const metadata = { title: "Library | AIPOD" };

function ShelfSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((card) => (
        <div key={card} className="overflow-hidden rounded-2xl border">
          <Skeleton className="aspect-3/2 rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <StatePanel icon={Library} title="Your library is empty">
      <p>Collections are the folders inside your notes repo.</p>
      <ol className="mt-3 space-y-1 text-left text-sm">
        <li>
          1. Put a note in a folder, such as{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">
            notes/terraform/basics.md
          </code>
          .
        </li>
        <li>2. Run /script on it, then commit and push.</li>
        <li>3. Press Sync below.</li>
      </ol>
    </StatePanel>
  );
}

async function LibraryContent() {
  await connection();
  const [shelves, syncState] = await Promise.all([
    listCollections(),
    getSyncState(),
  ]);

  const scripts = shelves.flatMap((shelf) => shelf.scripts);
  const seconds = scripts.reduce(
    (total, script) => total + estimateSeconds(script.content),
    0,
  );

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Library</h1>
        <p className="mt-1 text-muted-foreground">
          {shelves.length === 0
            ? "Your collections will appear here."
            : `${shelves.length} ${shelves.length === 1 ? "collection" : "collections"}, ${scripts.length} ${scripts.length === 1 ? "script" : "scripts"}, about ${formatDuration(seconds)} in all`}
        </p>
      </header>

      <ContinueListening
        scripts={scripts.map((script) => ({
          id: script.id,
          title: script.title,
          chunks: buildChunks(script.content).length,
          seconds: estimateSeconds(script.content),
        }))}
      />
      <SyncErrors state={syncState} />

      {shelves.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <ul className="grid animate-in grid-cols-2 gap-4 duration-300 fade-in-0 slide-in-from-bottom-2 sm:grid-cols-3">
          {shelves.map((shelf) => (
            <CollectionCard
              key={shelf.collection.slug}
              collection={shelf.collection}
              scripts={shelf.scripts}
            />
          ))}
        </ul>
      )}

      <SyncStatus state={syncState} />
    </>
  );
}

export default function LibraryPage() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 outline-none sm:pt-12"
    >
      <Suspense fallback={<ShelfSkeleton />}>
        <LibraryContent />
      </Suspense>
    </main>
  );
}
