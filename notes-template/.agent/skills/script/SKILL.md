---
name: script
description: "Turn the user's markdown study notes into spoken scripts for AIPOD. Use when the user says 'script', 'use skill script', invokes /script, or asks to generate or refresh scripts from their notes."
---

Rewrite study notes as scripts meant to be heard. Skill version: 1.

The one rule above all others: **change only how it reads, never what it says.** The user wrote these notes to revise from. A script that adds, drops, or reorders a fact is a bad script, however smooth it sounds.

## Steps

1. **Find the work.** Run `.agent/skills/script/pending.sh`. Each line is `status`, note path, script path, and the note's current hash, separated by tabs.
   - `new`: the note has no script. Write one at the script path shown.
   - `stale`: the note changed after its script was written. Rewrite the script at that path.
   - `ok`: nothing to do.

   If the user named specific notes, do only those. If more than 5 notes are pending, tell the user the count and ask before starting.

2. **Write each script.** Read the note in full, then write the script file (format below) following the rules below. Do one note at a time.

3. **Check before saving.** Go through the note point by point and confirm each one is in the script. Then read the script and confirm nothing is in it that is not in the note. Fix any gap.

4. **Report.** List the scripts written. Mention anything in a note that was unclear, too thin to say well, or contradictory. Do not fill gaps from your own knowledge. Then tell the user to read each script, change `status: draft` to `status: approved` when happy, commit and push, and press Sync in AIPOD.

Do not edit the notes. Do not commit or push.

## What you may change

Allowed, because it only changes the form:

- Turn headings into spoken transitions, such as "Next, let's look at...".
- Turn bullets and fragments into full sentences.
- Turn tables into spoken comparisons.
- Expand abbreviations on first use, and say symbols and file extensions in words ("dot tf", "S3 bucket").
- Describe code and commands in words, keeping the exact names of commands, flags, and identifiers.
- Open with one or two sentences saying what the listener will be able to explain by the end.
- Close with a short recap that repeats the note's own key points.

Not allowed, because it changes the content:

- New facts, examples, numbers, analogies, or advice that are not in the note.
- Dropping a point, even a small one, or merging two points so one disappears.
- Reordering points. Keep the note's order.
- Softening or strengthening a claim (for example "can" to "always").
- Correcting the note. If something looks wrong, leave it as written and say so in your report.

## How it should sound

- Plain spoken sentences. Short enough to say in one breath.
- No markdown in the body: no `#`, `-`, `*`, backticks, tables, or links.
- Separate paragraphs with a blank line. Each paragraph should be one idea, because the player moves paragraph by paragraph.
- Keep numbers as digits ("2 hours", not "two hours"). The voice reads digits correctly, and AIPOD's fact check relies on them to spot a number that was dropped or added.
- Keep terms the user would be asked about exactly as the note spells them, so they are recognised on the day.

## File format

Save to the script path from step 1 (the note's folder path, mirrored under `scripts/`, ending in `.script.md`). The file starts with a header, then the spoken text:

```
---
id: terraform-basics
title: Terraform basics
topic: Terraform
source: notes/terraform/basics.md
source_hash: 56bbea268a50ac2660414091ee952fc986140e45
model: <the model you are>
skill_version: 1
status: draft
---
Spoken text starts here...
```

- `id`: the note path without `notes/` and `.md`, with slashes turned into dashes, all lowercase. It must be unique. **When rewriting a stale script, keep its existing id.** It never changes.
- `title`: the note's top heading.
- `topic`: the note's first folder, written in normal capitals. If the note is not in a folder, use the title.
- `source`: the note path.
- `source_hash`: the fourth column from `pending.sh` for that note. Copy it exactly. It is what lets AIPOD tell when the note has changed since.
- `model`: the model id you are running as.
- `skill_version`: the version at the top of this file.
- `status`: always `draft`, including when rewriting a script the user had approved. The text is new, so it needs reading again.
