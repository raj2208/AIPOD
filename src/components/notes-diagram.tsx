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
      <h2 className="text-2xl font-semibold tracking-tight">
        Where your notes live
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        In your own git repo, as plain markdown. The app only ever reads it.
      </p>

      <figure className="mt-8">
        <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-4 py-2.5">
          <span className="font-mono text-xs text-muted-foreground">
            your notes repo
          </span>
          <span className="text-xs text-muted-foreground">
            markdown and one yaml file
          </span>
        </div>

        <ul className="divide-y">
          {TREE.map((row) => (
            <li
              key={row.prefix + row.name}
              className="grid gap-x-6 gap-y-1 px-4 py-2.5 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-baseline"
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
                <span className="text-sm text-muted-foreground">
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
