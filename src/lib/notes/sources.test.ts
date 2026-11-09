import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { gitBlobSha } from "./git-hash";
import {
  createGitHubSource,
  createLocalSource,
  sourceFromEnv,
} from "./sources";

describe("local source", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "aipod-notes-"));
    await mkdir(join(dir, "notes/deep"), { recursive: true });
    await mkdir(join(dir, "scripts"), { recursive: true });
    await mkdir(join(dir, ".agent/skills"), { recursive: true });
    await mkdir(join(dir, "node_modules/pkg"), { recursive: true });
    await writeFile(join(dir, "notes/deep/a.md"), "note a\n");
    await writeFile(join(dir, "scripts/a.script.md"), "script a\n");
    await writeFile(join(dir, "notes/image.png"), "not markdown");
    await writeFile(join(dir, ".agent/skills/SKILL.md"), "skill");
    await writeFile(join(dir, "node_modules/pkg/README.md"), "pkg");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("lists markdown files with their git hashes, skipping hidden folders", async () => {
    const { files, commit } = await createLocalSource(dir).list();
    expect(commit).toBeNull();
    expect(files).toEqual([
      { path: "notes/deep/a.md", sha: gitBlobSha("note a\n") },
      { path: "scripts/a.script.md", sha: gitBlobSha("script a\n") },
    ]);
  });

  it("reads a file", async () => {
    const source = createLocalSource(dir);
    const text = await source.read({ path: "notes/deep/a.md", sha: "" });
    expect(text).toBe("note a\n");
  });

  it("refuses to read outside the folder", async () => {
    const source = createLocalSource(dir);
    await expect(
      source.read({ path: "../../etc/passwd", sha: "" }),
    ).rejects.toThrow(/escapes/);
  });

  it("explains a missing folder", async () => {
    await expect(
      createLocalSource(join(dir, "missing")).list(),
    ).rejects.toThrow(/Cannot read the notes folder/);
  });
});

describe("github source", () => {
  const COMMIT = "c".repeat(40);

  function respond(body: string | object, init: ResponseInit = {}) {
    return new Response(
      typeof body === "string" ? body : JSON.stringify(body),
      init,
    );
  }

  it("lists blobs from the commit snapshot with two calls", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.endsWith("/commits/main")) return respond(`${COMMIT}\n`);
      if (href.includes(`/git/trees/${COMMIT}`)) {
        return respond({
          truncated: false,
          tree: [
            { path: "scripts", type: "tree", sha: "1" },
            { path: "scripts/a.script.md", type: "blob", sha: "aa" },
            { path: "notes/a.md", type: "blob", sha: "bb" },
            { path: "notes/pic.png", type: "blob", sha: "cc" },
            { path: ".github/x.md", type: "blob", sha: "dd" },
          ],
        });
      }
      return respond("unexpected", { status: 500 });
    });

    const source = createGitHubSource({
      repo: "raj/notes",
      token: "secret",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const listing = await source.list();

    expect(listing.commit).toBe(COMMIT);
    expect(listing.files).toEqual([
      { path: "notes/a.md", sha: "bb" },
      { path: "scripts/a.script.md", sha: "aa" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret",
    );
  });

  it("downloads one file by its blob hash", async () => {
    const fetchMock = vi.fn(async () => respond("spoken text"));
    const source = createGitHubSource({
      repo: "raj/notes",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const text = await source.read({ path: "scripts/a.script.md", sha: "aa" });

    expect(text).toBe("spoken text");
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe("https://api.github.com/repos/raj/notes/git/blobs/aa");
  });

  it("gives a useful message for a missing or private repo", async () => {
    const source = createGitHubSource({
      repo: "raj/nope",
      fetch: (async () => respond("", { status: 404 })) as unknown as typeof fetch,
    });
    await expect(source.list()).rejects.toThrow(/NOTES_TOKEN/);
  });

  it("refuses a truncated listing rather than syncing part of the repo", async () => {
    const source = createGitHubSource({
      repo: "raj/notes",
      fetch: (async (url: string | URL | Request) =>
        String(url).includes("/commits/")
          ? respond(COMMIT)
          : respond({ truncated: true, tree: [] })) as unknown as typeof fetch,
    });
    await expect(source.list()).rejects.toThrow(/too large/);
  });
});

describe("sourceFromEnv", () => {
  it("prefers a local folder", () => {
    expect(() => sourceFromEnv({ NOTES_DIR: "/tmp", NOTES_REPO: "a/b" })).not.toThrow();
  });

  it("uses GitHub when only a repo is set", () => {
    expect(() => sourceFromEnv({ NOTES_REPO: "a/b" })).not.toThrow();
  });

  it("explains what to set when nothing is configured", () => {
    expect(() => sourceFromEnv({})).toThrow(/NOTES_DIR/);
  });
});
