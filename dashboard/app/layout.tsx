import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import MusicPlayer from "@/components/MusicPlayer";
import { getConfig } from "@/lib/vault";

export const metadata: Metadata = {
  title: "Life",
  description: "Personal life dashboard",
};

const phase1 = [
  { href: "/character", label: "Character" },
  { href: "/events", label: "Events" },
  { href: "/reminders", label: "Reminders" },
  { href: "/projects", label: "Projects" },
  { href: "/habits", label: "Habits" },
];
const phase2 = [
  { href: "/finance", label: "Finance" },
  { href: "/health", label: "Health" },
];

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cfg = getConfig();
  const tracks = cfg.music?.tracks ?? [];

  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div>
              <h1>Life</h1>
              <nav>
                {phase1.map((l) => (
                  <Link key={l.href} href={l.href}>{l.label}</Link>
                ))}
                <div className="group-label">Phase 2</div>
                {phase2.map((l) => (
                  <Link key={l.href} href={l.href}>{l.label}</Link>
                ))}
              </nav>
            </div>
            <MusicPlayer tracks={tracks} />
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
