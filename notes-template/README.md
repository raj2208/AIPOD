# AIPOD notes

This folder is the layout for your notes repo. AIPOD reads your notes and scripts from here and plays the scripts aloud. See `docs/architecture.md` in the AIPOD repo for how it fits together.

```
notes/
  terraform/               a collection: one card in AIPOD
    collection.yml         optional: its title, description, cover and place
    cover.png              optional: the picture on the card
    basics.md              a note
  kubernetes/              another collection
    pods.md
scripts/                   one *.script.md per note, mirroring the notes folders
  terraform/basics.script.md
  kubernetes/pods.script.md
playlist.yml               optional: the order scripts are played in
.agent/skills/script/      the /script skill that writes scripts from notes
.claude/skills/script      link so Claude Code finds the skill
```

## Collections

**Each folder directly inside `notes/` is a collection**, and AIPOD shows it as a card in your library. Open the card and you get its scripts, in play order, the way a book's chapters sit inside the book.

Nest as deeply as you like below that: `notes/terraform/state/backends.md` still belongs to the Terraform collection. A note kept straight in `notes/`, in no folder at all, lands in a collection called **Unfiled**.

A collection needs no configuration. Without `collection.yml` its folder name becomes its title ("kubernetes" reads as "Kubernetes"), and AIPOD draws it a cover of its own. Add the file when you want more:

```yaml
title: Terraform
description: Infrastructure as code, from the first apply to state, drift and modules.
cover: cover.png      # any image in this folder
order: 1              # where it sits in the library; unordered ones follow
```

Covers look best at about 3:2 (1200 by 800 or larger) and must be under 2 MB. Keep them in the collection's own folder.

## Use it as your own notes repo

1. Copy this folder to a new private repository (for example `aipod-notes`), and replace the sample notes with your own.
2. Open that repo in Claude Code (or another agent) and run `/script`. It finds notes that have no script, or that changed since their script was written, and writes the scripts as drafts.
3. Read each script. Change `status: draft` to `status: approved` once you are happy with it.

   Scripts are written one sentence to a line, with a blank line between every line. That is deliberate: the player holds a short silence at every blank line, so each point lands before the next one starts. Keep the shape if you edit one by hand.
4. Commit and push.
5. In AIPOD, press Sync (or run `pnpm sync`). Only the files that changed are loaded.

## Developing AIPOD against this folder

`NOTES_DIR=./notes-template` in `.env.local` makes AIPOD read this folder directly, with no GitHub needed. Run `pnpm sync` after changing anything here.

## Play order

`playlist.yml` lists script ids, first to last. Scripts it does not list come after, sorted by topic and title. A typo in an id is reported after the next sync.

## Rules worth knowing

- Never edit a script's `id`. Progress and bookmarks follow it, even if you move or rename the file.
- Edit a note and its script shows a "Note changed" flag in AIPOD until you run `/script` again.
- Edit a script by hand any time. It is just a markdown file. AIPOD never changes it.
