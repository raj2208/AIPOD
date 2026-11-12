import {
  chunkAtTime,
  cumulativeSeconds,
  PARAGRAPH_PAUSE_SECONDS,
  type Chunk,
} from "./chunks";

/**
 * Speaks a list of chunks one after another with the browser's speech engine.
 *
 * It is plain TypeScript with no React in it, so it can be tested with a fake
 * speech engine. Things it does on purpose:
 *
 * - Pausing cancels the speech and remembers the chunk. `speechSynthesis.pause()`
 *   is unreliable on Android Chrome, so resuming simply restarts the chunk.
 * - Every utterance gets a generation number. Events from an utterance that was
 *   cancelled are ignored, because browsers report a cancel as an error or end.
 * - Between paragraphs it holds a short silence, so a point has a moment to
 *   land before the next one starts. The watchdog knows to leave that alone.
 * - A watchdog restarts speech that stopped without us asking it to.
 */

export type VoiceLike = { name: string; lang: string };

export type UtteranceLike = {
  voice: VoiceLike | null;
  lang: string;
  rate: number;
  pitch: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onboundary:
    | ((event: { name?: string; charIndex: number; charLength?: number }) => void)
    | null;
};

export type SynthLike = {
  speak(utterance: UtteranceLike): void;
  cancel(): void;
  resume(): void;
  readonly speaking: boolean;
  readonly pending: boolean;
  readonly paused: boolean;
};

export type EngineStatus = "idle" | "playing" | "paused";

export type EngineState = {
  status: EngineStatus;
  /** The current chunk, or null when nothing has been chosen yet. */
  index: number | null;
  /** The word being spoken inside the current chunk, when the engine reports it. */
  wordRange: { start: number; end: number } | null;
  error: string | null;
  /** How many times a script has been read to the end. Never goes down. */
  finished: number;
};

export type EngineSettings = {
  voice: VoiceLike | null;
  lang: string;
  rate: number;
  pitch: number;
};

export type EngineDeps = {
  getSynth: () => SynthLike | null;
  createUtterance: (text: string) => UtteranceLike;
  onIndexChange?: (index: number) => void;
  onFinish?: () => void;
  /** Where to start when nothing has been played yet, such as a saved position. */
  getStartIndex?: () => number;
  now?: () => number;
};

const WATCHDOG_MS = 1500;
const MAX_RESTARTS = 3;

export const IDLE_STATE: EngineState = {
  status: "idle",
  index: null,
  wordRange: null,
  error: null,
  finished: 0,
};

export class SpeechEngine {
  private state: EngineState = IDLE_STATE;
  private listeners = new Set<() => void>();
  private chunks: Chunk[] = [];
  private cumulative: number[] = [0];
  private settings: EngineSettings = {
    voice: null,
    lang: "en",
    rate: 1,
    pitch: 1,
  };
  private generation = 0;
  private watchdog: ReturnType<typeof setInterval> | null = null;
  /** Pending silence between two paragraphs, if we are inside one. */
  private breath: ReturnType<typeof setTimeout> | null = null;
  private startedAt = 0;
  private restarts = 0;

  constructor(private readonly deps: EngineDeps) {}

  // --- React-friendly store API -------------------------------------------

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = () => this.state;

  private set(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  // --- Lifecycle ------------------------------------------------------------

  /** Starts the watchdog. Safe to call more than once. */
  attach() {
    if (this.watchdog) return;
    this.watchdog = setInterval(() => this.checkHealth(), WATCHDOG_MS);
  }

  /** Stops everything. The engine can be attached again afterwards. */
  detach() {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
    this.stop();
  }

  // --- Configuration --------------------------------------------------------

  setChunks(chunks: Chunk[]) {
    if (chunks === this.chunks) return;
    this.chunks = chunks;
    this.cumulative = cumulativeSeconds(chunks);
    if (this.state.status !== "idle") this.stop();
    else if (this.state.index !== null && this.state.index >= chunks.length) {
      this.set({ index: null, wordRange: null });
    }
  }

  setSettings(next: EngineSettings) {
    const prev = this.settings;
    this.settings = next;
    const changed =
      prev.rate !== next.rate ||
      prev.pitch !== next.pitch ||
      prev.lang !== next.lang ||
      prev.voice?.name !== next.voice?.name;
    // Speech settings are fixed once an utterance starts, so restart the chunk.
    if (changed && this.state.status === "playing" && this.state.index !== null) {
      this.speak(this.state.index);
    }
  }

  // --- Controls -------------------------------------------------------------

  play(from?: number) {
    if (!this.deps.getSynth() || this.chunks.length === 0) return;
    let index = from === undefined ? this.position() : this.clamp(from);
    if (index >= this.chunks.length) index = 0;
    this.restarts = 0;
    this.set({ status: "playing", error: null });
    this.speak(index);
  }

  pause() {
    if (this.state.status !== "playing") return;
    this.generation++;
    this.clearBreath();
    this.deps.getSynth()?.cancel();
    this.set({ status: "paused" });
  }

  stop() {
    this.generation++;
    this.clearBreath();
    this.deps.getSynth()?.cancel();
    if (this.state !== IDLE_STATE) {
      this.set({ ...IDLE_STATE, finished: this.state.finished });
    }
  }

  /** Moves to a chunk. Keeps speaking if it was already speaking. */
  seek(index: number) {
    if (this.chunks.length === 0) return;
    const target = this.clamp(index);
    if (this.state.status === "playing") {
      this.speak(target);
    } else {
      this.set({ index: target, wordRange: null });
      this.deps.onIndexChange?.(target);
    }
  }

  /** Skips by an amount of time as heard at the current speed. */
  skipBy(seconds: number) {
    if (this.chunks.length === 0) return;
    const current = this.position();
    const wanted = this.cumulative[current] + seconds * this.settings.rate;
    let target = chunkAtTime(this.cumulative, wanted);
    // Going forward, take the next chunk start rather than the one we are
    // inside, so a skip is never shorter than asked. Going back already is not.
    if (seconds > 0 && this.cumulative[target] < wanted) target += 1;
    // Always move at least one chunk, so a skip is never a no-op.
    if (seconds > 0 && target <= current) target = current + 1;
    if (seconds < 0 && target >= current) target = current - 1;
    this.seek(target);
  }

  /** Jumps to the start of the previous (-1) or next (1) paragraph. */
  skipParagraph(direction: -1 | 1) {
    if (this.chunks.length === 0) return;
    const current = this.position();
    const paragraph = this.chunks[current].paragraph;
    if (direction > 0) {
      const next = this.chunks.findIndex((chunk) => chunk.paragraph > paragraph);
      if (next !== -1) this.seek(next);
      return;
    }
    const first = this.chunks.findIndex((chunk) => chunk.paragraph === paragraph);
    // From the middle of a paragraph, the first press returns to its start.
    const target =
      current > first
        ? first
        : this.chunks.findIndex(
            (chunk) => chunk.paragraph === Math.max(0, paragraph - 1),
          );
    this.seek(Math.max(0, target));
  }

  // --- Internals ------------------------------------------------------------

  /** The current chunk, or the saved start position when idle. */
  private position() {
    return this.clamp(this.state.index ?? this.deps.getStartIndex?.() ?? 0);
  }

  private clamp(index: number) {
    return Math.min(Math.max(0, index), Math.max(0, this.chunks.length - 1));
  }

  private now() {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  /** Drops a pending between-paragraph silence. */
  private clearBreath() {
    if (!this.breath) return;
    clearTimeout(this.breath);
    this.breath = null;
  }

  private speak(index: number) {
    this.clearBreath();
    const synth = this.deps.getSynth();
    const chunk = this.chunks[index];
    if (!synth || !chunk) return;

    // Invalidate the old utterance before cancelling, so its events are ignored.
    const generation = ++this.generation;
    synth.cancel();

    const utterance = this.deps.createUtterance(chunk.text);
    const { voice, lang, rate, pitch } = this.settings;
    utterance.voice = voice;
    utterance.lang = voice?.lang ?? lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      if (generation !== this.generation) return;
      this.restarts = 0;
    };

    utterance.onboundary = (event) => {
      if (generation !== this.generation) return;
      if (event.name && event.name !== "word") return;
      this.set({ wordRange: this.wordAt(chunk.text, event) });
    };

    utterance.onend = () => {
      if (generation !== this.generation) return;
      const next = this.chunks[index + 1];
      if (!next) {
        this.finish();
        return;
      }
      // A new paragraph is a new point, so leave a moment before it. At a
      // faster speed the whole thing moves faster, silence included.
      if (next.paragraph === chunk.paragraph) {
        this.speak(index + 1);
        return;
      }
      this.breath = setTimeout(
        () => {
          this.breath = null;
          if (generation === this.generation) this.speak(index + 1);
        },
        (PARAGRAPH_PAUSE_SECONDS * 1000) / this.settings.rate,
      );
    };

    utterance.onerror = (event) => {
      if (generation !== this.generation) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      this.generation++;
      this.set({
        status: "paused",
        error: event.error ?? "The speech engine reported an error.",
      });
    };

    this.startedAt = this.now();
    this.set({ index, wordRange: null });
    this.deps.onIndexChange?.(index);
    synth.speak(utterance);
  }

  private finish() {
    this.generation++;
    this.set({ ...IDLE_STATE, finished: this.state.finished + 1 });
    this.deps.onFinish?.();
  }

  private wordAt(
    text: string,
    event: { charIndex: number; charLength?: number },
  ): { start: number; end: number } | null {
    const start = event.charIndex;
    if (start < 0 || start >= text.length) return null;
    let end = event.charLength ? start + event.charLength : start;
    if (!event.charLength) {
      // Some engines give no length, so read up to the next space.
      while (end < text.length && !/\s/.test(text[end])) end++;
    }
    return { start, end: Math.min(end, text.length) };
  }

  /** Recovers when the engine stops on its own, which browsers sometimes do. */
  private checkHealth() {
    if (this.state.status !== "playing" || this.state.index === null) return;
    // Silence we are holding on purpose is not the engine having stalled.
    if (this.breath) return;
    const synth = this.deps.getSynth();
    if (!synth) return;

    if (synth.paused) {
      synth.resume();
      return;
    }
    if (synth.speaking || synth.pending) return;
    // Give a freshly started utterance time to begin.
    if (this.now() - this.startedAt < WATCHDOG_MS) return;

    if (this.restarts >= MAX_RESTARTS) {
      this.generation++;
      this.set({
        status: "paused",
        error: "The speech engine stopped responding. Press play to retry.",
      });
      return;
    }
    this.restarts++;
    this.speak(this.state.index);
  }
}
