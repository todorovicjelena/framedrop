"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = {
  href: string;
  label: string;
  icon?: React.ReactNode; // a rendered element (e.g. <Images />) so Server Components can pass it
  external?: boolean; // opens in a new tab, never "active"
};

// Pill tabs that highlight the current page.
export function NavTabs({ tabs, className }: { tabs: NavTab[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("-mx-4 overflow-x-auto px-4", className)}>
      <ul className="flex w-max gap-2">
        {tabs.map(({ href, label, icon, external }) => {
          const active = !external && pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                target={external ? "_blank" : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap transition duration-150 active:scale-95 [&_svg]:size-4",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground hover:border-lilac",
                )}
              >
                {icon}
                {label}
                {external && <ExternalLink className="opacity-60" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
