/**
 * The voices the browser offers. They load late and can change, so this is a
 * store that React can subscribe to.
 */
const EMPTY: SpeechSynthesisVoice[] = [];
let cache = EMPTY;

function supported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function refresh() {
  if (!supported()) return;
  const next = window.speechSynthesis.getVoices();
  const same =
    next.length === cache.length &&
    next.every((voice, i) => voice.voiceURI === cache[i].voiceURI);
  if (!same) cache = next.length === 0 ? EMPTY : next;
}

export function subscribeVoices(listener: () => void) {
  if (!supported()) return () => {};
  const onChange = () => {
    refresh();
    listener();
  };
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  // Some browsers have the voices ready but never fire the event.
  onChange();
  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

export function getVoicesSnapshot() {
  if (cache === EMPTY) refresh();
  return cache;
}

export function getServerVoices() {
  return EMPTY;
}

/** English voices first, on-device ones before network ones, then by name. */
export function sortVoices(voices: SpeechSynthesisVoice[], lang: string) {
  const family = lang.toLowerCase().split("-")[0];
  const matching = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(family),
  );
  const list = matching.length > 0 ? matching : voices;
  return [...list].sort(
    (a, b) =>
      Number(b.localService) - Number(a.localService) ||
      a.name.localeCompare(b.name),
  );
}
