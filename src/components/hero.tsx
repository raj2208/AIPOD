import { ArrowRight, Bus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bar heights in percent, and a stagger so the bars do not move in unison.
const BARS = [30, 55, 80, 45, 95, 65, 40, 85, 55, 100, 70, 35, 75, 50, 90, 60, 40, 80, 45, 65];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-20 pb-16 text-center sm:pt-28">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <Bus className="size-3.5" />
          Built for the commute
        </Badge>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Revise your notes by listening.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-balance text-muted-foreground">
          AIPOD turns the notes you wrote into flowing spoken scripts, so two
          hours on the road become two hours of revision.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/scripts"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Browse scripts
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="/scripts/new"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Add a script
          </Link>
        </div>

        <div
          aria-hidden
          className="mt-14 flex h-24 items-center justify-center gap-1.5 sm:gap-2"
        >
          {BARS.map((height, index) => (
            <span
              key={index}
              className="wave-bar w-1.5 rounded-full bg-primary/70 sm:w-2"
              style={{
                height: `${height}%`,
                animationDelay: `${(index % 7) * -0.23}s`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
