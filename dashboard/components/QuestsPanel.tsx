import Link from "next/link";
import { getQuests } from "@/lib/vault";

function extractDescription(body: string): string {
  if (!body) return "";
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;
    if (line.startsWith("<!--")) continue;
    return line.replace(/^[-*]\s+/, "");
  }
  return "";
}

export default function QuestsPanel() {
  const quests = getQuests().filter((q) => q.status === "active").slice(0, 6);

  return (
    <aside className="quests-float" aria-label="Active quests">
      {quests.length === 0 ? (
        <div className="quests-empty">
          <Link href="/quests">No quests — add one →</Link>
        </div>
      ) : (
        <div className="quests-list">
          {quests.map((q) => {
            const desc = extractDescription(q.body);
            return (
              <Link href={`/quests/${q.slug}`} key={q.slug} className="quests-row">
                <div className="quests-row-title">{q.title}</div>
                {desc && <div className="quests-row-desc">{desc}</div>}
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
