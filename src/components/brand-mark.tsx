/**
 * The app's mark: three lines of text with the middle one under a highlighter.
 * The same drawing as the app icon, and the one place the highlighter appears
 * as a shape rather than behind real words.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect
        x="3"
        y="4.4"
        width="17"
        height="2.6"
        rx="1.3"
        fill="currentColor"
        opacity=".45"
      />
      <rect x="1.6" y="9.3" width="20.8" height="5.6" rx="1.4" className="fill-signal" />
      <rect x="3.4" y="10.9" width="15" height="2.6" rx="1.3" fill="currentColor" />
      <rect
        x="3"
        y="17.2"
        width="11.5"
        height="2.6"
        rx="1.3"
        fill="currentColor"
        opacity=".45"
      />
    </svg>
  );
}
