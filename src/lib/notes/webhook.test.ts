import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { isPushToBranch, verifyGitHubSignature } from "./webhook";

const sign = (secret: string, body: string) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

describe("verifyGitHubSignature", () => {
  const body = '{"ref":"refs/heads/main"}';

  it("accepts a correct signature", () => {
    expect(verifyGitHubSignature("s3cret", body, sign("s3cret", body))).toBe(true);
  });

  it("rejects a signature made with another secret", () => {
    expect(verifyGitHubSignature("s3cret", body, sign("other", body))).toBe(false);
  });

  it("rejects a body that was changed", () => {
    expect(verifyGitHubSignature("s3cret", body + " ", sign("s3cret", body))).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifyGitHubSignature("s3cret", body, null)).toBe(false);
    expect(verifyGitHubSignature("s3cret", body, "")).toBe(false);
    expect(verifyGitHubSignature("s3cret", body, "sha1=abc")).toBe(false);
    expect(verifyGitHubSignature("s3cret", body, "sha256=zz")).toBe(false);
    expect(verifyGitHubSignature("s3cret", body, "sha256=")).toBe(false);
  });
});

describe("isPushToBranch", () => {
  it("matches the branch", () => {
    expect(isPushToBranch({ ref: "refs/heads/main" }, "main")).toBe(true);
  });

  it("ignores other branches, tags, and junk", () => {
    expect(isPushToBranch({ ref: "refs/heads/dev" }, "main")).toBe(false);
    expect(isPushToBranch({ ref: "refs/tags/main" }, "main")).toBe(false);
    expect(isPushToBranch(null, "main")).toBe(false);
    expect(isPushToBranch("main", "main")).toBe(false);
    expect(isPushToBranch({}, "main")).toBe(false);
  });
});
