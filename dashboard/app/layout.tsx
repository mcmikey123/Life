import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Life",
  description: "Personal life dashboard",
};

const phase1 = [
  { href: "/events", label: "Events" },
  { href: "/reminders", label: "Reminders" },
  { href: "/projects", label: "Projects" },
  { href: "/habits", label: "Habits" },
];
const phase2 = [
  { href: "/finance", label: "Finance" },
  { href: "/health", label: "Health" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1>Life</h1>
            <nav>
              <Link href="/">Overview</Link>
              <div className="group-label">Phase 1</div>
              {phase1.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
              <div className="group-label">Phase 2</div>
              {phase2.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
