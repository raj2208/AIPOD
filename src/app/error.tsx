"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { StatePanel } from "@/components/state-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown when a page fails, for example if the database cannot be reached. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-4 py-16 outline-none"
    >
      <StatePanel
        icon={TriangleAlert}
        tone="danger"
        title="Something went wrong"
        actions={
          <>
            <Button onClick={reset} className="h-11 rounded-full px-5 text-base">
              Try again
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-full px-5 text-base",
              )}
            >
              Go home
            </Link>
          </>
        }
      >
        The page could not be loaded. Check that the database is running, then
        try again.
      </StatePanel>
    </main>
  );
}
