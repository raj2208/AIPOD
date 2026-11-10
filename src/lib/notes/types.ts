/** A markdown file in the notes repo and its git hash. */
export type RepoFile = { path: string; sha: string };

export type NotesListing = {
  files: RepoFile[];
  /** The commit the listing was taken from, when the source knows it. */
  commit: string | null;
};

/** Where notes and scripts are read from: a local folder or a GitHub repo. */
export interface NotesSource {
  /**
   * Every file the sync cares about, with hashes: markdown, the playlist,
   * collection settings and cover images. Reads no file contents.
   */
  list(): Promise<NotesListing>;
  /** The full text of one file from the listing. */
  read(file: RepoFile): Promise<string>;
  /** The bytes of one file from the listing. Used for cover images. */
  readBytes(file: RepoFile): Promise<Uint8Array>;
}

/** Id of the single `sync_state` row that tracks the notes source. */
export const SYNC_STATE_ID = "notes";

export type SyncError = { path: string; message: string };

/** What a sync did. Stored after each run so the app can show it. */
export type SyncReport = {
  added: string[];
  updated: string[];
  removed: string[];
  /** Scripts whose file did not change. */
  unchanged: number;
  errors: SyncError[];
};
