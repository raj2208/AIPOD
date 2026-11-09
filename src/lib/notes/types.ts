/** A markdown file in the notes repo and its git hash. */
export type RepoFile = { path: string; sha: string };

export type NotesListing = {
  files: RepoFile[];
  /** The commit the listing was taken from, when the source knows it. */
  commit: string | null;
};

/** Where notes and scripts are read from: a local folder or a GitHub repo. */
export interface NotesSource {
  /** Every markdown file, with its hash. Reads no file contents. */
  list(): Promise<NotesListing>;
  /** The full text of one file from the listing. */
  read(file: RepoFile): Promise<string>;
}

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
