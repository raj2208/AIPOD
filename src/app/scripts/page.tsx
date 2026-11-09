import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { ScriptBadges } from "@/components/script-badges";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listScripts } from "@/lib/scripts";

export const metadata = { title: "Scripts | AIPOD" };

function ScriptsTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

async function ScriptsTable() {
  await connection();
  const scripts = await listScripts();

  return (
    scripts.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No scripts yet. Add a script to your notes repo, then run{" "}
          <code className="rounded bg-muted px-1 py-0.5">pnpm sync</code>.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scripts.map((script) => (
              <TableRow key={script.id}>
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
                  {script.updatedAt.toLocaleDateString("en-US", {
                    dateStyle: "medium",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
  );
}

export default function ScriptsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Scripts</h1>
          <p className="text-sm text-muted-foreground">
            Spoken scripts, loaded from your notes repo.
          </p>
        </div>
      </div>

      <Suspense fallback={<ScriptsTableSkeleton />}>
        <ScriptsTable />
      </Suspense>
    </main>
  );
}
