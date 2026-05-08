import { NextRequest, NextResponse } from "next/server";
import { appendVaultRow } from "@/lib/vault-write";

// POST /api/log
// body: { daily: "morning-walk", status: "done" | "skip", note?: string, date?: "YYYY-MM-DD" }
//
// Backwards-compat: an older client may still send { habit: "..." } — accepted as `daily`.
//
// Two execution modes (decided automatically by env):
//   1. Local (vault is on a writable disk) — appends to the .log.md file directly.
//   2. Vercel/serverless (read-only fs) — commits to the .log.md via the GitHub API
//      using GITHUB_TOKEN and GITHUB_REPO env vars.

function buildRow(day: string, status: string, note: string) {
  return `| ${day} | ${status} | ${note} |\n`;
}

function buildHeader(daily: string) {
  return `---\ntype: daily_log\ndaily: "${daily}"\n---\n\n| date | status | note |\n|------|--------|------|\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const daily = body.daily || body.habit;
  const status = body.status;
  if (!daily || !status) {
    return NextResponse.json({ error: "daily and status required" }, { status: 400 });
  }
  const day = body.date || new Date().toISOString().slice(0, 10);
  const noteStr = body.note || "";

  const result = await appendVaultRow(
    `dailies/${daily}.log.md`,
    buildRow(day, status, noteStr),
    buildHeader(daily),
    `log ${daily}: ${status} on ${day}`,
  );

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, day, daily, status, mode: result.mode });
}
