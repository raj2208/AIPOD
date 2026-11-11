import { generator, hashOf } from "@/lib/deterministic";

/**
 * The band of bars that closes the hero: a voice reading, drawn as sound.
 *
 * It is not an equaliser bouncing at random. The bars are phrases — amplitude
 * swelling and falling away, with a breath of quiet between one and the next —
 * and the dark part is how far the voice has got. On load the playhead runs
 * across and stops at the halfway mark, the same place the player beside it is
 * paused, so the two pictures agree. Decorative, and hidden from screen
 * readers; the player itself is what announces position.
 */

const BAR_WIDTH = 6;
const BAR_GAP = 4;
const COUNT = 100;

/** Drawn in viewBox units and stretched vertically to whatever height it gets. */
const HEIGHT = 96;
const WIDTH = COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

/**
 * Speech, not music: a run of bars that rises and falls as one phrase, then a
 * gap, then the next. Seeded from a fixed word, so this is the same waveform
 * on the server, in the browser, and tomorrow.
 */
function phrases(): number[] {
  const next = generator(hashOf("revise your notes by listening"));
  const heights: number[] = [];

  while (heights.length < COUNT) {
    const length = 7 + Math.floor(next() * 11);
    for (let index = 0; index < length && heights.length < COUNT; index++) {
      // 0 → 1 → 0 across the phrase, so it opens, carries and trails off.
      const arc = Math.sin(((index + 0.5) / length) * Math.PI);
      const envelope = 0.3 + 0.7 * arc;
      heights.push(0.1 + envelope * (0.35 + next() * 0.55));
    }
    const breath = 1 + Math.floor(next() * 2);
    for (let index = 0; index < breath && heights.length < COUNT; index++) {
      heights.push(0.06);
    }
  }

  return heights;
}

const BARS = phrases();

function Waveform({ className }: { className: string }) {
  return (
    <svg
      // x stays at one bar to one bar; only the height follows the band.
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={`h-full shrink-0 ${className}`}
      style={{ width: WIDTH }}
    >
      {BARS.map((height, index) => {
        const drawn = Math.max(3, height * HEIGHT);
        return (
          <rect
            key={index}
            x={index * (BAR_WIDTH + BAR_GAP)}
            y={HEIGHT - drawn}
            width={BAR_WIDTH}
            height={drawn}
            rx={BAR_WIDTH / 2}
          />
        );
      })}
    </svg>
  );
}

export function SoundBand() {
  return (
    <div
      aria-hidden
      className="relative flex h-14 justify-center overflow-hidden sm:h-24"
    >
      {/* The whole script, quiet. */}
      <Waveform className="fill-border" />
      {/* The part already read, which the playhead uncovers. */}
      <div className="sound-playhead absolute inset-0 flex justify-center">
        <Waveform className="fill-primary" />
      </div>
    </div>
  );
}
