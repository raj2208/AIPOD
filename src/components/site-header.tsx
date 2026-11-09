import { Headphones } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Headphones className="size-4" />
          </span>
          AIPOD
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/scripts" className={cn(buttonVariants({ variant: "ghost" }))}>
            Scripts
          </Link>
        </nav>
      </div>
    </header>
  );
}
