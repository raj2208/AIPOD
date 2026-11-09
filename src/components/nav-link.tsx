"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A header link that shows when you are on it, or on a page inside it. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const exact = pathname === href;
  const inside = exact || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={exact ? "page" : inside ? "true" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-11 px-4 text-base",
        inside && "bg-accent text-accent-foreground hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
