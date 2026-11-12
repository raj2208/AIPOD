# Player

The web reader: how the script is played back on Raj's Android phone. This is the leading option for playback (see [vision.md](vision.md)).

## Reference: a web novel reader

Web novel reading sites already solve a similar problem, which is reading long text aloud on a phone. One of them, novelping.com, was studied for ideas. Only its behavior was looked at. Its code is not to be copied.

What it does:

- **Browser text-to-speech.** It uses the browser's built-in speech engine (the Web Speech API). It has no cloud voices and no audio files. The voices are whatever the phone provides.
- **Sentence by sentence.** The text is split into sentences, with short ones merged up to about 240 characters. This avoids the engine stalling on long text, and makes highlighting and seeking possible.
- **Settings.** Voice, language, speed, pitch, highlight mode (word or sentence), auto-play next chapter, and auto-scroll. Settings are saved in the browser.
- **Speed.** Presets from 0.75x to 4x. Some network voices in Chrome cap at about 2x, while on-device voices go higher.
- **Skip.** Back and forward by 15 seconds, estimated from sentence lengths.
- **Text cleanup.** Ads, comments, and navigation are removed before speaking, and the spoken text is mapped back to the original so highlighting lands in the right place.
- **Phone integration.** The Media Session API gives lock-screen and headphone-button controls, and the position is remembered across chapters.
- **Recovery.** A timer checks every 1.5 seconds and resumes or restarts speech if the engine pauses or stalls.
- **Wake lock.** It asks the phone to keep the screen on. This does not make speech continue when the screen is off.

## Candidate features for the first version

These are ideas taken from the reference. All six are built; see "Current status" below.

1. Sentence-level playback with word or sentence highlighting.
2. Voice picker, speed presets, and pitch.
3. Lock-screen and headphone-button controls (Media Session).
4. Saved playback position and auto-play of the next note.
5. A recovery timer for when the speech engine stalls.
6. Screen wake lock as a fallback.

AIPOD's scripts are written to be spoken, so the text-cleanup step that the reference needs should mostly not be needed.

## The main risk: screen locked

On a commute the phone is in a pocket with the screen off. Browser speech often stops in that case, and the reference site's wake lock suggests it is built for a phone that stays awake. This has not been tested on Raj's phone.

**Test to run:** play a long script in the browser on Raj's Android phone, lock the screen, and see whether speech continues for 20 minutes or more.

- If it continues, the web reader is the simplest path.
- If it stops, the web reader becomes a read-along tool, and commute listening uses the pre-generated audio fallback.

## Current status

The web reader is built and works in desktop Chrome with the real speech engine. It has not been tried on an Android phone yet.

What is built:

- **Sentence chunks.** Scripts are cut into sentences, and short ones are joined up to 240 characters, never across a paragraph.
- **A pause between paragraphs.** The player holds 0.7 seconds of silence at every blank line, scaled by the speed, so a point has a moment to land before the next one starts. This is revision, not a story. Scripts are written one sentence to a paragraph (see the `/script` skill), so in practice there is a beat after every sentence. The silence counts towards the clock and the slider, and the watchdog knows not to treat it as a stall.
- **Highlighting.** The current chunk is highlighted, and the current word too when the browser reports word positions. The mode can be off, sentence, or word. Tapping a sentence jumps to it.
- **Controls.** The player is a bar docked to the bottom of the screen, within thumb's reach: a position slider, play and pause, back and forward 15 seconds, and a speed chip that steps through the speeds when tapped. Everything else (a speed picker from 0.75x to 3x, voice, pitch, text size, highlighting, and the switches) is in a bottom sheet. Settings are saved in the browser.
- **Saved position.** Each script remembers where you stopped, and the scripts list offers a "Continue listening" shortcut back to the last one left part way. Positions are kept in the browser on that device.
- **Auto-scroll.** The page follows the sentence being read. If you scroll yourself, it stops following so it does not pull you back, and a "Jump to current sentence" button appears. It follows again when you tap it or restart playback.
- **On a computer.** Scripts show the rest of their collection beside them, and the player lines up with the text. Space plays and pauses, the left and right arrows skip 15 seconds, and N opens the next script.
- **Phone integration.** Lock-screen controls (Media Session) with the app icon as artwork, an optional screen wake lock, and an optional silent audio loop (see below).
- **Recovery.** A timer restarts speech that stopped on its own.
- **Installable.** Chrome on Android can install AIPOD to the home screen, where it opens full screen with its own icon and starts on the scripts list. Chrome reports no installability errors for it. Installing needs the deployed site to be served over HTTPS.
- **Play order and auto-advance.** Scripts play in the order set by `playlist.yml` in the notes repo, then by topic and title, within the collection they belong to. When one ends, the next in that collection opens and starts by itself, so a whole commute plays without touching the phone, and playing stops at the end of the collection. This can be switched off in the player settings. The lock-screen "next" button opens the next script. Previous and next scripts are also shown under the text. The list shows each script's position and length, and the total.

Design choices:

- **Pause cancels the speech.** Resuming restarts the current sentence. The browser's own pause is unreliable on Android Chrome.
- **Background audio.** On Android, browser speech alone is not treated as media playing. The player plays a silent audio loop next to the speech so the browser shows media controls and may keep the page alive with the screen off. This is an experiment, and it can be turned off in the player settings.

Auto-advance opens the next script as a new page inside the same browser tab, and starts it right away. It is checked in desktop Chrome with a stand-in speech engine, with each script spoken once and in order. Whether the hand-over works with the phone's screen locked is part of the screen-lock test below: when a script ends, the next one has to start without the screen being touched.

## Running the screen-lock test

Wake lock and media controls only work on a secure page, so the phone cannot simply open a plain `http://` address on the laptop.

1. Deploy the app, or forward the port from the laptop with Chrome's remote debugging (`chrome://inspect`, then port forwarding for 3000).
2. Open a script in Chrome on the phone and press play. Try it both in a browser tab and as the installed app (Chrome menu, then Install app), since Android may treat them differently.
3. Lock the screen and listen for 20 minutes or more.
4. Try it with "Background audio" on and then off, and note which keeps playing.
5. Use a playlist of two short scripts, and check that the second starts by itself after the first ends with the screen locked.
6. Record the result in [open-questions.md](open-questions.md).
