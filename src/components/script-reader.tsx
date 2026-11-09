"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";

import { ScriptPlayer } from "@/components/script-player";
import { requestAutoplay } from "@/lib/tts/autoplay";
import { buildChunks, splitParagraphs } from "@/lib/tts/chunks";
import type { HighlightMode } from "@/lib/tts/settings";
import { useSpeechPlayer } from "@/lib/tts/use-speech-player";
import { cn } from "@/lib/utils";

type Neighbour = { id: string; title: string };

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
    <span className="rounded bg-primary/10 box-decoration-clone">
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
  const { autoScroll, highlight } = player.settings;

  // Keep the sentence being read in view.
  useEffect(() => {
    if (!playing || !autoScroll) return;
    const element = articleRef.current?.querySelector(`[data-chunk="${index}"]`);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    element?.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [index, playing, autoScroll]);

  return (
    <>
      <article ref={articleRef} className="space-y-4 text-lg leading-relaxed">
        {paragraphs.map((_, paragraphIndex) => (
          <p key={paragraphIndex}>
            {chunks
              .filter((chunk) => chunk.paragraph === paragraphIndex)
              .map((chunk, position) => (
                <Fragment key={chunk.index}>
                  {position > 0 && " "}
                  <span
                    data-chunk={chunk.index}
                    onClick={() => player.jumpTo(chunk.index)}
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
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted"
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
              className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted"
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

      {/* Room so the last lines can scroll clear of the docked player. */}
      <div aria-hidden className="h-36" />

      <ScriptPlayer player={player} />
    </>
  );
}
