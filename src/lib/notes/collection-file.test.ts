import { describe, expect, it } from "vitest";

import {
  folderOf,
  isCollectionMetaPath,
  isCoverPath,
  coverType,
  metaPathFor,
  parseCollectionFile,
  slugify,
  titleFromFolder,
  UNFILED_FOLDER,
} from "./collection-file";

describe("folderOf", () => {
  it("takes the first folder under notes or scripts", () => {
    expect(folderOf("notes/terraform/basics.md")).toBe("terraform");
    expect(folderOf("scripts/terraform/basics.script.md")).toBe("terraform");
  });

  it("keeps deeper notes in the same collection", () => {
    expect(folderOf("scripts/terraform/state/backends.script.md")).toBe("terraform");
  });

  it("calls a file kept straight in notes unfiled", () => {
    expect(folderOf("notes/loose.md")).toBe(UNFILED_FOLDER);
    expect(folderOf("scripts/loose.script.md")).toBe(UNFILED_FOLDER);
  });
});

describe("slugify", () => {
  it("leaves a plain folder name alone", () => {
    expect(slugify("terraform")).toBe("terraform");
  });

  it("makes a folder name safe for a url", () => {
    expect(slugify("My Notes")).toBe("my-notes");
    expect(slugify("C++ and friends")).toBe("c-and-friends");
    expect(slugify("Réseaux")).toBe("reseaux");
  });

  it("falls back to unfiled when nothing is left", () => {
    expect(slugify("!!!")).toBe("unfiled");
  });
});

describe("titleFromFolder", () => {
  it("reads a folder name as a title", () => {
    expect(titleFromFolder("kubernetes")).toBe("Kubernetes");
    expect(titleFromFolder("system-design")).toBe("System design");
  });
});

describe("paths", () => {
  it("knows a collection.yml from any other file", () => {
    expect(isCollectionMetaPath("notes/terraform/collection.yml")).toBe(true);
    expect(isCollectionMetaPath("notes/collection.yml")).toBe(false);
    expect(isCollectionMetaPath("notes/terraform/state/collection.yml")).toBe(false);
    expect(isCollectionMetaPath("notes/terraform/basics.md")).toBe(false);
  });

  it("builds the path of a collection's settings", () => {
    expect(metaPathFor("terraform")).toBe("notes/terraform/collection.yml");
  });

  it("knows an image in a collection folder from one nested deeper", () => {
    expect(isCoverPath("notes/terraform/cover.png")).toBe(true);
    expect(isCoverPath("notes/terraform/shots/cover.png")).toBe(false);
    expect(isCoverPath("notes/terraform/basics.md")).toBe(false);
  });

  it("maps an extension to what it is served as", () => {
    expect(coverType("notes/a/cover.JPG")).toBe("image/jpeg");
    expect(coverType("notes/a/cover.svg")).toBe(null);
  });
});

describe("parseCollectionFile", () => {
  it("reads every field", () => {
    const result = parseCollectionFile(
      "title: Terraform\ndescription: Infrastructure as code.\ncover: cover.png\norder: 1\n",
    );
    expect(result).toEqual({
      ok: true,
      meta: {
        title: "Terraform",
        description: "Infrastructure as code.",
        cover: "cover.png",
        order: 1,
      },
    });
  });

  it("accepts an empty or comment-only file", () => {
    expect(parseCollectionFile("")).toEqual({ ok: true, meta: {} });
    expect(parseCollectionFile("# nothing set yet\n")).toEqual({ ok: true, meta: {} });
  });

  it("accepts a file that sets only some of the fields", () => {
    expect(parseCollectionFile("title: Postgres\n")).toEqual({
      ok: true,
      meta: { title: "Postgres" },
    });
  });

  it("rejects a cover that points outside the folder", () => {
    const result = parseCollectionFile("cover: ../../secrets/key.png\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not a path");
  });

  it("rejects a cover that is not an image it can show", () => {
    const result = parseCollectionFile("cover: cover.svg\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not an image");
  });

  it("rejects a list or a bare string", () => {
    expect(parseCollectionFile("- terraform\n").ok).toBe(false);
    expect(parseCollectionFile("just a title\n").ok).toBe(false);
  });

  it("names the field that is wrong", () => {
    const result = parseCollectionFile("order: soon\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("order");
  });

  it("reports yaml that does not parse", () => {
    const result = parseCollectionFile("title: [unclosed\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("YAML");
  });
});
