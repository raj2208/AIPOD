import { Compass } from "lucide-react";
import Link from "next/link";

import { StatePanel } from "@/components/state-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto w-full max-w-2xl px-4 py-16 outline-none"
    >
      <StatePanel
        level={1}
        icon={Compass}
        title="That page does not exist"
        actions={
          <Link
            href="/library"
            className={cn(buttonVariants(), "h-11 rounded-full px-5 text-base")}
          >
            Go to the library
          </Link>
        }
      >
        The link may be wrong or out of date.
      </StatePanel>
    </main>
  );
}
