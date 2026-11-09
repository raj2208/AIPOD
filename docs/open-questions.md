# Open Questions

Questions not yet decided. Move an item to the relevant doc once it is settled.

## Product

- Should every script be reviewed by the user before it is played, or only flagged ones?
- Should the voice be one narrator, or a two-host conversation?
- Is interview prep the first use case, or one use of a general note-revision tool?
- Should there be interview-specific features such as spoken Q&A or spaced repetition?
- In what order are notes played, given the AI does not curate? For example: file names, or an ordered list kept in the notes repo.
- Where exactly is the line between changing form and changing content? Proposed: transitions, expanding abbreviations, and turning fragments into sentences are allowed. New facts, examples, numbers, analogies, and dropping or reordering points are not.

## Technical

- Does browser text-to-speech keep playing on Raj's Android phone with the screen locked, with and without the background audio setting? This decides web reader versus pre-generated audio. The player is built and ready to test. See [player.md](player.md).
- Which AI model for the script transform? A text-to-speech provider is only needed if the audio fallback is used.
- Quota and terms: does running the `/script` skill on the Claude Code subscription stay within its limits for the number of notes?
- How strict should the fidelity check be?
- Which tech stack? The builder is familiar with Next.js and Postgres.

## Scope

- What is the smallest first prototype? For example: one markdown file in, one spoken script out, played in the browser.
