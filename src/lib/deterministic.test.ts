import { describe, expect, it } from "vitest";

import { generator, hashOf } from "./deterministic";

const take = (seed: number, count: number) => {
  const next = generator(seed);
  return Array.from({ length: count }, () => next());
};

describe("hashOf", () => {
  it("gives the same number for the same text", () => {
    expect(hashOf("Terraform")).toBe(hashOf("Terraform"));
  });

  it("gives different numbers for different text", () => {
    expect(hashOf("Terraform")).not.toBe(hashOf("Kubernetes"));
  });

  it("stays a 32-bit unsigned integer", () => {
    for (const text of ["", "a", "Postgres indexes", "x".repeat(500)]) {
      const hash = hashOf(text);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });
});

describe("generator", () => {
  it("repeats its run for the same seed", () => {
    expect(take(12345, 20)).toEqual(take(12345, 20));
  });

  it("runs differently for a different seed", () => {
    expect(take(12345, 20)).not.toEqual(take(54321, 20));
  });

  it("stays inside [0, 1)", () => {
    for (const value of take(hashOf("Kubernetes"), 500)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("survives a zero seed", () => {
    expect(take(0, 5).every((value) => value >= 0 && value < 1)).toBe(true);
  });
});
