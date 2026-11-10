/**
 * The shape of the notes repo, drawn as the thing it actually is: a folder of
 * markdown files in git. Each row carries its own explanation, so the picture
 * doubles as the documentation.
 */

type Row = {
  /** Box-drawing prefix, exactly as a terminal would print the tree. */
  prefix: string;
  name: string;
  /** Files the reader should look at, as opposed to the folders holding them. */
  leaf?: "note" | "script" | "config";
  note?: string;
};

const TREE: Row[] = [
  { prefix: "", name: "aipod-notes/" },
  {
    prefix: "├─ ",
    name: "notes/",
    note: "Your markdown, in whatever folders suit you.",
  },
  { prefix: "│  └─ ", name: "terraform/" },
  {
    prefix: "│     └─ ",
    name: "basics.md",
    leaf: "note",
    note: "A note you wrote yourself.",
  },
  {
    prefix: "├─ ",
    name: "scripts/",
    note: "The same folder shape, one script per note.",
  },
  { prefix: "│  └─ ", name: "terraform/" },
  {
    prefix: "│     └─ ",
    name: "basics.script.md",
    leaf: "script",
    note: "The spoken version of the note above, written by the /script skill.",
  },
  {
    prefix: "└─ ",
    name: "playlist.yml",
    leaf: "config",
    note: "The order you hear them in.",
  },
];

const LEAF_STYLE: Record<NonNullable<Row["leaf"]>, string> = {
  note: "text-foreground",
  script: "text-primary",
  config: "text-foreground",
};

export function NotesDiagram() {
  return (
    <section
      id="your-notes"
      className="mx-auto w-full max-w-5xl scroll-mt-14 px-4 py-16"
    >
      <h2 className="max-w-2xl text-3xl font-semibold">Where your notes live</h2>
      <p className="mt-3 max-w-xl text-muted-foreground">
        In your own git repo, as plain markdown. The app only ever reads it.
      </p>

      <figure className="mt-8">
        <div className="overflow-hidden rounded-[0.72rem] border bg-card px-4 py-5 sm:px-6">
        <ul>
          {TREE.map((row) => (
            <li
              key={row.prefix + row.name}
              className="grid gap-x-8 gap-y-0.5 py-1.5 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-baseline"
            >
              <code className="font-mono text-sm whitespace-pre">
                <span aria-hidden className="text-muted-foreground/60">
                  {row.prefix}
                </span>
                <span
                  className={
                    row.leaf
                      ? `${LEAF_STYLE[row.leaf]} font-medium`
                      : "text-muted-foreground"
                  }
                >
                  {row.name}
                </span>
              </code>
              {row.note ? (
                // On a phone the note sits under its row, indented so the
                // tree's own shape still reads down the left edge.
                <span className="pl-6 text-xs text-muted-foreground sm:pl-0 sm:text-sm">
                  {row.note}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        </div>

        <figcaption className="mt-4 max-w-2xl text-sm text-muted-foreground">
          A sync compares the hash of every file against what it already has,
          and downloads only the ones that changed. Rename a file and nothing
          breaks: each script carries its own id.
        </figcaption>
      </figure>
    </section>
  );
}
