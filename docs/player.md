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

These are ideas taken from the reference, not final decisions.

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
