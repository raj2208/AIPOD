# AIPOD

AI-voiced revision podcasts from your own study notes.

You write notes in markdown. AIPOD rewrites them into flowing spoken scripts, and you listen to them, for example on your commute.

See [docs/vision.md](docs/vision.md) for the idea and [docs/pipeline.md](docs/pipeline.md) for how it works.

## Development

You need Node.js, pnpm, and a running Postgres.

```bash
pnpm install
createdb aipod
cp .env.example .env.local   # then set DATABASE_URL
pnpm db:migrate              # create the tables
pnpm sync                    # load scripts from the notes folder
pnpm dev
```

Then open http://localhost:3000.

## Where scripts come from

Scripts are not written in the app. They live as markdown files in a notes repo and are loaded into Postgres by a sync. `notes-template/` is the layout of that repo, with a sample Terraform note and the `/script` skill that writes scripts from notes. By default `.env.example` points `NOTES_DIR` at it, so `pnpm sync` works without GitHub. See [docs/architecture.md](docs/architecture.md).

Run the tests with `pnpm test`.

## Design

[DESIGN.md](DESIGN.md) is the contract: the palette with its measured contrast, the three typefaces and why each is there, the layout rules, and the list of defaults this design refuses. Read it before building a page, and add a token to it rather than inventing one in a component.

`pnpm slop` audits the interface against [avoid-ai-design](.agent/skills/avoid-ai-design/), a catalogue of the patterns that make a UI look AI-generated. It finds only what is provable from the source, so a clean run is necessary, not sufficient.
