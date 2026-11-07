"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";

import { ScriptPlayer } from "@/components/script-player";
import { buildChunks, splitParagraphs } from "@/lib/tts/chunks";
import type { HighlightMode } from "@/lib/tts/settings";
import { useSpeechPlayer } from "@/lib/tts/use-speech-player";
import { cn } from "@/lib/utils";

type ScriptReaderProps = {
  scriptId: string;
  title: string;
  topic: string;
  content: string;
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
}: ScriptReaderProps) {
  const paragraphs = useMemo(() => splitParagraphs(content), [content]);
  const chunks = useMemo(() => buildChunks(content), [content]);
  const player = useSpeechPlayer({
    scriptId,
    title,
    subtitle: topic,
    chunks,
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

      <ScriptPlayer player={player} />
    </>
  );
}
