# Pipeline

How a markdown note becomes audio Raj can listen to.

## Overview

```
GitHub repo (markdown notes)
        |
        v
  1. Read notes
        |
        v
  2. AI transform: notes -> spoken script
        |
        v
  3. Freeze the script (same input, same output)
        |
        v
  4. Fidelity check (and optional review)
        |
        v
  5. Playback: browser text-to-speech (web reader),
     or pre-generated audio (fallback)
```

Where each step runs and where its output is stored is described in [architecture.md](architecture.md).

## 1. Read notes

The user keeps notes as markdown files in a GitHub repository. AIPOD reads them from there. The notes are never modified by AIPOD.

## 2. AI transform

The AI rewrites each note as a script meant to be heard:

- Headings become spoken transitions, such as "Next, let's look at...".
- Bullet points become full sentences.
- Tables become spoken comparisons.
- Code and symbols are described in words.

Rule: no facts are added, removed, or reordered.

## 3. Keeping output stable

AI output varies between runs and between models. To get the same audio every time:

- **Generate once, then freeze.** Each script is stored, keyed by a hash of the source note plus the model and prompt version.
- **Regenerate only on change.** A new script is produced only when the source note changes.
- **Pin the model and prompt.** Upgrading either is an explicit regeneration step, never a silent one.

## 4. Fidelity check

The main risk is the AI drifting from the facts while making things sound smooth. Planned guardrails:

- Extract key terms, numbers, and names from the source note and confirm each appears in the script. Flag anything missing or newly introduced.
- Optional human review: the user reads a script before it is voiced.

## 5. Playback

There are two ways to turn the frozen script into sound. Which one is used depends on a screen-lock test (see [open-questions.md](open-questions.md)).

**Web reader (leading option).** The script is read aloud on the phone by the browser's built-in text-to-speech. Nothing is generated ahead of time except the script. See [player.md](player.md).

**Pre-generated audio (fallback).** A text-to-speech provider voices the script ahead of time, and the audio is published to a private podcast feed so Raj can download episodes and play them offline in a podcast app. This costs money per episode but keeps playing when the screen is locked.

In both cases the AI-written script is the same, so the transform and fidelity check are built first.
