import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ScriptNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Script not found</h1>
      <p className="mb-6 text-muted-foreground">
        It may have been removed from the notes repo, or the link is wrong.
      </p>
      <Link href="/scripts" className={cn(buttonVariants())}>
        Back to scripts
      </Link>
    </main>
  );
}
