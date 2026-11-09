"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { clearAutoplay, isAutoplayRequested } from "./autoplay";
import { chunkAtTime, cumulativeSeconds, type Chunk } from "./chunks";
import {
  SpeechEngine,
  type SynthLike,
  type UtteranceLike,
} from "./engine";
import { resumeStore } from "./resume";
import { PlaybackSession } from "./session";
import {
  sanitizeProgress,
  settingsStore,
  type PlayerSettings,
} from "./settings";
import { createLocalStore } from "./storage";
import {
  getServerVoices,
  getVoicesSnapshot,
  sortVoices,
  subscribeVoices,
} from "./voices";

export const SKIP_SECONDS = 15;

type Options = {
  scriptId: string;
  title: string;
  subtitle: string;
  chunks: Chunk[];
  /** Called when the script ends and the "play next" setting is on. */
  onFinished?: () => void;
  /** Opens the next script. Used by the lock-screen "next" button. */
  onNext?: () => void;
};

const noopSubscribe = () => () => {};

export function useSpeechPlayer({
  scriptId,
  title,
  subtitle,
  chunks,
  onFinished,
  onNext,
}: Options) {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "speechSynthesis" in window,
    () => false,
  );
  const settings = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot,
  );
  const allVoices = useSyncExternalStore(
    subscribeVoices,
    getVoicesSnapshot,
    getServerVoices,
  );

  // The engine, the saved position, and the phone session live as long as the page.
  const [{ engine, progress, session }] = useState(() => {
    const progress = createLocalStore(
      `aipod.player.progress.${scriptId}`,
      { index: 0 },
      sanitizeProgress,
    );
    const engine = new SpeechEngine({
      getSynth: () =>
        "speechSynthesis" in window
          ? (window.speechSynthesis as unknown as SynthLike)
          : null,
      createUtterance: (text) =>
        new SpeechSynthesisUtterance(text) as unknown as UtteranceLike,
      onIndexChange: (index) => {
        progress.set({ index });
        resumeStore.set({ scriptId, index });
      },
      onFinish: () => {
        progress.set({ index: 0 });
        resumeStore.set({ scriptId, index: 0 });
      },
      getStartIndex: () => progress.getSnapshot().index,
    });
    return { engine, progress, session: new PlaybackSession() };
  });

  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getState,
    engine.getState,
  );
  const savedIndex = useSyncExternalStore(
    progress.subscribe,
    progress.getSnapshot,
    progress.getServerSnapshot,
  ).index;

  const voices = useMemo(() => sortVoices(allVoices, "en"), [allVoices]);
  const voice = voices.find((item) => item.name === settings.voiceName) ?? null;

  // --- Keep the engine in step with the page --------------------------------

  useEffect(() => {
    engine.attach();
    return () => {
      engine.detach();
      session.dispose();
    };
  }, [engine, session]);

  useEffect(() => {
    engine.setChunks(chunks);
  }, [engine, chunks]);

  useEffect(() => {
    engine.setSettings({
      voice,
      lang: "en",
      rate: settings.rate,
      pitch: settings.pitch,
    });
  }, [engine, voice, settings.rate, settings.pitch]);

  // A script opened by the end of the previous one starts by itself, so a
  // whole commute plays without touching the phone.
  const status = state.status;
  useEffect(() => {
    if (!supported || chunks.length === 0 || status !== "idle") return;
    if (isAutoplayRequested(scriptId)) engine.play(0);
  }, [engine, supported, chunks, scriptId, status]);

  // When the script ends, open the next one. The engine counts each ending, and
  // the count handled so far is kept here so one ending is acted on only once.
  const finished = state.finished;
  const handledFinishes = useRef(0);
  const { autoPlayNext } = settings;
  useEffect(() => {
    if (finished <= handledFinishes.current) return;
    handledFinishes.current = finished;
    if (autoPlayNext) onFinished?.();
  }, [finished, autoPlayNext, onFinished]);

  useEffect(() => {
    if (status === "playing") clearAutoplay();
  }, [status]);

  // --- Position and time ----------------------------------------------------

  const lastIndex = Math.max(0, chunks.length - 1);
  const index = Math.min(state.index ?? savedIndex, lastIndex);
  const cumulative = useMemo(() => cumulativeSeconds(chunks), [chunks]);
  const rate = settings.rate;
  const totalSeconds = cumulative[cumulative.length - 1] / rate;
  const elapsedSeconds = (cumulative[index] ?? 0) / rate;
  // Show the highlight once the reader has started or chosen a place.
  const started = state.status !== "idle" || state.index !== null;

  // --- Phone integration ----------------------------------------------------

  const playing = state.status === "playing";
  const { keepScreenOn, backgroundAudio } = settings;

  const play = useCallback(() => {
    if (!supported) return;
    engine.play(index);
  }, [engine, index, supported]);

  const pause = useCallback(() => engine.pause(), [engine]);

  useEffect(() => {
    if (!playing) {
      session.deactivate();
      return;
    }
    session.activate(
      { title, artist: "AIPOD", album: subtitle },
      {
        play: () => engine.play(),
        pause: () => engine.pause(),
        seekBackward: () => engine.skipBy(-SKIP_SECONDS),
        seekForward: () => engine.skipBy(SKIP_SECONDS),
        previousTrack: () => engine.skipParagraph(-1),
        // With a script after this one it is "next episode", as in a podcast
        // app. Without one it skips a paragraph.
        nextTrack: () => (onNext ? onNext() : engine.skipParagraph(1)),
      },
      { keepScreenOn, backgroundAudio },
    );
  }, [
    playing,
    session,
    engine,
    title,
    subtitle,
    keepScreenOn,
    backgroundAudio,
    onNext,
  ]);

  // --- Actions the interface uses -------------------------------------------

  const toggle = useCallback(() => {
    if (playing) engine.pause();
    else play();
  }, [engine, play, playing]);

  const updateSettings = useCallback(
    (patch: Partial<PlayerSettings>) =>
      settingsStore.set({ ...settingsStore.getSnapshot(), ...patch }),
    [],
  );

  return {
    supported,
    status: state.status,
    playing,
    error: state.error,
    index,
    started,
    wordRange: state.wordRange,
    settings,
    updateSettings,
    voices,
    elapsedSeconds,
    totalSeconds,
    play,
    pause,
    toggle,
    skip: (seconds: number) => engine.skipBy(seconds),
    // The slider shows time at the current speed. The engine works in 1x time.
    seekToSeconds: (seconds: number) =>
      engine.seek(chunkAtTime(cumulative, seconds * rate)),
    jumpTo: (chunk: number) => engine.seek(chunk),
  };
}

export type SpeechPlayer = ReturnType<typeof useSpeechPlayer>;
