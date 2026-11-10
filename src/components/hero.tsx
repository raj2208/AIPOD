import { Pause, RotateCcw, RotateCw } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bar heights in percent, so the bars do not all move in unison.
const BARS = [40, 70, 100, 55, 85];

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
      className="w-full rounded-[0.72rem] border bg-card p-5 text-left shadow-lg shadow-foreground/5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 items-end gap-0.5">
          {BARS.map((height, index) => (
            <span
              key={index}
              className="wave-bar w-1 rounded-full bg-primary"
              style={{
                height: `${height}%`,
                animationDelay: `${index * -0.27}s`,
              }}
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">Terraform basics</span>
          <span className="block text-sm text-muted-foreground">
            2 of 6 in Terraform, 5 min
          </span>
        </span>
      </div>

      <p className="mt-4 font-reading text-base leading-relaxed">
        <span className="text-muted-foreground">{BEFORE} </span>
        {LIT.map((word, index) => (
          <span key={word + index}>
            <span
              className="hero-word rounded-[0.2rem] px-[0.14em] -mx-[0.14em]"
              style={{ animationDelay: `${index * 0.7}s` }}
            >
              {word}
            </span>{" "}
          </span>
        ))}
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
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Pause className="size-6 fill-current" />
        </span>
        <RotateCw className="size-6" strokeWidth={1.6} />
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
        <div>
          <h1 className="max-w-[14ch] text-[clamp(2.25rem,1.4rem+4vw,4rem)] leading-[1.05] font-semibold">
            Revise your notes by listening.
          </h1>

          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            AIPOD turns the notes you wrote into flowing spoken scripts, so two
            hours on the road become two hours of revision.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/scripts"
              className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}
            >
              Open playlist
            </Link>
            <Link
              href="#note-to-script"
              className="text-base underline underline-offset-4 hover:text-muted-foreground focus-ring rounded-[0.2rem]"
            >
              See what it does to a note
            </Link>
          </div>
        </div>

        <PlayerPreview />
      </div>
    </section>
  );
}
