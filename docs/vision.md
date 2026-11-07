# AIPOD Vision

## Problem

People spend a lot of dead time listening to music or podcasts on earphones, for example on a commute. Someone preparing for interviews while working a full-time job has little time to study, but still has this audio time.

**Example user: Raj.** Raj works 9-5 and commutes about 2 hours a day. He is preparing for interviews. He wants to use that commute to revise what he has already learned.

## Product

AIPOD turns a person's own study notes into spoken audio they can revise from, using earphones alone.

1. The user studies a topic on their own.
2. They write notes on it as markdown files in a GitHub repository.
3. AIPOD reads those notes and uses AI to rewrite them as a spoken script with a natural flow.
4. The script is converted to speech, and the user listens.

The goal is **revision through audio**, not first-time learning.

## Why AI is needed

Plain text-to-speech of markdown sounds bad. Headings, bullet points, and tables are written for the eye, while listeners need connected paragraphs with transitions. AI bridges that gap by rewriting the structure of the notes into flowing speech.

## Core principle: AI changes the form, never the content

- The **user** decides what to learn and what goes into the notes.
- The **AI** only rewrites the notes into a speakable form.
- The AI must **not** curate, add, remove, or reorder facts.

This is deliberate. AI output is not deterministic and differs between runs and between models, so letting it choose what to teach could go wrong in many ways. The user's notes are the single source of truth.

## Design principles

- **Notes are the source of truth.** Everything else is derived from them.
- **Same input, same audio.** Generated scripts are stored, not regenerated on every play (see [pipeline.md](pipeline.md)).
- **Changes are explicit.** A new model or prompt must never silently change existing episodes.
- **Facts must survive.** A smooth script that gets a fact wrong is a failure, especially for interview prep.

## Out of scope for now

- AI choosing or curating the topics or lectures.
- Teaching topics the user has not already studied and noted down.
