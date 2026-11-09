"use client";

import { ArrowLeft, ArrowRight, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ScriptPlayer } from "@/components/script-player";
import { requestAutoplay } from "@/lib/tts/autoplay";
import { buildChunks, splitParagraphs } from "@/lib/tts/chunks";
import type { HighlightMode, TextSize } from "@/lib/tts/settings";
import { useSpeechPlayer } from "@/lib/tts/use-speech-player";
import { cn } from "@/lib/utils";

type Neighbour = { id: string; title: string };

const TEXT_SIZE_CLASS: Record<TextSize, string> = {
  small: "text-base",
  medium: "text-lg",
  large: "text-xl",
  huge: "text-2xl",
};

type ScriptReaderProps = {
  scriptId: string;
  title: string;
  topic: string;
  content: string;
  /** The scripts either side of this one in play order. */
  previous: Neighbour | null;
  next: Neighbour | null;
};

function ChunkText({
  text,
  active,
  mode,
  wordRange,
}: {
  text: string;
  active: boolean;
  mode: HighlightMode;
  wordRange: { start: number; end: number } | null;
}) {
  if (!active || mode === "off") return <>{text}</>;

  const word = mode === "word" ? wordRange : null;
  return (
    <span className="rounded bg-primary/10 box-decoration-clone dark:bg-primary/20">
      {word ? (
        <>
          {text.slice(0, word.start)}
          <mark className="rounded bg-primary text-primary-foreground">
            {text.slice(word.start, word.end)}
          </mark>
          {text.slice(word.end)}
        </>
      ) : (
        text
      )}
    </span>
  );
}

/** The script text, with the part being read highlighted, and its player. */
export function ScriptReader({
  scriptId,
  title,
  topic,
  content,
  previous,
  next,
}: ScriptReaderProps) {
  const router = useRouter();
  const paragraphs = useMemo(() => splitParagraphs(content), [content]);
  const chunks = useMemo(() => buildChunks(content), [content]);

  // Opens the next script and asks it to start playing straight away.
  const openNext = useCallback(() => {
    if (!next) return;
    requestAutoplay(next.id);
    router.push(`/scripts/${next.id}`);
  }, [next, router]);

  const player = useSpeechPlayer({
    scriptId,
    title,
    subtitle: topic,
    chunks,
    onFinished: next ? openNext : undefined,
    onNext: next ? openNext : undefined,
  });

  const articleRef = useRef<HTMLElement>(null);
  const { index, playing, started } = player;
  const { autoScroll, highlight, textSize } = player.settings;

  // Whether the listener has scrolled away from the sentence being read.
  // They are reading ahead or back, so stop pulling them to the current
  // sentence until they ask. It resets whenever playback starts or stops.
  const [away, setAway] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(playing);
  if (playing !== wasPlaying) {
    setWasPlaying(playing);
    setAway(false);
  }

  useEffect(() => {
    if (!playing) return;
    const leave = (event: Event) => {
      // Dragging the player's own slider is not scrolling the text.
      const target = event.target as Element | null;
      if (target?.closest?.('[aria-label="Listen to this script"]')) return;
      setAway(true);
    };
    window.addEventListener("wheel", leave, { passive: true });
    window.addEventListener("touchmove", leave, { passive: true });
    return () => {
      window.removeEventListener("wheel", leave);
      window.removeEventListener("touchmove", leave);
    };
  }, [playing]);

  // Keep the sentence being read in view.
  useEffect(() => {
    if (!playing || !autoScroll || away) return;
    const element = articleRef.current?.querySelector(`[data-chunk="${index}"]`);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element?.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [index, playing, autoScroll, away]);

  return (
    <>
      <article
        ref={articleRef}
        className={cn(
          "space-y-5 leading-relaxed text-pretty",
          TEXT_SIZE_CLASS[textSize],
        )}
      >
        {paragraphs.map((_, paragraphIndex) => (
          <p key={paragraphIndex}>
            {chunks
              .filter((chunk) => chunk.paragraph === paragraphIndex)
              .map((chunk, position) => (
                <Fragment key={chunk.index}>
                  {position > 0 && " "}
                  <span
                    data-chunk={chunk.index}
                    onClick={() => {
                      setAway(false);
                      player.jumpTo(chunk.index);
                    }}
                    className={cn(
                      "cursor-pointer rounded-sm transition-colors hover:bg-muted",
                    )}
                  >
                    <ChunkText
                      text={chunk.text}
                      active={started && chunk.index === index}
                      mode={highlight}
                      wordRange={player.wordRange}
                    />
                  </span>
                </Fragment>
              ))}
          </p>
        ))}
      </article>

      {(previous || next) && (
        <nav
          aria-label="Other scripts"
          className="mt-10 grid gap-2 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={`/scripts/${previous.id}`}
              onClick={() => player.playing && requestAutoplay(previous.id)}
              className="flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors hover:bg-muted focus-ring"
            >
              <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  Previous
                </span>
                <span className="block truncate font-medium">
                  {previous.title}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/scripts/${next.id}`}
              onClick={() => player.playing && requestAutoplay(next.id)}
              className="flex items-center justify-between gap-3 rounded-xl border p-3.5 text-sm transition-colors hover:bg-muted focus-ring"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">
                  Up next
                </span>
                <span className="block truncate font-medium">{next.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </nav>
      )}

      {playing && autoScroll && away && (
        <button
          type="button"
          onClick={() => setAway(false)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+8rem)] left-1/2 z-20 flex h-11 -translate-x-1/2 animate-in items-center gap-2 whitespace-nowrap rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg duration-200 fade-in-0 slide-in-from-bottom-2 focus-ring"
        >
          <LocateFixed className="size-4" />
          Jump to current sentence
        </button>
      )}

      {/* Room so the last lines can scroll clear of the docked player. */}
      <div aria-hidden className="h-36" />

      <ScriptPlayer player={player} />
    </>
  );
}
