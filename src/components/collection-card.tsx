import Link from "next/link";

import { CollectionProgress } from "@/components/collection-progress";
import { DefaultCover } from "@/components/default-cover";
import type { CollectionSummary, Script } from "@/db/schema";
import { formatDuration } from "@/lib/duration";
import { estimateSeconds } from "@/lib/tts/chunks";

/** The cover image, or the one drawn for a collection that has none. */
export function CollectionCover({
  collection,
  className,
}: {
  collection: CollectionSummary;
  className?: string;
}) {
  if (collection.coverHash) {
    return (
      // The url carries the image's hash, so it is cached until it changes.
      // The bytes come from the notes repo through our own route, so there is
      // nothing for the image optimiser to do.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/covers/${collection.slug}?v=${collection.coverHash}`}
        alt=""
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }
  return <DefaultCover name={collection.title} className={className} />;
}

/**
 * One collection in the library: its cover, its name, and what is inside it.
 * The whole card is the link.
 */
export function CollectionCard({
  collection,
  scripts,
}: {
  collection: CollectionSummary;
  scripts: Script[];
}) {
  const seconds = scripts.reduce(
    (total, script) => total + estimateSeconds(script.content),
    0,
  );

  return (
    <li>
      <Link
        href={`/library/${collection.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/40 focus-ring"
      >
        <span className="block aspect-3/2 overflow-hidden border-b bg-muted">
          <CollectionCover
            collection={collection}
            className="size-full object-cover"
          />
        </span>

        <span className="flex flex-1 flex-col p-4">
          <span className="block font-heading text-lg leading-snug font-semibold group-hover:underline">
            {collection.title}
          </span>
          {collection.description && (
            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
              {collection.description}
            </span>
          )}
          {/* Pushed to the bottom so cards in a row line up whether or not
              they have a description. */}
          <span className="mt-auto block pt-3 text-sm text-muted-foreground tabular-nums">
            {scripts.length === 0
              ? "No scripts yet"
              : `${scripts.length} ${scripts.length === 1 ? "script" : "scripts"}, ${formatDuration(seconds)}`}
          </span>
          <CollectionProgress scripts={scripts.map((script) => ({ id: script.id }))} />
        </span>
      </Link>
    </li>
  );
}
