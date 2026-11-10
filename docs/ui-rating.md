# UI rating

How good the interface is, scored against what it is for: one person revising from their phone on a commute, often one-handed, often in low light.

The score is a weighted average of the areas below. Each area is scored out of 10 from screenshots of a phone-sized screen (390 wide) and a desktop screen, in light and dark. The goal is 9 or more overall.

## Areas

| Area | Weight | What a 9 looks like |
| --- | --- | --- |
| Playlist on a phone | 20% | Easy to scan, whole row is tappable, nothing clipped, shows what matters (title, length, state) and hides the rest. | 9 |
| Player and reading | 25% | Big, reachable controls; leaves room for the text; secondary settings out of the way; the text is a pleasure to read. | 9 |
| Look and feel | 15% | A clear identity, consistent spacing and type, small touches that feel designed. | 10 |
| Navigation and hierarchy | 10% | Always clear where you are and what to do next; plain words, no jargon. | 9 |
| Dark mode | 10% | Follows the phone, can be overridden, every screen looks intended. | 9 |
| Touch and accessibility | 10% | Targets at least 44px, visible focus, good contrast, respects reduced motion, labelled controls. | 9 |
| States and feedback | 5% | Loading, empty, error, and success are all designed. | 9 |
| Desktop | 5% | Uses the space well. | 9 |

## Scores

| Area | Weight | v0 | v1 | v2 | v3 | v4 | v5 | v6 | v7 | v8 | v9 | v10 | v11 | v12 | v13 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Playlist on a phone | 20% | 3 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |
| Player and reading | 25% | 4 | 4 | 7 | 7 | 7 | 8 | 8 | 8 | 9 | 9 | 9 | 9 | 9 | 9 |
| Look and feel | 15% | 4 | 4 | 5 | 5 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 9 | 10 |
| Navigation and hierarchy | 10% | 5 | 5 | 5 | 5 | 5 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 9 | 9 |
| Dark mode | 10% | 2 | 2 | 2 | 7 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 9 | 9 |
| Touch and accessibility | 10% | 5 | 5 | 6 | 6 | 6 | 6 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 |
| States and feedback | 5% | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 9 | 9 | 9 | 9 | 9 |
| Desktop | 5% | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 6 | 9 | 9 | 9 | 9 |
| **Overall** | | **4.0** | **5.0** | **6.0** | **6.5** | **7.1** | **7.6** | **7.9** | **8.1** | **8.4** | **8.5** | **8.7** | **8.9** | **9.0** | **9.2** |

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
- **v6, accessibility.** Measured with the axe accessibility engine on every page in light and dark, and with the settings sheet, theme menu, and review panel open. It found one real problem, an unlabelled slider, which is fixed; the pages now have no violations. Keyboard use was checked by tabbing through: a "skip to content" link appears first, every tappable row and card shows a clear focus ring, and the player is reachable. Motion is switched off for people who ask for less of it. One standard note remains: the theme menu pop-up sits outside the page landmarks, which is normal for pop-up menus.
- **v7, playlist actions.** A "Play all" button starts the first script from the top, and every script after it follows on its own. Scripts you have started show a thin progress bar and the time left right in the list, and the list fades in gently.
- **v8, reading and listening.** Auto-scroll used to drag you back to the current sentence even if you had scrolled ahead on purpose. Now it stops following as soon as you scroll yourself, and a "Jump to current sentence" button appears; it starts following again when you tap it or restart playback. Text size has four settings in the sheet and is remembered. The lock screen and notification now show the app icon as artwork. The play button gives a small press response.
- **v9, states and feedback.** Every state now has a designed screen instead of plain text: an empty playlist (with the three steps to add a script), a page that does not exist, a script that does not exist, and a page that fails (with a Try again button). They share one look. Syncing now reports its result in a toast, which is seen wherever you are on the page and read out to screen readers, instead of a line of text appearing below a button.
- **v10, desktop.** On a wide screen a script page now has the playlist beside it: a rail listing every script with its length, the current one highlighted, so you can jump to any script without going back. The player bar's controls line up exactly with the reading column. Keyboard shortcuts work on a computer: space plays and pauses, the left and right arrows skip 15 seconds, and N opens the next script. They leave alone any key that a focused button, slider, menu, or the review panel already uses. The playlist page is a little wider on large screens. Phones are unchanged.
- **v11, home page and navigation.** The home page now shows the product instead of describing it: a picture of the real player, with the highlighted word moving along the sentence the way it does when reading (it stands still for people who ask for less motion). On a phone, script pages no longer repeat "Playlist" twice at the top: the header link already says where you are, and the old back link is gone, which also lets the text start higher. Each script has its own page title, so browser tabs, history, and the Android task switcher say which script is open.
- **v12, dark mode and a final check.** Dark mode is now consistent everywhere: the review panels, the theme menu, the toasts, the settings sheet, and the new home page preview were each checked in dark. A last accessibility run over 40 combinations (10 pages and open states, phone and desktop, light and dark) found two problems introduced by later work, both fixed: error pages had no top-level heading, and the header navigation and the desktop playlist rail were two unnamed navigation regions. A last end-to-end run on a production build passed: playlist, playing, automatic hand-over to the next script, resume, theme, and the error screen.

- **v13, a design that was chosen.** The app scored 9 while looking like every other interface an AI writes: an indigo gradient, Geist, a pill badge over a centred headline, three icon-topped cards, one radius on everything. Audited against the [avoid-ai-design](../.agent/skills/avoid-ai-design/) catalogue of 67 such patterns, it had one P0 and four P1 findings, and the rendered page had more. The whole look now comes from one idea written down in [DESIGN.md](../DESIGN.md): paper, blue-black ink, and a single highlighter that only ever sits behind text, which is exactly what the app does to a word while it reads it aloud. Literata sets the script because it was made for reading on screens; Atkinson Hyperlegible sets the interface because it was drawn to keep characters apart for people who cannot see them well, which is also what a phone on a moving train asks of a reader. `pnpm slop` re-runs the audit and now reports nothing. Accessibility was re-measured on the new palette across 32 page states: no violations beyond the known theme-menu note.

## Result

**9.2 out of 10.** From 4.0 at the start.

How far to trust that number: it is a judgement from screenshots at phone and desktop sizes, in light and dark, plus automated checks (the axe accessibility engine, scripted browser tests with a stand-in speech engine). It was not tested by a person on a real Android phone.

What would still move it, honestly:

- **Real-device use.** Whether the player bar sits well under a real thumb, whether the real Android voice highlights words in step, and above all whether speech keeps playing with the screen locked (see [player.md](player.md)). None of this can be seen in a desktop browser.
- **The theme menu pop-up** is drawn outside the page's landmark regions, so the accessibility engine notes it. This is normal for pop-up menus and does not affect use.
- **Playback that survives leaving a script.** Opening the playlist or another script stops the current one. A player that lives outside the page, so browsing never interrupts listening, would be the biggest remaining improvement. It is a larger change to how playback is built.

