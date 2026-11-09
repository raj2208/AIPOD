import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { StatePanel } from "@/components/state-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ScriptNotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-4 py-16 outline-none"
    >
      <StatePanel
        level={1}
        icon={FileQuestion}
        title="Script not found"
        actions={
          <Link
            href="/scripts"
            className={cn(buttonVariants(), "h-11 rounded-full px-5 text-base")}
          >
            Back to playlist
          </Link>
        }
      >
        It may have been removed from your notes repo, or the link is wrong.
      </StatePanel>
    </main>
  );
}
