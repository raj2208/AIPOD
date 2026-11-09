import { connection } from "next/server";
import { Suspense } from "react";

import { ContinueListening } from "@/components/continue-listening";
import { PlayAllButton } from "@/components/play-all-button";
import { ScriptRow } from "@/components/script-row";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncErrors, SyncStatus } from "@/components/sync-panel";
import type { Script } from "@/db/schema";
import { formatDuration } from "@/lib/duration";
import { getSyncState, listScripts } from "@/lib/scripts";
import { buildChunks, estimateSeconds } from "@/lib/tts/chunks";

export const metadata = { title: "Playlist | AIPOD" };

function PlaylistSkeleton() {
  return (
    <div className="divide-y rounded-2xl border">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPlaylist() {
  return (
    <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      Nothing to play yet. Add a script to your notes repo, then run{" "}
      <code className="rounded bg-muted px-1 py-0.5">pnpm sync</code>.
    </p>
  );
}

function Playlist({ scripts }: { scripts: Script[] }) {
  return (
    <ol className="animate-in divide-y overflow-hidden rounded-2xl border bg-card duration-300 fade-in-0 slide-in-from-bottom-2">
      {scripts.map((script, index) => (
        <ScriptRow
          key={script.id}
          script={script}
          position={index + 1}
          seconds={estimateSeconds(script.content)}
          chunks={buildChunks(script.content).length}
        />
      ))}
    </ol>
  );
}

async function PlaylistContent() {
  await connection();
  const [scripts, syncState] = await Promise.all([
    listScripts(),
    getSyncState(),
  ]);

  const total = scripts.reduce(
    (sum, script) => sum + estimateSeconds(script.content),
    0,
  );

  return (
    <>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Playlist</h1>
          <p className="mt-1 text-muted-foreground">
            {scripts.length === 0
              ? "Your revision scripts will appear here."
              : `${scripts.length} ${scripts.length === 1 ? "script" : "scripts"} · about ${formatDuration(total)} in all`}
          </p>
        </div>
        {scripts.length > 0 && <PlayAllButton firstId={scripts[0].id} />}
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
      {scripts.length === 0 ? (
        <EmptyPlaylist />
      ) : (
        <Playlist scripts={scripts} />
      )}
      <SyncStatus state={syncState} />
    </>
  );
}

export default function ScriptsPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 outline-none sm:pt-12">
      <Suspense fallback={<PlaylistSkeleton />}>
        <PlaylistContent />
      </Suspense>
    </main>
  );
}
