import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildChunks } from "./chunks";
import {
  SpeechEngine,
  type SynthLike,
  type UtteranceLike,
  type VoiceLike,
} from "./engine";

class FakeUtterance implements UtteranceLike {
  voice: VoiceLike | null = null;
  lang = "";
  rate = 1;
  pitch = 1;
  onstart: UtteranceLike["onstart"] = null;
  onend: UtteranceLike["onend"] = null;
  onerror: UtteranceLike["onerror"] = null;
  onboundary: UtteranceLike["onboundary"] = null;
  constructor(public text: string) {}
}

class FakeSynth implements SynthLike {
  speaking = false;
  pending = false;
  paused = false;
  current: FakeUtterance | null = null;
  spoken: FakeUtterance[] = [];
  resumed = 0;
  /** When true, speak() is accepted but the engine never starts. */
  broken = false;

  speak(utterance: UtteranceLike) {
    const u = utterance as FakeUtterance;
    this.spoken.push(u);
    if (this.broken) return;
    this.current = u;
    this.speaking = true;
    u.onstart?.();
  }
  cancel() {
    const u = this.current;
    this.current = null;
    this.speaking = false;
    // Browsers report a cancel as an error. The engine must ignore it.
    u?.onerror?.({ error: "canceled" });
  }
  resume() {
    this.resumed++;
    this.paused = false;
  }
  // Test helpers.
  finishCurrent() {
    const u = this.current;
    this.current = null;
    this.speaking = false;
    u?.onend?.();
  }
  get texts() {
    return this.spoken.map((u) => u.text);
  }
}

// Three chunks, one per paragraph.
const chunks = buildChunks("First part.\n\nSecond part.\n\nThird part.");

function setup(startIndex = 0) {
  const synth = new FakeSynth();
  const onIndexChange = vi.fn();
  const onFinish = vi.fn();
  let time = 0;
  const engine = new SpeechEngine({
    getSynth: () => synth,
    createUtterance: (text) => new FakeUtterance(text),
    onIndexChange,
    onFinish,
    getStartIndex: () => startIndex,
    now: () => time,
  });
  engine.setChunks(chunks);
  engine.attach();
  return {
    engine,
    synth,
    onIndexChange,
    onFinish,
    // Moves the fake clock and the timers forward together, in small steps.
    advance(ms: number) {
      for (let elapsed = 0; elapsed < ms; elapsed += 500) {
        time += 500;
        vi.advanceTimersByTime(500);
      }
    },
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("playing", () => {
  it("speaks the first chunk and reports it", () => {
    const { engine, synth, onIndexChange } = setup();
    engine.play();
    expect(synth.texts).toEqual(["First part."]);
    expect(engine.getState()).toMatchObject({ status: "playing", index: 0 });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it("moves through every chunk and then finishes", () => {
    const { engine, synth, onFinish } = setup();
    engine.play();
    synth.finishCurrent();
    expect(engine.getState().index).toBe(1);
    synth.finishCurrent();
    expect(engine.getState().index).toBe(2);
    synth.finishCurrent();

    expect(synth.texts).toEqual(["First part.", "Second part.", "Third part."]);
    expect(engine.getState()).toMatchObject({ status: "idle", index: null });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("counts each time a script is read to the end", () => {
    const { engine, synth } = setup();
    expect(engine.getState().finished).toBe(0);

    engine.play(2);
    synth.finishCurrent();
    expect(engine.getState().finished).toBe(1);

    engine.play(2);
    synth.finishCurrent();
    expect(engine.getState().finished).toBe(2);
  });

  it("does not count a script that was stopped before the end", () => {
    const { engine, synth } = setup();
    engine.play(2);
    synth.finishCurrent();
    engine.play(0);
    engine.stop();
    // Stopping goes back to idle but keeps the count, so it never looks like a new ending.
    expect(engine.getState()).toMatchObject({ status: "idle", index: null, finished: 1 });
  });

  it("starts from a chosen chunk", () => {
    const { engine, synth } = setup();
    engine.play(2);
    expect(synth.texts).toEqual(["Third part."]);
  });

  it("does nothing without chunks", () => {
    const { engine, synth } = setup();
    engine.setChunks(buildChunks(""));
    engine.play();
    expect(synth.texts).toEqual([]);
    expect(engine.getState().status).toBe("idle");
  });
});

describe("pausing", () => {
  it("cancels speech and keeps the position", () => {
    const { engine, synth } = setup();
    engine.play(1);
    engine.pause();
    expect(synth.speaking).toBe(false);
    expect(engine.getState()).toMatchObject({ status: "paused", index: 1 });
  });

  it("restarts the same chunk when played again", () => {
    const { engine, synth } = setup();
    engine.play(1);
    engine.pause();
    engine.play();
    expect(synth.texts).toEqual(["Second part.", "Second part."]);
  });

  it("ignores the end event of a cancelled utterance", () => {
    const { engine, synth } = setup();
    engine.play(0);
    const old = synth.spoken[0];
    engine.pause();
    old.onend?.(); // a late event from the cancelled utterance
    expect(engine.getState()).toMatchObject({ status: "paused", index: 0 });
    expect(synth.texts).toEqual(["First part."]);
  });
});

describe("seeking and skipping", () => {
  it("seek while playing speaks the new chunk without a stale advance", () => {
    const { engine, synth } = setup();
    engine.play(0);
    const old = synth.spoken[0];
    engine.seek(2);
    old.onend?.();
    expect(synth.texts).toEqual(["First part.", "Third part."]);
    expect(engine.getState().index).toBe(2);
  });

  it("seek while paused only moves the position", () => {
    const { engine, synth, onIndexChange } = setup();
    engine.seek(1);
    expect(synth.texts).toEqual([]);
    expect(engine.getState().index).toBe(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it("clamps out-of-range seeks", () => {
    const { engine } = setup();
    engine.seek(99);
    expect(engine.getState().index).toBe(2);
    engine.seek(-5);
    expect(engine.getState().index).toBe(0);
  });

  it("skipBy always moves at least one chunk", () => {
    const { engine } = setup();
    // Each test chunk is under a second long, so tiny skips would stay put.
    engine.seek(1);
    engine.skipBy(0.01);
    expect(engine.getState().index).toBe(2);
    engine.skipBy(-0.01);
    expect(engine.getState().index).toBe(1);
  });

  it("skipBy never goes past either end", () => {
    const { engine } = setup();
    engine.seek(0);
    engine.skipBy(-15);
    expect(engine.getState().index).toBe(0);
    engine.seek(2);
    engine.skipBy(15);
    expect(engine.getState().index).toBe(2);
  });

  it("skips by paragraph", () => {
    const { engine } = setup();
    engine.seek(0);
    engine.skipParagraph(1);
    expect(engine.getState().index).toBe(1);
    engine.skipParagraph(1);
    expect(engine.getState().index).toBe(2);
    engine.skipParagraph(1); // already on the last paragraph
    expect(engine.getState().index).toBe(2);
    engine.skipParagraph(-1);
    expect(engine.getState().index).toBe(1);
  });
});

describe("skip distance", () => {
  // Five chunks of ten seconds each.
  const tenSecondChunks = Array.from({ length: 5 }, (_, i) => ({
    index: i,
    paragraph: i,
    text: `Chunk ${i}.`,
    seconds: 10,
  }));

  it("forward skips are never shorter than asked", () => {
    const { engine } = setup();
    engine.setChunks(tenSecondChunks);
    engine.seek(0);
    engine.skipBy(15); // 15s lands inside chunk 1, so take the next start at 20s
    expect(engine.getState().index).toBe(2);
  });

  it("forward skips that land exactly on a start stay there", () => {
    const { engine } = setup();
    engine.setChunks(tenSecondChunks);
    engine.seek(0);
    engine.skipBy(20);
    expect(engine.getState().index).toBe(2);
  });

  it("back skips are never shorter than asked", () => {
    const { engine } = setup();
    engine.setChunks(tenSecondChunks);
    engine.seek(4); // starts at 40s
    engine.skipBy(-15); // 25s is inside chunk 2, which starts at 20s
    expect(engine.getState().index).toBe(2);
  });
});

describe("saved start position", () => {
  it("plays from the saved position when nothing was chosen", () => {
    const { engine, synth } = setup(2);
    engine.play();
    expect(synth.texts).toEqual(["Third part."]);
  });

  it("skips relative to the saved position, not the start", () => {
    const { engine } = setup(2);
    engine.skipBy(-0.01);
    expect(engine.getState().index).toBe(1);
  });

  it("skips paragraphs relative to the saved position", () => {
    const { engine } = setup(1);
    engine.skipParagraph(1);
    expect(engine.getState().index).toBe(2);
  });

  it("ignores a saved position past the end", () => {
    const { engine, synth } = setup(99);
    engine.play();
    expect(synth.texts).toEqual(["Third part."]);
  });
});

describe("settings", () => {
  it("applies voice, rate and pitch to the utterance", () => {
    const { engine, synth } = setup();
    const voice = { name: "Test", lang: "en-GB" };
    engine.setSettings({ voice, lang: "en", rate: 1.5, pitch: 0.9 });
    engine.play();
    expect(synth.spoken[0]).toMatchObject({
      voice,
      lang: "en-GB",
      rate: 1.5,
      pitch: 0.9,
    });
  });

  it("restarts the current chunk when the speed changes while playing", () => {
    const { engine, synth } = setup();
    engine.play(1);
    engine.setSettings({ voice: null, lang: "en", rate: 2, pitch: 1 });
    expect(synth.texts).toEqual(["Second part.", "Second part."]);
    expect(synth.spoken[1].rate).toBe(2);
  });

  it("does not restart when nothing relevant changed", () => {
    const { engine, synth } = setup();
    engine.play(1);
    engine.setSettings({ voice: null, lang: "en", rate: 1, pitch: 1 });
    expect(synth.texts).toEqual(["Second part."]);
  });

  it("scales skipBy by the speed", () => {
    const long = buildChunks(
      Array.from({ length: 10 }, (_, i) =>
        Array(75).fill("word").join(" ") + ".\n\n" + `P${i}`,
      ).join("\n\n"),
      5000,
    );
    const { engine } = setup();
    engine.setChunks(long);
    engine.seek(0);
    engine.skipBy(15); // 15s at 1x is under one 30s chunk, so it moves one chunk
    const at1x = engine.getState().index!;
    engine.setSettings({ voice: null, lang: "en", rate: 4, pitch: 1 });
    engine.seek(0);
    engine.skipBy(15); // 60s of 1x time at 4x
    expect(engine.getState().index!).toBeGreaterThan(at1x);
  });
});

describe("word highlighting", () => {
  it("reports the word range from boundary events", () => {
    const { engine, synth } = setup();
    engine.play(1);
    synth.spoken[0].onboundary?.({ name: "word", charIndex: 7, charLength: 4 });
    expect(engine.getState().wordRange).toEqual({ start: 7, end: 11 });
  });

  it("works out the end of the word when no length is given", () => {
    const { engine, synth } = setup();
    engine.play(1);
    synth.spoken[0].onboundary?.({ name: "word", charIndex: 0 });
    expect(engine.getState().wordRange).toEqual({ start: 0, end: 6 });
  });

  it("clears the word when the chunk changes", () => {
    const { engine, synth } = setup();
    engine.play(0);
    synth.spoken[0].onboundary?.({ name: "word", charIndex: 0, charLength: 5 });
    synth.finishCurrent();
    expect(engine.getState().wordRange).toBeNull();
  });

  it("ignores sentence boundary events", () => {
    const { engine, synth } = setup();
    engine.play(0);
    synth.spoken[0].onboundary?.({ name: "sentence", charIndex: 0 });
    expect(engine.getState().wordRange).toBeNull();
  });
});

describe("errors and recovery", () => {
  it("pauses and reports a real error", () => {
    const { engine, synth } = setup();
    engine.play(0);
    synth.spoken[0].onerror?.({ error: "synthesis-failed" });
    expect(engine.getState()).toMatchObject({
      status: "paused",
      error: "synthesis-failed",
    });
  });

  it("does not treat a cancel as an error", () => {
    const { engine } = setup();
    engine.play(0);
    engine.seek(1);
    expect(engine.getState().error).toBeNull();
  });

  it("watchdog restarts speech that stopped on its own", () => {
    const { engine, synth, advance } = setup();
    engine.play(1);
    synth.speaking = false; // the browser silently dropped it
    advance(3000);
    expect(synth.texts.filter((t) => t === "Second part.")).toHaveLength(2);
    expect(engine.getState().status).toBe("playing");
  });

  it("watchdog resumes a browser that paused itself", () => {
    const { engine, synth, advance } = setup();
    engine.play(0);
    synth.paused = true;
    advance(1600);
    expect(synth.resumed).toBe(1);
  });

  it("watchdog gives up after a few failed restarts", () => {
    const { engine, synth, advance } = setup();
    engine.play(0);
    synth.broken = true; // from now on speak() never starts
    synth.speaking = false;
    advance(20000);
    expect(engine.getState().status).toBe("paused");
    expect(engine.getState().error).toMatch(/stopped responding/);
  });

  it("watchdog leaves a paused engine alone", () => {
    const { engine, synth, advance } = setup();
    engine.play(0);
    engine.pause();
    advance(10000);
    expect(synth.texts).toEqual(["First part."]);
  });
});

describe("lifecycle", () => {
  it("detach stops speech and the watchdog", () => {
    const { engine, synth, advance } = setup();
    engine.play(0);
    engine.detach();
    expect(synth.speaking).toBe(false);
    expect(engine.getState().status).toBe("idle");
    advance(10000);
    expect(synth.texts).toEqual(["First part."]);
  });

  it("changing the chunks stops playback", () => {
    const { engine } = setup();
    engine.play(0);
    engine.setChunks(buildChunks("Something else."));
    expect(engine.getState().status).toBe("idle");
  });

  it("notifies subscribers and returns stable state objects", () => {
    const { engine } = setup();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    const before = engine.getState();
    expect(engine.getState()).toBe(before);
    engine.play(0);
    expect(listener).toHaveBeenCalled();
    expect(engine.getState()).not.toBe(before);
    unsubscribe();
    const calls = listener.mock.calls.length;
    engine.pause();
    expect(listener.mock.calls.length).toBe(calls);
  });
});
