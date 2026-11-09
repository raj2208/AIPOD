# AIPOD notes

This folder is the layout for your notes repo. AIPOD reads your notes and scripts from here and plays the scripts aloud. See `docs/architecture.md` in the AIPOD repo for how it fits together.

```
notes/                     your markdown notes, in any folders you like
scripts/                   one *.script.md per note, mirroring the notes folders
.agent/skills/script/      the /script skill that writes scripts from notes
.claude/skills/script      link so Claude Code finds the skill
```

## Use it as your own notes repo

1. Copy this folder to a new private repository (for example `aipod-notes`), and replace the sample Terraform note with your own.
2. Open that repo in Claude Code (or another agent) and run `/script`. It finds notes that have no script, or that changed since their script was written, and writes the scripts as drafts.
3. Read each script. Change `status: draft` to `status: approved` once you are happy with it.
4. Commit and push.
5. In AIPOD, press Sync (or run `pnpm sync`). Only the files that changed are loaded.

## Developing AIPOD against this folder

`NOTES_DIR=./notes-template` in `.env.local` makes AIPOD read this folder directly, with no GitHub needed. Run `pnpm sync` after changing anything here.

## Rules worth knowing

- Never edit a script's `id`. Progress and bookmarks follow it, even if you move or rename the file.
- Edit a note and its script shows a "Note changed" flag in AIPOD until you run `/script` again.
- Edit a script by hand any time. It is just a markdown file. AIPOD never changes it.
