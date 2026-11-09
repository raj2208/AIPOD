import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One look for every "nothing here" and "something went wrong" screen: an
 * icon, a plain title, a sentence of help, and what to do next.
 */
export function StatePanel({
  icon: Icon,
  title,
  children,
  actions,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-2xl",
          tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-accent text-accent-foreground",
        )}
      >
        <Icon aria-hidden className="size-7" />
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {children && (
        <div className="mt-2 max-w-sm text-muted-foreground text-balance">
          {children}
        </div>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
