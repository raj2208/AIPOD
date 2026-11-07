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

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateSeconds(text: string): number {
  return (countWords(text) / WORDS_PER_MINUTE) * 60;
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

/** Seconds of speaking before each chunk, plus the total as the last item. */
export function cumulativeSeconds(chunks: Chunk[]): number[] {
  const result = [0];
  for (const chunk of chunks) {
    result.push(result[result.length - 1] + chunk.seconds);
  }
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
