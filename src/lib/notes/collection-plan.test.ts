import { describe, expect, it } from "vitest";

import {
  coverNeedsFetch,
  planCollections,
  resolveCover,
  type StoredCollection,
} from "./collection-plan";
import type { RepoFile } from "./types";

const file = (path: string, sha = `sha-${path}`): RepoFile => ({ path, sha });

const storedCollection = (
  over: Partial<StoredCollection> & { slug: string; folder: string },
): StoredCollection => ({
  title: over.folder,
  description: null,
  position: null,
  metaHash: null,
  coverPath: null,
  coverHash: null,
  hasCover: false,
  removedAt: null,
  ...over,
});

describe("planCollections", () => {
  it("wants one collection per folder that has scripts", () => {
    const plan = planCollections(
      [file("notes/terraform/collection.yml")],
      ["scripts/terraform/basics.script.md", "scripts/kubernetes/pods.script.md"],
      [],
    );
    expect(plan.wanted.map((item) => item.slug).sort()).toEqual([
      "kubernetes",
      "terraform",
    ]);
    expect(plan.removed).toEqual([]);
    expect(plan.errors).toEqual([]);
  });

  it("groups scripts nested deeper under the same collection", () => {
    const plan = planCollections(
      [],
      [
        "scripts/terraform/basics.script.md",
        "scripts/terraform/state/backends.script.md",
      ],
      [],
    );
    expect(plan.wanted).toHaveLength(1);
    expect(plan.wanted[0].folder).toBe("terraform");
  });

  it("finds the collection's settings file", () => {
    const meta = file("notes/terraform/collection.yml");
    const plan = planCollections([meta], ["scripts/terraform/basics.script.md"], []);
    expect(plan.wanted[0].metaFile).toEqual(meta);
    expect(plan.wanted[0].metaUnchanged).toBe(false);
  });

  it("leaves settings alone when their hash has not changed", () => {
    const meta = file("notes/terraform/collection.yml");
    const stored = storedCollection({
      slug: "terraform",
      folder: "terraform",
      metaHash: meta.sha,
    });
    const plan = planCollections([meta], ["scripts/terraform/basics.script.md"], [stored]);
    expect(plan.wanted[0].metaUnchanged).toBe(true);
  });

  it("re-reads settings when the file was deleted", () => {
    const stored = storedCollection({
      slug: "terraform",
      folder: "terraform",
      metaHash: "sha-old",
    });
    const plan = planCollections([], ["scripts/terraform/basics.script.md"], [stored]);
    expect(plan.wanted[0].metaUnchanged).toBe(false);
    expect(plan.wanted[0].metaFile).toBe(null);
  });

  it("brings a collection back when scripts return to it", () => {
    const stored = storedCollection({
      slug: "terraform",
      folder: "terraform",
      removedAt: new Date(),
    });
    const plan = planCollections([], ["scripts/terraform/basics.script.md"], [stored]);
    expect(plan.wanted[0].metaUnchanged).toBe(false);
    expect(plan.removed).toEqual([]);
  });

  it("removes a collection whose scripts are all gone", () => {
    const stored = [
      storedCollection({ slug: "terraform", folder: "terraform" }),
      storedCollection({ slug: "kubernetes", folder: "kubernetes" }),
    ];
    const plan = planCollections([], ["scripts/terraform/basics.script.md"], stored);
    expect(plan.removed).toEqual(["kubernetes"]);
  });

  it("does not remove one that was already removed", () => {
    const stored = [
      storedCollection({ slug: "old", folder: "old", removedAt: new Date() }),
    ];
    expect(planCollections([], [], stored).removed).toEqual([]);
  });

  it("puts a script with no folder in unfiled", () => {
    const plan = planCollections([], ["scripts/loose.script.md"], []);
    expect(plan.wanted[0].slug).toBe("unfiled");
    expect(plan.wanted[0].folder).toBe("Unfiled");
  });

  it("reports two folders that want the same web address", () => {
    const plan = planCollections(
      [],
      ["scripts/My Notes/a.script.md", "scripts/my-notes/b.script.md"],
      [],
    );
    expect(plan.wanted).toHaveLength(1);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].message).toContain("my-notes");
  });
});

describe("resolveCover", () => {
  const files = [
    file("notes/terraform/cover.png"),
    file("notes/terraform/diagram.jpg"),
  ];

  it("uses the image the settings name", () => {
    const result = resolveCover(files, "terraform", { cover: "diagram.jpg" }, null);
    expect(result.path).toBe("notes/terraform/diagram.jpg");
    expect(result.file).toEqual(file("notes/terraform/diagram.jpg"));
  });

  it("falls back to a file called cover", () => {
    const result = resolveCover(files, "terraform", {}, null);
    expect(result.path).toBe("notes/terraform/cover.png");
  });

  it("reports a named cover that is not there, so adding it later is noticed", () => {
    const result = resolveCover([], "terraform", { cover: "cover.png" }, null);
    expect(result.path).toBe("notes/terraform/cover.png");
    expect(result.file).toBe(null);
  });

  it("keeps the stored path when the settings were not re-read", () => {
    const stored = storedCollection({
      slug: "terraform",
      folder: "terraform",
      coverPath: "notes/terraform/diagram.jpg",
    });
    const result = resolveCover(files, "terraform", null, stored);
    expect(result.path).toBe("notes/terraform/diagram.jpg");
  });

  it("notices a cover added later when nothing named one", () => {
    const stored = storedCollection({ slug: "terraform", folder: "terraform" });
    const result = resolveCover(files, "terraform", null, stored);
    expect(result.path).toBe("notes/terraform/cover.png");
  });

  it("has no cover when there is no image at all", () => {
    expect(resolveCover([], "terraform", {}, null)).toEqual({ path: null, file: null });
  });
});

describe("coverNeedsFetch", () => {
  const stored = storedCollection({
    slug: "a",
    folder: "a",
    coverHash: "sha-1",
    hasCover: true,
  });

  it("skips a cover whose bytes we already hold", () => {
    expect(coverNeedsFetch(file("notes/a/cover.png", "sha-1"), stored)).toBe(false);
  });

  it("fetches when the image changed", () => {
    expect(coverNeedsFetch(file("notes/a/cover.png", "sha-2"), stored)).toBe(true);
  });

  it("fetches when the hash matches but the bytes are missing", () => {
    expect(
      coverNeedsFetch(file("notes/a/cover.png", "sha-1"), {
        ...stored,
        hasCover: false,
      }),
    ).toBe(true);
  });

  it("fetches a cover it has never seen", () => {
    expect(coverNeedsFetch(file("notes/a/cover.png"), null)).toBe(true);
  });

  it("does nothing when there is no file", () => {
    expect(coverNeedsFetch(null, stored)).toBe(false);
  });
});
