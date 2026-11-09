import { CircleAlert, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isStale, type Script } from "@/db/schema";
import { needsReview } from "@/lib/fidelity";

type Props = {
  script: Pick<Script, "notePath" | "sourceHash" | "noteHash" | "fidelity">;
};

/**
 * Tells the reader when a script may not match its note: either the note has
 * changed since, or the automatic check found differences. Shows nothing when
 * all is well.
 */
export function FidelityNotice({ script }: Props) {
  if (isStale(script)) {
    return (
      <Alert variant="destructive" className="mb-6">
        <TriangleAlert />
        <AlertTitle>
          {script.noteHash ? "The note has changed" : "The note is missing"}
        </AlertTitle>
        <AlertDescription>
          <p>
            {script.noteHash
              ? `${script.notePath} changed after this script was written, so the script may be out of date.`
              : `${script.notePath} could not be found, so this script cannot be checked.`}{" "}
            Run <code>/script</code> in your notes repo to refresh it.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const report = script.fidelity;
  if (!report || !needsReview(report)) return null;

  return (
    <Alert className="mb-6">
      <CircleAlert />
      <AlertTitle>Check this script against your note</AlertTitle>
      <AlertDescription>
        <p>
          The automatic check found differences. It is only a guide: the script
          may be saying the same thing in different words.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {report.missing.length > 0 && (
            <li>
              Not found in the script:{" "}
              {report.missing.map((term, index) => (
                <span key={term}>
                  {index > 0 && ", "}
                  <code>{term}</code>
                </span>
              ))}
            </li>
          )}
          {report.added.length > 0 && (
            <li>
              Numbers in the script that are not in your note:{" "}
              {report.added.join(", ")}
            </li>
          )}
          {report.tooShort && (
            <li>
              The script is much shorter than the note ({report.scriptWords}{" "}
              words against {report.noteWords}), so some points may be missing.
            </li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
