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

Run the tests with `pnpm test`.
