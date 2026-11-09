import { createHash } from "node:crypto";

/**
 * The hash Git gives a file (`git hash-object <file>`), and the `sha` GitHub
 * reports for it in the tree API. Using the same hash everywhere means a file
 * has one fingerprint whether it is read from disk or from GitHub.
 */
export function gitBlobSha(content: string | Uint8Array): string {
  const bytes =
    typeof content === "string" ? Buffer.from(content, "utf8") : content;
  return createHash("sha1")
    .update(`blob ${bytes.byteLength}\0`)
    .update(bytes)
    .digest("hex");
}
