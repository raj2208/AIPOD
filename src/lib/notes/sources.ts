import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

import { gitBlobSha } from "./git-hash";
import { PLAYLIST_PATH } from "./playlist";
import type { NotesListing, NotesSource, RepoFile } from "./types";

const IGNORED_SEGMENT = /^(\..*|node_modules)$/;

/**
 * Markdown files outside hidden folders (.git, .agent, ...) and node_modules,
 * plus the playlist at the top of the repo.
 */
function isNoteFile(path: string): boolean {
  if (path === PLAYLIST_PATH) return true;
  return (
    path.endsWith(".md") &&
    !path.split("/").some((segment) => IGNORED_SEGMENT.test(segment))
  );
}

/** Reads notes from a folder on this machine. Used in development. */
export function createLocalSource(dir: string): NotesSource {
  const root = resolve(dir);

  return {
    async list(): Promise<NotesListing> {
      let entries: string[];
      try {
        entries = await readdir(root, { recursive: true });
      } catch {
        throw new Error(`Cannot read the notes folder: ${root}`);
      }

      const paths = entries
        .map((entry) => entry.split(sep).join("/"))
        .filter(isNoteFile)
        .sort();

      const files: RepoFile[] = await Promise.all(
        paths.map(async (path) => ({
          path,
          sha: gitBlobSha(await readFile(join(root, path))),
        })),
      );
      return { files, commit: null };
    },

    async read(file) {
      const full = resolve(root, file.path);
      // Never read outside the notes folder, whatever the path says.
      if (relative(root, full).startsWith("..")) {
        throw new Error(`Path escapes the notes folder: ${file.path}`);
      }
      return readFile(full, "utf8");
    },
  };
}

export type GitHubSourceOptions = {
  /** `owner/name` */
  repo: string;
  ref?: string;
  /** A read-only token. Required for private repos. */
  token?: string;
  fetch?: typeof fetch;
};

type GitTree = {
  tree: { path: string; type: string; sha: string }[];
  truncated: boolean;
};

/** Reads notes from a GitHub repo. A listing is two cheap API calls. */
export function createGitHubSource(options: GitHubSourceOptions): NotesSource {
  const { repo, ref = "main", token } = options;
  const doFetch = options.fetch ?? fetch;
  const base = `https://api.github.com/repos/${repo}`;

  async function request(url: string, accept: string): Promise<Response> {
    const response = await doFetch(url, {
      headers: {
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "aipod",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // Syncs must see the latest repo, never a cached copy.
      cache: "no-store",
    });
    if (!response.ok) {
      const hint =
        response.status === 404
          ? " Check NOTES_REPO and that NOTES_TOKEN can read it."
          : response.status === 401
            ? " NOTES_TOKEN was rejected."
            : "";
      throw new Error(
        `GitHub returned ${response.status} for ${url.replace(base, repo)}.${hint}`,
      );
    }
    return response;
  }

  return {
    async list() {
      // Resolve the branch to a commit first, so the file list and the
      // reported commit always describe the same snapshot.
      const commitResponse = await request(
        `${base}/commits/${encodeURIComponent(ref)}`,
        "application/vnd.github.sha",
      );
      const commit = (await commitResponse.text()).trim();

      const treeResponse = await request(
        `${base}/git/trees/${commit}?recursive=1`,
        "application/vnd.github+json",
      );
      const tree = (await treeResponse.json()) as GitTree;
      if (tree.truncated) {
        throw new Error(
          "The notes repo is too large for a single listing. Keep it under 100,000 files.",
        );
      }

      const files = tree.tree
        .filter((entry) => entry.type === "blob" && isNoteFile(entry.path))
        .map(({ path, sha }) => ({ path, sha }))
        .sort((a, b) => a.path.localeCompare(b.path));
      return { files, commit };
    },

    async read(file) {
      const response = await request(
        `${base}/git/blobs/${file.sha}`,
        "application/vnd.github.raw+json",
      );
      return response.text();
    },
  };
}

/** Picks a source from environment variables. See docs/architecture.md. */
export function sourceFromEnv(
  env: Record<string, string | undefined> = process.env,
): NotesSource {
  if (env.NOTES_DIR) return createLocalSource(env.NOTES_DIR);
  if (env.NOTES_REPO) {
    return createGitHubSource({
      repo: env.NOTES_REPO,
      ref: env.NOTES_REF || "main",
      token: env.NOTES_TOKEN || undefined,
    });
  }
  throw new Error(
    "No notes source configured. Set NOTES_DIR (a local folder) or NOTES_REPO (owner/name). See .env.example.",
  );
}
