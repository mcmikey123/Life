import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuest } from "@/lib/vault";

export const revalidate = 30;

const HORIZON_LABEL: Record<string, string> = {
  long: "Long-term (5+ years)",
  medium: "Medium-term (1-5 years)",
  short: "Short-term (months)",
};

export default function QuestDetail({ params }: { params: { slug: string } }) {
  const quest = getQuest(params.slug);
  if (!quest) notFound();

  const pct = Math.max(0, Math.min(100, quest.progress ?? 0));

  return (
    <>
      <Link href="/quests" className="back-link">← All quests</Link>
      <h2>{quest.title}</h2>
      <p className="subtitle">
        {HORIZON_LABEL[quest.horizon || "long"]}
        {quest.deadline ? ` · target ${quest.deadline}` : ""}
        {quest.status !== "active" ? ` · ${quest.status}` : ""}
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="project-progress">
          <div className="progress-bar-project">
            <div className="progress-fill-project" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-percent">{pct}% progress</div>
        </div>
        {quest.linked_projects && quest.linked_projects.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="section-title" style={{ fontSize: 11 }}>Linked projects</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {quest.linked_projects.map((slug) => (
                <Link key={slug} href={`/projects/${slug}`} className="link-btn">{slug}</Link>
              ))}
            </div>
          </div>
        )}
        {quest.body && (
          <div className="body" style={{ marginTop: 14, whiteSpace: "pre-wrap" }}>{quest.body}</div>
        )}
      </div>
    </>
  );
}
