/**
 * What the app actually does to a note, shown rather than described: one real
 * section of the sample note beside the paragraph it becomes. The two are not
 * drawn alike on purpose. The left is a file; the right is something to read.
 *
 * The mono type here is on real file paths and real markdown, which is what
 * mono is for, and it is set at body size rather than shrunk into a label.
 */

const NOTE_LINES = [
  "## Declarative",
  "",
  "- Declarative: describe the end",
  "  result (e.g. one VM of this size",
  "  in this network), Terraform works",
  "  out what to create, change or",
  "  delete.",
  "- Opposite of an imperative script,",
  "  where you spell out every command",
  "  in order.",
];

// Split so the first sentence can carry the highlighter, the way the reader
// marks the sentence the voice is on.
const SPOKEN_LIT = "The most important idea here is that Terraform is declarative.";
const SPOKEN_REST =
  " You don't write the steps to get somewhere. You describe the end result, say, one virtual machine of this size in this network, and Terraform works out what to create, change, or delete to reach it. That's the opposite of an imperative script, where you spell out every command in order.";

export function NoteToScript() {
  return (
    <section
      id="note-to-script"
      className="mx-auto w-full max-w-5xl scroll-mt-14 px-4 py-16"
    >
      <h2 className="max-w-2xl text-3xl font-semibold">
        The same facts, in a form you can listen to.
      </h2>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Bullet points do not survive being read aloud. Everything in them does.
      </p>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-12">
        <figure>
          <figcaption className="font-mono text-sm text-muted-foreground">
            notes/terraform/basics.md
          </figcaption>
          <pre className="mt-2 overflow-x-auto rounded-2xl border bg-muted/50 p-4 font-mono text-sm leading-relaxed text-muted-foreground">
            {NOTE_LINES.join("\n")}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            What you wrote, when you were studying it.
          </p>
        </figure>

        <figure>
          <figcaption className="font-mono text-sm text-muted-foreground">
            scripts/terraform/basics.script.md
          </figcaption>
          <blockquote className="mt-2 font-reading text-lg leading-relaxed">
            <span className="mark-passage">{SPOKEN_LIT}</span>
            {SPOKEN_REST}
          </blockquote>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            What you hear, with the sentence the voice is on marked. Nothing
            was added and nothing was dropped: the skill may only change the
            form. If a number or a command name ever goes missing, the app
            flags the script for you to check.
          </p>
        </figure>
      </div>
    </section>
  );
}
