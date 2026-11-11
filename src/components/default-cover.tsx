import { generator, hashOf } from "@/lib/deterministic";

/**
 * The cover drawn for a collection that brought no image of its own: a page of
 * notes with one line under the highlighter, which is the app's own mark. The
 * lines come from the collection's name, so a collection always looks the same
 * and no two look quite alike.
 */

const WIDTH = 300;
const HEIGHT = 200;
const LEFT = 34;
const RIGHT = 28;

export function DefaultCover({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const next = generator(hashOf(name));
  const count = 6 + Math.floor(next() * 3);
  const gap = (HEIGHT - 48) / count;
  const marked = Math.floor(next() * (count - 1)) + 1;

  const lines = Array.from({ length: count }, (_, index) => {
    // Lines are not all the same length, and a line after a short one starts
    // a little in, the way a new point does on a page of notes.
    const short = next() < 0.22;
    const width = (short ? 0.3 : 0.55) + next() * (short ? 0.12 : 0.4);
    const indent = index > 0 && next() < 0.3 ? 14 : 0;
    return {
      y: 30 + index * gap,
      x: LEFT + indent,
      width: (WIDTH - LEFT - RIGHT - indent) * width,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${name}, no cover image`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={WIDTH} height={HEIGHT} className="fill-card" />
      {/* The margin rule of a notebook page. */}
      <line
        x1={LEFT - 13}
        y1="16"
        x2={LEFT - 13}
        y2={HEIGHT - 16}
        className="stroke-border"
        strokeWidth="1.5"
      />
      {lines.map((line, index) =>
        index === marked ? (
          <g key={index}>
            <rect
              x={line.x - 4}
              y={line.y - 7}
              width={line.width + 8}
              height={13}
              rx="2.5"
              className="fill-signal"
            />
            <rect
              x={line.x}
              y={line.y - 3.5}
              width={line.width}
              height="6"
              rx="3"
              className="fill-signal-ink"
            />
          </g>
        ) : (
          <rect
            key={index}
            x={line.x}
            y={line.y - 3.5}
            width={line.width}
            height="6"
            rx="3"
            className="fill-foreground"
            opacity="0.28"
          />
        ),
      )}
    </svg>
  );
}
