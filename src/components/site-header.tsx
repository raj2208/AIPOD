import Link from "next/link";
import { Suspense } from "react";

import { BrandMark } from "@/components/brand-mark";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm font-heading text-lg font-semibold focus-ring"
        >
          <BrandMark className="size-6 shrink-0" />
          AIPOD
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {/* The active state needs the current URL, which is only known at
              request time, so the link streams in. Until then it is the same
              link without the highlight, so nothing moves. */}
          <Suspense
            fallback={
              <Link
                href="/library"
                className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-4 text-base")}
              >
                Library
              </Link>
            }
          >
            <NavLink href="/library">Library</NavLink>
          </Suspense>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
