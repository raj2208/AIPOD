---
version: alpha
name: AIPOD
description: One person's revision tape. It reads the notes you wrote aloud on your commute, and marks where the voice has got to. It should feel like your own study material, not like a product.
colors:
  ground: "#f4f9f7"      # the page: cool paper, never parchment
  surface: "#fcfefd"     # a sheet lying on it
  ink: "#0b292b"         # body text, blue-black
  muted: "#485f60"       # secondary text
  primary: "#004e51"     # the one structural colour: actions, progress, current item
  primaryInk: "#f8fbfa"  # text on primary
  signal: "#f8d438"      # the highlighter. Only ever behind text.
  signalSoft: "#feeba6"  # the same marker, for a whole passage
  signalInk: "#0b292b"   # text sitting on the marker
  warn: "#ab331f"        # something needs checking
  border: "#d6e1de"
typography:
  display:
    fontFamily: Literata
    fontSize: clamp(2.25rem, 1.4rem + 4vw, 4rem)
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: Atkinson Hyperlegible
    fontSize: 1rem
    lineHeight: 1.6
  reading:
    fontFamily: Literata
    fontSize: 1.125rem
    lineHeight: 1.75
  mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.875rem
rounded:
  control: 0.4rem
  panel: 0.72rem
  mark: 0.2rem
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 2rem
  section: 4rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primaryInk}"
    rounded: "{rounded.control}"
    padding: 0.625rem 1.125rem
  mark-voice:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signalInk}"
    rounded: "{rounded.mark}"
---

## Overview

AIPOD turns one person's markdown notes into spoken scripts and plays them back
on a two-hour commute. The audience is one: the person who wrote the notes. It
is not sold to anyone, so it has nothing to sell.

The look comes from the study material it is made of, not from software. Its
world holds exactly three things: **paper**, **blue-black ink**, and **one
yellow highlighter**. A note is a sheet of paper. The text on it is written in
the blue-black of an ordinary fountain pen, which is neither black nor blue but
a deep petrol. And when the voice reads a word aloud, that word is marked with
the highlighter, the same way you would mark the line you are revising.

That is the whole idea, and the highlighter is where all of the boldness is
spent. Everything else is quiet on purpose: the app is read one-handed, in
motion, often in sunlight, by someone who should be listening rather than
looking.

## Colors

Measured with WCAG 2 contrast ratios, not estimated.

- **Ground (#f4f9f7):** a cool paper white with a trace of green in it. Cool
  deliberately: warm cream with a clay accent is the commonest "tasteful AI"
  palette there is (SD1), and this is the opposite corner of the same idea.
- **Surface (#fcfefd):** a sheet on the desk. Surfaces separate from the ground
  by being *lighter*, not by a shadow.
- **Ink (#0b292b):** 14.5:1 on ground. Blue-black, the colour of writing ink.
- **Muted (#485f60):** 6.4:1 on ground. Secondary text, still comfortably past
  AA at body size.
- **Primary (#004e51):** 8.9:1 on ground; its own text sits at 9.1:1. One job,
  three places: things you can press, progress through a script, and which item
  you are on.
- **Signal (#f8d438):** the highlighter, and the only warm colour in the app.
  **It never appears as a shape on the ground** — not as a bar, a dot, a chip or
  a button. It only ever sits *behind text*, where ink on it reads at 10.6:1.
  A yellow rectangle on near-white paper would be invisible anyway, which is the
  point: a highlighter without words under it is nothing.
- **Warn (#ab331f):** 6.1:1. Reserved for one message: the script may have
  drifted from the note, go and check it. Kept in a different hue from the
  highlighter so "check this" can never be mistaken for "the voice is here".

Dark mode is the same room with the lights off: ground #06181a, surface
#0d2325, ink #e7f1ed (15.8:1), muted #99afaa (7.9:1), primary #64bcb9 (8.2:1),
the highlighter one step down at #edca34 (11.4:1 against the ink on it). It
follows the operating system, with a manual override.

## Typography

Three faces, each with a reason.

- **Literata** (display and reading). Made for reading long text on screens.
  It sets the script itself, because the script is the product, and the page
  titles, because they are the names of things you read.
- **Atkinson Hyperlegible** (interface). Drawn by the Braille Institute to keep
  characters apart for low vision. This app is used in motion, one-handed,
  outdoors, by someone whose eyes are mostly elsewhere, so every label, button
  and list row is set in it.
- **IBM Plex Mono** (file paths only). Mono is for things that really are code:
  paths, ids, hashes. Never for decoration, never for small labels.

Scale: the display size is the only loud typography. Headings step clearly
(4rem / 2rem / 1.5rem / 1.125rem), body is 1rem/1.6, and the script body starts
at 1.125rem/1.75 and goes up to 1.5rem through the text-size setting.

Sentence case everywhere, including buttons. No all-caps eyebrow labels, no
tracked-out micro-labels, no mono for things that are not code.

## Layout

One structural idea: **the page is a page**. Content sits in a single reading
measure, left-aligned, with the margin used for the things you look up rather
than read: which script you are on, what else is in the collection, how long it
runs.

- Reading measure: 42rem. The script page keeps a 16rem playlist rail to its
  left on wide screens, so the measure never moves when you change script.
- The home page is asymmetric: words on the left, the running player on the
  right. Nothing is centred except things that are genuinely symmetrical, like
  the transport controls.
- Container width varies by role: the hero and lists run to 64rem, reading runs
  to 42rem, the player bar spans the reading column exactly.
- Vertical rhythm comes from the spacing scale; sections are separated by space,
  not by rules. A rule is drawn only where it divides two different kinds of
  thing.

## Elevation & Depth

Flat by default. A surface lifts only when it genuinely floats over content:
the docked player bar, the settings sheet, menus and toasts. Those get one
shadow, in ink, never in colour. Cards and panels are a lighter surface with a
hairline border and no shadow.

## Shapes

Radius by role, not one radius everywhere: controls 0.4rem, panels 0.72rem, the
highlighter mark 0.2rem, and the play button a full circle because it is a
transport control. Nothing is `rounded-2xl` by default.

## Components

Shared and reused verbatim on every page: `SiteHeader`, `SiteFooter`,
`StatePanel` for empty, error and not-found states, the shadcn `Button`,
`Badge`, `Card` and `Sheet` primitives as themed here, `ScriptPlayer`, and the
`mark-voice` / `mark-passage` utilities that draw the highlighter.

The highlighter is drawn one way only, by those two utilities. No component
paints its own yellow.

## Do's and Don'ts

- Do reuse the header, footer and tokens above on every page, unchanged.
- Do add a token here before a page uses it. Never invent a one-off in a page.
- Do keep the highlighter behind text, always.
- Don't change: the three faces, the blue-black ink, or the rule that yellow
  means "the voice is here".
- Don't use, having deliberately refused them: the indigo/violet gradient and
  indigo CTAs (C1, C2), gradient headline text (C6), cream with a clay accent
  (SD1), near-black with one acid accent (SD2), all-caps eyebrows, mono labels
  and `A · B · C` meta strings (SD4), one accented word in a headline (SD5),
  decorative 01/02/03 (SD6), fake window chrome (SD7), emerald as the escape
  accent (SD8), the pill badge over a centred hero (K5, L1), three icon-topped
  feature cards (L2), icons in tinted rounded squares (K6), `rounded-2xl
  shadow-lg` on every surface (K2), `Sparkles` and `ArrowRight` from the stock
  Lucide set (I3), and the same fade-up on every section (M1).

Checked with `pnpm slop`, which runs the catalogue these IDs come from
(`.agent/skills/avoid-ai-design/`).
