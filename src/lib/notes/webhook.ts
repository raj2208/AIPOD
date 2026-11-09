import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Checks the `X-Hub-Signature-256` header GitHub adds to webhook calls, which
 * proves the request came from GitHub and was sent with our shared secret.
 */
export function verifyGitHubSignature(
  secret: string,
  body: string,
  header: string | null,
): boolean {
  if (!header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  // Lengths must match before the constant-time comparison.
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** True when a push event is for the branch we read notes from. */
export function isPushToBranch(payload: unknown, branch: string): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "ref" in payload &&
    payload.ref === `refs/heads/${branch}`
  );
}
