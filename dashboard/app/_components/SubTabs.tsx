"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/character", label: "Character" },
  { href: "/events", label: "Events" },
  { href: "/reminders", label: "Reminders" },
  { href: "/projects", label: "Projects" },
  { href: "/habits", label: "Habits" },
  { href: "/finance", label: "Finance" },
  { href: "/health", label: "Health" },
];

export default function SubTabs() {
  const pathname = usePathname() || "/character";
  const activeHref =
    TABS.find((t) => pathname === t.href || pathname.startsWith(t.href + "/"))?.href ||
    "/character";

  return (
    <div className="sub-tabs">
      {TABS.map((t) => {
        const active = t.href === activeHref;
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? " active" : ""}`}>
            {t.label}
            {active && <span className="diamond" />}
          </Link>
        );
      })}
    </div>
  );
}
