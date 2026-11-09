import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { ScriptBadges } from "@/components/script-badges";
import { SyncPanel } from "@/components/sync-panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Script } from "@/db/schema";
import { formatDuration } from "@/lib/duration";
import { getSyncState, listScripts } from "@/lib/scripts";
import { estimateSeconds } from "@/lib/tts/chunks";

export const metadata = { title: "Scripts | AIPOD" };

function ScriptsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

function ScriptsTable({ scripts }: { scripts: Script[] }) {
  const lengths = scripts.map((script) => estimateSeconds(script.content));
  const totalSeconds = lengths.reduce((sum, seconds) => sum + seconds, 0);

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">
        {scripts.length} {scripts.length === 1 ? "script" : "scripts"}, about{" "}
        {formatDuration(totalSeconds)} at normal speed, played in this order.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead className="text-right">Length</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scripts.map((script, position) => (
            <TableRow key={script.id}>
              <TableCell className="text-muted-foreground">
                {position + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/scripts/${script.id}`}
                  className="font-medium hover:underline"
                >
                  {script.title}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{script.topic}</Badge>
                  <ScriptBadges script={script} />
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDuration(lengths[position])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

async function ScriptsContent() {
  await connection();
  const [scripts, syncState] = await Promise.all([
    listScripts(),
    getSyncState(),
  ]);

  return (
    <>
      <SyncPanel state={syncState} />
      {scripts.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No scripts yet. Add a script to your notes repo, then run{" "}
          <code className="rounded bg-muted px-1 py-0.5">pnpm sync</code>.
        </p>
      ) : (
        <ScriptsTable scripts={scripts} />
      )}
    </>
  );
}

export default function ScriptsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Scripts</h1>
        <p className="text-sm text-muted-foreground">
          Spoken scripts, loaded from your notes repo.
        </p>
      </div>

      <Suspense fallback={<ScriptsSkeleton />}>
        <ScriptsContent />
      </Suspense>
    </main>
  );
}
