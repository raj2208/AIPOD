import { LibraryBig } from "lucide-react";
import Link from "next/link";

import { StatePanel } from "@/components/state-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CollectionNotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-4 py-16 outline-none"
    >
      <StatePanel
        level={1}
        icon={LibraryBig}
        title="Collection not found"
        actions={
          <Link
            href="/library"
            className={cn(buttonVariants(), "h-11 rounded-full px-5 text-base")}
          >
            Back to the library
          </Link>
        }
      >
        Its folder may have been renamed or emptied in your notes repo, or the
        link is wrong.
      </StatePanel>
    </main>
  );
}
