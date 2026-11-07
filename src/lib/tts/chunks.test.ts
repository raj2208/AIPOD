import { describe, expect, it } from "vitest";

import {
  buildChunks,
  chunkAtTime,
  cumulativeSeconds,
  splitParagraphs,
} from "./chunks";

describe("splitParagraphs", () => {
  it("splits on blank lines and joins lines inside a paragraph", () => {
    expect(splitParagraphs("One\ntwo.\n\n\nThree.  \n \nFour.")).toEqual([
      "One two.",
      "Three.",
      "Four.",
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(splitParagraphs("  \n\n ")).toEqual([]);
  });
});

describe("buildChunks", () => {
  it("joins short sentences into one chunk", () => {
    const chunks = buildChunks("First one. Second one. Third one.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("First one. Second one. Third one.");
  });

  it("starts a new chunk when the limit would be passed", () => {
    const chunks = buildChunks("Aaaa aaaa. Bbbb bbbb. Cccc cccc.", 25);
    expect(chunks.map((chunk) => chunk.text)).toEqual([
      "Aaaa aaaa. Bbbb bbbb.",
      "Cccc cccc.",
    ]);
  });

  it("never joins sentences across paragraphs", () => {
    const chunks = buildChunks("Short one.\n\nShort two.");
    expect(chunks.map((chunk) => [chunk.paragraph, chunk.text])).toEqual([
      [0, "Short one."],
      [1, "Short two."],
    ]);
  });

  it("numbers chunks across the whole script", () => {
    const chunks = buildChunks("A one.\n\nB two.\n\nC three.");
    expect(chunks.map((chunk) => chunk.index)).toEqual([0, 1, 2]);
  });

  it("cuts a sentence that is longer than the limit", () => {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ") + ".";
    const chunks = buildChunks(long, 60);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.text.length).toBeLessThanOrEqual(60);
    // Nothing is lost.
    expect(chunks.map((chunk) => chunk.text).join(" ")).toBe(long);
  });

  it("does not split on a dot inside a name like tfstate.json", () => {
    const chunks = buildChunks("Open the file terraform.tfstate now. Then close it.");
    expect(chunks.map((chunk) => chunk.text).join(" ")).toBe(
      "Open the file terraform.tfstate now. Then close it.",
    );
  });

  it("estimates time from the word count", () => {
    const [chunk] = buildChunks(Array(150).fill("word").join(" ") + ".", 5000);
    expect(chunk.seconds).toBeCloseTo(60, 0);
  });
});

describe("time helpers", () => {
  const chunks = [
    { index: 0, paragraph: 0, text: "a", seconds: 10 },
    { index: 1, paragraph: 0, text: "b", seconds: 20 },
    { index: 2, paragraph: 1, text: "c", seconds: 30 },
  ];

  it("builds cumulative times", () => {
    expect(cumulativeSeconds(chunks)).toEqual([0, 10, 30, 60]);
  });

  it("finds the chunk for a time", () => {
    const cumulative = cumulativeSeconds(chunks);
    expect(chunkAtTime(cumulative, -5)).toBe(0);
    expect(chunkAtTime(cumulative, 0)).toBe(0);
    expect(chunkAtTime(cumulative, 9.9)).toBe(0);
    expect(chunkAtTime(cumulative, 10)).toBe(1);
    expect(chunkAtTime(cumulative, 45)).toBe(2);
    expect(chunkAtTime(cumulative, 9999)).toBe(2);
  });

  it("handles an empty script", () => {
    expect(chunkAtTime(cumulativeSeconds([]), 5)).toBe(0);
  });
});
