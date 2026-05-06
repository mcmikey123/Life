import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

// POST /api/log
// body: { habit: "morning-walk", status: "done" | "skip", note?: string, date?: "YYYY-MM-DD" }
//
// Two execution modes:
//   1. Local (vault is on a writable disk) — appends to the .log.md file directly.
//   2. Vercel/serverless (read-only fs) — commits to the .log.md via the GitHub API
//      using GITHUB_TOKEN and GITHUB_REPO env vars.

const VAULT = path.resolve(process.cwd(), process.env.VAULT_PATH || "../vault");

function buildRow(day: string, status: string, note: string) {
  return `| ${day} | ${status} | ${note} |\n`;
}

function buildHeader(habit: string) {
  return `---\ntype: habit_log\nhabit: "${habit}"\n---\n\n| date | status | note |\n|------|--------|------|\n`;
}

async function writeLocal(habit: string, day: string, status: string, note: string) {
  const file = path.join(VAULT, "habits", `${habit}.log.md`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, buildHeader(habit));
  fs.appendFileSync(file, buildRow(day, status, note));
}

async function writeViaGitHub(habit: string, day: string, status: string, note: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "user/Life"
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) throw new Error("GITHUB_TOKEN and GITHUB_REPO required for GitHub-backed logging");

  const apiPath = `vault/habits/${habit}.log.md`;
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}?ref=${branch}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Fetch existing file (if any) to get SHA + content
  let sha: string | undefined;
  let existing = "";
  const getRes = await fetch(url, { headers, cache: "no-store" });
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha: string; content: string };
    sha = data.sha;
    existing = atob(data.content.replace(/\n/g, ""));
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET failed: ${getRes.status} ${await getRes.text()}`);
  }

  const next = (existing || buildHeader(habit)) + buildRow(day, status, note);
  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${apiPath}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `log ${habit}: ${status} on ${day}`,
      content: btoa(next),
      branch,
      sha,
    }),
  });
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status} ${await putRes.text()}`);
}

export async function POST(req: NextRequest) {
  const { habit, status, note, date } = await req.json();
  if (!habit || !status) {
    return NextResponse.json({ error: "habit and status required" }, { status: 400 });
  }
  const day = date || new Date().toISOString().slice(0, 10);
  const noteStr = note || "";

  const useGitHub = !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_REPO;
  try {
    if (useGitHub) await writeViaGitHub(habit, day, status, noteStr);
    else await writeLocal(habit, day, status, noteStr);
    return NextResponse.json({ ok: true, day, habit, status, mode: useGitHub ? "github" : "local" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
