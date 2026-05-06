import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import path from "node:path";

// Recent activity = recent commits touching vault/.
// On Vercel, every server action commits via the GitHub Contents API so the
// git history is the dashboard's activity log. In local dev we shell out to
// `git log` against the parent repo.

export const dynamic = "force-dynamic";

type Entry = { sha: string; date: string; message: string };

async function fromGitHub(): Promise<Entry[]> {
  const repo = process.env.GITHUB_REPO!;
  const token = process.env.GITHUB_TOKEN!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const url = `https://api.github.com/repos/${repo}/commits?path=vault&sha=${branch}&per_page=30`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`github commits failed: ${r.status}`);
  const data = (await r.json()) as Array<{
    sha: string;
    commit: { author: { date: string }; message: string };
  }>;
  return data.map((c) => ({
    sha: c.sha.slice(0, 7),
    date: c.commit.author.date,
    message: c.commit.message.split("\n")[0],
  }));
}

function fromGitCli(): Entry[] {
  try {
    const repoRoot = path.resolve(process.cwd(), "..");
    const out = execSync(
      'git log --pretty=format:"%h%x09%aI%x09%s" -n 30 -- vault/',
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, date, ...rest] = line.split("\t");
        return { sha, date, message: rest.join("\t") };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  const useGitHub = !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_REPO;
  try {
    const entries = useGitHub ? await fromGitHub() : fromGitCli();
    return NextResponse.json({ entries, mode: useGitHub ? "github" : "git-cli" });
  } catch (err: any) {
    return NextResponse.json({ entries: [], error: err.message }, { status: 500 });
  }
}
