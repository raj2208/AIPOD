import { createLocalStore } from "./storage";

/** Where the listener last stopped, so the app can offer to carry on. */
export type Resume = { scriptId: string; index: number };

export const NO_RESUME: Resume = { scriptId: "", index: 0 };

export function sanitizeResume(raw: unknown): Resume {
  if (typeof raw !== "object" || raw === null) return NO_RESUME;
  const { scriptId, index } = raw as Record<string, unknown>;
  if (
    typeof scriptId !== "string" ||
    typeof index !== "number" ||
    !Number.isInteger(index) ||
    index < 0
  ) {
    return NO_RESUME;
  }
  return { scriptId, index };
}

/** The script most recently played, and the sentence it reached. */
export const resumeStore = createLocalStore(
  "aipod.player.resume.v1",
  NO_RESUME,
  sanitizeResume,
);
