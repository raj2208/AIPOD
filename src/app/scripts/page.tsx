import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

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
          No scripts yet. Create your first one.
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
                  <Badge variant="secondary">{script.topic}</Badge>
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
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Scripts</h1>
          <p className="text-sm text-muted-foreground">
            Spoken scripts to revise from.
          </p>
        </div>
        <Link href="/scripts/new" className={cn(buttonVariants())}>
          <Plus data-icon="inline-start" />
          New script
        </Link>
      </div>

      <Suspense fallback={<ScriptsTableSkeleton />}>
        <ScriptsTable />
      </Suspense>
    </main>
  );
}
