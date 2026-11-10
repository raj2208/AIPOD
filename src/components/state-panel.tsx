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
  level = 2,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "neutral" | "danger";
  /** Use 1 when the panel is the whole page, and 2 when it sits inside one. */
  level?: 1 | 2;
  className?: string;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {/* The icon stands on its own. A tinted rounded square behind it is the
          stock "feature icon" treatment and says nothing. */}
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className={cn(
          "mb-4 size-8",
          tone === "danger" ? "text-destructive" : "text-muted-foreground",
        )}
      />
      <Heading className="text-xl font-semibold tracking-tight text-balance">
        {title}
      </Heading>
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
