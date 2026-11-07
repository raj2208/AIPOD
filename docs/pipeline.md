# Pipeline

How a markdown note becomes audio.

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
  3. Fidelity check (and optional review)
        |
        v
  4. Text-to-speech
        |
        v
  5. Audio the user can download and play
```

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
- **Regenerate only on change.** A new script is produced only when the source note changes, and the difference is visible in git.
- **Pin the model and prompt.** Upgrading either is an explicit regeneration step, never a silent one.

## 4. Fidelity check

The main risk is the AI drifting from the facts while making things sound smooth. Planned guardrails:

- Extract key terms, numbers, and names from the source note and confirm each appears in the script. Flag anything missing or newly introduced.
- Optional human review: the user reads a script before it is voiced.

## 5. Text-to-speech and delivery

A text-to-speech provider voices the script. Episodes should be available for offline listening, since commutes may have poor signal, so they are generated ahead of time rather than on demand.
