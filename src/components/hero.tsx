import { ArrowRight, Bus, Pause, RotateCcw, RotateCw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bar heights in percent, so the bars do not all move in unison.
const BARS = [40, 70, 100, 55, 85, 45, 95, 60, 35, 80, 50, 90];

// The sentence shown in the preview. The words in `lit` take the highlight in
// turn, the way the real reader follows the voice.
const BEFORE = "The most important idea is that Terraform is";
const LIT = ["declarative.", "You", "describe", "the", "end", "result."];
const AFTER = "Terraform works out the rest.";

/**
 * A faithful picture of the player, so the home page shows the product
 * instead of describing it. It is decorative, and the highlight stands still
 * for people who ask for less motion.
 */
function PlayerPreview() {
  return (
    <div
      aria-hidden
      className="mx-auto mt-14 w-full max-w-md rounded-3xl border bg-card p-5 text-left shadow-xl shadow-primary/10"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 items-end gap-0.5">
          {BARS.slice(0, 5).map((height, index) => (
            <span
              key={index}
              className="wave-bar w-1 rounded-full bg-gradient-to-t from-primary/40 to-primary"
              style={{
                height: `${height}%`,
                animationDelay: `${index * -0.27}s`,
              }}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            Terraform basics
          </span>
          <span className="block text-xs text-muted-foreground">
            2 of 6 · 5 min
          </span>
        </span>
      </div>

      <p className="mt-4 text-base leading-relaxed">
        <span className="text-muted-foreground">{BEFORE} </span>
        <span className="rounded bg-primary/10 box-decoration-clone dark:bg-primary/20">
          {LIT.map((word, index) => (
            <span key={word + index}>
              <span
                className="hero-word rounded"
                style={{ animationDelay: `${index * 0.7}s` }}
              >
                {word}
              </span>{" "}
            </span>
          ))}
        </span>
        <span className="text-muted-foreground">{AFTER}</span>
      </p>

      <div className="mt-5 flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">2:34</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full w-1/2 rounded-full bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">5:19</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-5 text-foreground">
        <RotateCcw className="size-6" strokeWidth={1.6} />
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <Pause className="size-6 fill-current" />
        </span>
        <RotateCw className="size-6" strokeWidth={1.6} />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_70%)]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24">
        <Badge className="mb-6 h-7 gap-1.5 bg-accent px-3 text-sm text-accent-foreground">
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
            className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-6 text-base")}
          >
            Open playlist
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="#how-it-works"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-12 rounded-full px-6 text-base",
            )}
          >
            How it works
          </Link>
        </div>

        <PlayerPreview />
      </div>
    </section>
  );
}
