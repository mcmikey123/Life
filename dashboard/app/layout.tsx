import "./globals.css";
import type { Metadata } from "next";
import SubTabs from "./_components/SubTabs";
import XpBar from "./_components/XpBar";

export const metadata: Metadata = {
  title: "Life Dashboard",
  description: "Personal life dashboard",
};

const topNav = [
  { label: "Journal" },
  { label: "Activities" },
  { label: "Life Dashboard", active: true },
  { label: "Map" },
  { label: "Store" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=IM+Fell+English:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="world-bg" aria-hidden />

        <header className="top-nav">
          <nav className="nav-items">
            {topNav.map((n) => (
              <div key={n.label} className={`nav-item${n.active ? " active" : ""}`}>
                {n.label}
                {n.active && <span className="diamond" />}
              </div>
            ))}
          </nav>
          <div className="settings" title="Settings">⚙</div>
        </header>

        <main className="screen">
          <section className="panel">
            <SubTabs />
            <div className="content">{children}</div>
          </section>
        </main>

        <XpBar level={15} current={2854} max={4200} />
      </body>
    </html>
  );
}
