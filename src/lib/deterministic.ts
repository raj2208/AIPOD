/**
 * Stable pseudo-randomness, for drawings that want variety without surprise.
 *
 * A generated cover or a waveform has to come out the same on the server and
 * in the browser, or React throws the server's drawing away at hydration, and
 * the same on every visit, or the app looks different each time you open it.
 * Seed these from something fixed and they always answer the same.
 */

/** FNV-1a: small, stable, and the same answer everywhere. */
export function hashOf(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** A tiny xorshift generator. Returns numbers in [0, 1). */
export function generator(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}
