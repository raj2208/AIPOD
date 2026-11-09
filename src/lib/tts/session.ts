/**
 * Things that help playback behave on a phone: lock-screen controls, keeping
 * the screen on, and a silent audio loop.
 *
 * Browser speech alone does not count as "media playing" on Android. Playing a
 * silent audio file alongside it makes the browser show media controls and
 * treat the page as active. Whether that keeps speech going with the screen
 * off has to be tested on the real phone.
 */

export type SessionInfo = {
  title: string;
  artist: string;
  album: string;
};

export type SessionHandlers = {
  play: () => void;
  pause: () => void;
  seekBackward: () => void;
  seekForward: () => void;
  previousTrack: () => void;
  nextTrack: () => void;
};

/** One second of silence as a WAV file, built in memory. */
function createSilentWavUrl(): string {
  const sampleRate = 8000;
  const samples = sampleRate; // one second, 8-bit mono
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));

  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  new Uint8Array(buffer, 44).fill(128); // 128 is silence for 8-bit audio

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export class PlaybackSession {
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private wantsWakeLock = false;
  private active = false;

  // A wake lock is dropped when the tab is hidden, so ask for it again.
  private onVisibility = () => {
    if (document.visibilityState === "visible" && this.active) {
      void this.requestWakeLock();
    }
  };

  /** Call when playback starts. Best called straight from a click handler. */
  activate(
    info: SessionInfo,
    handlers: SessionHandlers,
    options: { keepScreenOn: boolean; backgroundAudio: boolean },
  ) {
    this.active = true;
    this.wantsWakeLock = options.keepScreenOn;
    document.addEventListener("visibilitychange", this.onVisibility);

    if (options.backgroundAudio) this.playSilence();
    else this.pauseSilence();

    if (options.keepScreenOn) void this.requestWakeLock();
    else this.releaseWakeLock();

    this.setMediaSession(info, handlers);
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  }

  /** Call when playback pauses or ends. */
  deactivate() {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.pauseSilence();
    this.releaseWakeLock();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  }

  dispose() {
    this.deactivate();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      for (const action of [
        "play",
        "pause",
        "seekbackward",
        "seekforward",
        "previoustrack",
        "nexttrack",
      ] as MediaSessionAction[]) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Not supported here.
        }
      }
    }
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audio = null;
    this.audioUrl = null;
  }

  private playSilence() {
    if (!this.audio) {
      this.audioUrl = createSilentWavUrl();
      this.audio = new Audio(this.audioUrl);
      this.audio.loop = true;
    }
    // Rejected when the browser wants a user gesture first. Speech still works.
    this.audio.play().catch(() => {});
  }

  private pauseSilence() {
    this.audio?.pause();
  }

  private async requestWakeLock() {
    if (!this.wantsWakeLock || this.wakeLock || !("wakeLock" in navigator)) return;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!this.active || !this.wantsWakeLock) {
        void lock.release();
        return;
      }
      this.wakeLock = lock;
      lock.addEventListener("release", () => {
        if (this.wakeLock === lock) this.wakeLock = null;
      });
    } catch {
      // Denied, for example when the battery is low. Playback carries on.
    }
  }

  private releaseWakeLock() {
    this.wantsWakeLock = false;
    const lock = this.wakeLock;
    this.wakeLock = null;
    if (lock) void lock.release().catch(() => {});
  }

  private setMediaSession(info: SessionInfo, handlers: SessionHandlers) {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    try {
      session.metadata = new MediaMetadata({
        title: info.title,
        artist: info.artist,
        album: info.album,
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    } catch {
      // MediaMetadata is not available.
    }
    const bind = (action: MediaSessionAction, handler: () => void) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // This action is not supported by the browser.
      }
    };
    bind("play", handlers.play);
    bind("pause", handlers.pause);
    bind("seekbackward", handlers.seekBackward);
    bind("seekforward", handlers.seekForward);
    bind("previoustrack", handlers.previousTrack);
    bind("nexttrack", handlers.nextTrack);
  }
}
