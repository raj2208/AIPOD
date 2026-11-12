/**
 * Turns a script into the pieces that are spoken one at a time.
 *
 * The browser's speech engine can stall on long text, and speaking small pieces
 * lets us highlight what is being read and jump around. So the script is cut
 * into sentences, and short neighbouring sentences are joined into one chunk.
 * A chunk never crosses a paragraph.
 */

export type Chunk = {
  /** Position of the chunk in the whole script. */
  index: number;
  /** Which paragraph this chunk belongs to. */
  paragraph: number;
  /** The exact text that is shown and spoken. */
  text: string;
  /** Rough speaking time at normal speed, in seconds. */
  seconds: number;
};

export const MAX_CHUNK_CHARS = 240;
export const WORDS_PER_MINUTE = 150;

/**
 * Silence held between one paragraph and the next, at normal speed.
 *
 * This is revision, not a story: a point lands only if there is a moment to
 * take it in before the next one starts. A script written one sentence to a
 * paragraph therefore gets a beat after every sentence. The player waits for
 * real, so the estimate below counts it as part of the listening time.
 */
export const PARAGRAPH_PAUSE_SECONDS = 0.7;

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Listening time: the words, plus the silence held between paragraphs. */
export function estimateSeconds(text: string): number {
  const speaking = (countWords(text) / WORDS_PER_MINUTE) * 60;
  const breaks = Math.max(0, splitParagraphs(text).length - 1);
  return speaking + breaks * PARAGRAPH_PAUSE_SECONDS;
}

/** Paragraphs are separated by blank lines. Line breaks inside one are spaces. */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitSentences(paragraph: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    return Array.from(segmenter.segment(paragraph), (part) => part.segment)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }
  return (paragraph.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [paragraph])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Cuts a very long sentence at commas or spaces so it fits in a chunk. */
function splitLongSentence(sentence: string, max: number): string[] {
  const parts: string[] = [];
  let rest = sentence;
  while (rest.length > max) {
    const window = rest.slice(0, max + 1);
    let cut = Math.max(
      window.lastIndexOf(", "),
      window.lastIndexOf("; "),
      window.lastIndexOf(": "),
    );
    if (cut < max / 2) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = max;
    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export function buildChunks(
  content: string,
  maxChars: number = MAX_CHUNK_CHARS,
): Chunk[] {
  const chunks: Chunk[] = [];

  splitParagraphs(content).forEach((paragraph, paragraphIndex) => {
    const sentences = splitSentences(paragraph).flatMap((sentence) =>
      sentence.length > maxChars
        ? splitLongSentence(sentence, maxChars)
        : [sentence],
    );

    let current = "";
    const flush = () => {
      if (!current) return;
      chunks.push({
        index: chunks.length,
        paragraph: paragraphIndex,
        text: current,
        seconds: estimateSeconds(current),
      });
      current = "";
    };

    for (const sentence of sentences) {
      if (current && current.length + 1 + sentence.length > maxChars) flush();
      current = current ? `${current} ${sentence}` : sentence;
    }
    flush();
  });

  return chunks;
}

/**
 * Seconds of listening before each chunk, plus the total as the last item.
 * A chunk that opens a new paragraph starts after that paragraph's pause, so
 * the clock and the slider count the silence the player really holds.
 */
export function cumulativeSeconds(chunks: Chunk[]): number[] {
  const result = [0];
  chunks.forEach((chunk, index) => {
    const pause =
      index > 0 && chunk.paragraph !== chunks[index - 1].paragraph
        ? PARAGRAPH_PAUSE_SECONDS
        : 0;
    result.push(result[result.length - 1] + pause + chunk.seconds);
  });
  return result;
}

/**
 * The chunk that contains the given time. `cumulative` comes from
 * `cumulativeSeconds`. Times past the end return the last chunk.
 */
export function chunkAtTime(cumulative: number[], seconds: number): number {
  const last = cumulative.length - 2;
  if (last < 0) return 0;
  if (seconds <= 0) return 0;
  for (let i = 0; i <= last; i++) {
    if (seconds < cumulative[i + 1]) return i;
  }
  return last;
}
