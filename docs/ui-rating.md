# UI rating

How good the interface is, scored against what it is for: one person revising from their phone on a commute, often one-handed, often in low light.

The score is a weighted average of the areas below. Each area is scored out of 10 from screenshots of a phone-sized screen (390 wide) and a desktop screen, in light and dark. The goal is 9 or more overall.

## Areas

| Area | Weight | What a 9 looks like |
| --- | --- | --- |
| Playlist on a phone | 20% | Easy to scan, whole row is tappable, nothing clipped, shows what matters (title, length, state) and hides the rest. |
| Player and reading | 25% | Big, reachable controls; leaves room for the text; secondary settings out of the way; the text is a pleasure to read. |
| Look and feel | 15% | A clear identity, consistent spacing and type, small touches that feel designed. |
| Navigation and hierarchy | 10% | Always clear where you are and what to do next; plain words, no jargon. |
| Dark mode | 10% | Follows the phone, can be overridden, every screen looks intended. |
| Touch and accessibility | 10% | Targets at least 44px, visible focus, good contrast, respects reduced motion, labelled controls. |
| States and feedback | 5% | Loading, empty, error, and success are all designed. |
| Desktop | 5% | Uses the space well. |

## Scores

| Area | Weight | v0 | v1 | v2 | v3 | v4 | v5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Playlist on a phone | 20% | 3 | 8 | 8 | 8 | 8 | 8 |
| Player and reading | 25% | 4 | 4 | 7 | 7 | 7 | 8 |
| Look and feel | 15% | 4 | 4 | 5 | 5 | 8 | 8 |
| Navigation and hierarchy | 10% | 5 | 5 | 5 | 5 | 5 | 8 |
| Dark mode | 10% | 2 | 2 | 2 | 7 | 8 | 8 |
| Touch and accessibility | 10% | 5 | 5 | 6 | 6 | 6 | 6 |
| States and feedback | 5% | 6 | 6 | 6 | 6 | 6 | 6 |
| Desktop | 5% | 6 | 6 | 6 | 6 | 6 | 6 |
| **Overall** | | **4.0** | **5.0** | **6.0** | **6.5** | **7.1** | **7.6** |

## v0: problems found

- **Playlist.** A table squeezed into a phone. Badges stack up to three high, the Length column is cut off at the screen edge, and only the title is a link.
- **Player.** Takes about 40% of the screen. A "Listen" label wastes a row, and a voice dropdown, which is rarely changed, sits next to the main controls. Settings open as a popover that covers the text being read.
- **Look.** Plain black and white defaults with no accent and no personality.
- **Hierarchy.** A closed "Compare with your note" box sits above the text on every script. "Scripts" is internal wording.
- **Dark mode.** The dark styles exist but nothing turns them on.
- **Touch.** Voice, speed, and settings buttons are well under 44px tall.

## Plan

Biggest weighted gap first: the playlist, then the player, then dark mode, then the look, then hierarchy, then touch and accessibility, then navigation and desktop. After each change the screenshots are retaken and the table above is updated.

## Changes by version

- **v1, playlist.** The table became a list of tappable rows: title, then topic, length and any status in small coloured pills. The whole row is the link and nothing is clipped. "Continue listening" is a dark card with a progress bar and time left. Syncing moved to a quiet line under the list. The page is a single readable column on desktop too. Still to do in this area: the page is called "Playlist" but the nav still says "Scripts".
- **v2, player.** The player is a compact bar docked to the bottom of the screen: a position slider, a 64px play button, 15-second skips with the number written inside, a speed chip that steps through speeds when tapped, and a settings button. The old "Listen" label and the voice dropdown are gone from it. Settings open as a bottom sheet with large controls: speed buttons, voice, pitch, highlight, and the switches. The slider is easier to grab, the bar and header are opaque so text no longer ghosts through, and the reader leaves room so the last lines clear the bar.
- **v3, dark mode.** The app follows the phone's light or dark setting by default, and a header menu lets you pick Match my phone, Light, or Dark. The choice is remembered, the page is dark from the first frame (no flash), the browser bar colour follows, and it reacts live if the phone switches at sunset. Still to do: the Continue card and the play button are bright white blocks in dark mode, which is glaring in a dark carriage.
- **v4, look and feel.** The grey defaults gave way to an indigo identity. Every neutral is tinted slightly toward it so the app feels like one thing. Both themes have their own tuned colours: in light the Continue card is a bold indigo card, in dark it is a calm tinted one instead of a glaring white block. The play button, the highlighted word, the logo, and the app icon all use the brand colour. The home page has a soft brand glow, a waveform with depth, and icon chips on the how-it-works cards. The header is opaque so text no longer ghosts through it.
- **v5, script page and navigation.** The top of a script page used to be a status alert, a "compare" box, and a file path. It is now a back link, a line saying where the script sits in the playlist ("3 of 6 · PostgreSQL · 1 min"), the title, and one review row. That row is closed by default and colour-coded: red if the note changed, amber if the fact check found differences, plain otherwise. Opened, it holds the findings and the note itself. The header link says "Playlist" to match the page and shows when you are on it.
