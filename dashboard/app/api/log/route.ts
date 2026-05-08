import { NextRequest, NextResponse } from "next/server";
import { appendVaultRow } from "@/lib/vault-write";

// POST /api/log
// body: { habit: "morning-walk", status: "done" | "skip", note?: string, date?: "YYYY-MM-DD" }
//
// Two execution modes (decided automatically by env):
//   1. Local (vault is on a writable disk) — appends to the .log.md file directly.
//   2. Vercel/serverless (read-only fs) — commits to the .log.md via the GitHub API
//      using GITHUB_TOKEN and GITHUB_REPO env vars.

function buildRow(day: string, status: string, note: string) {
  return `| ${day} | ${status} | ${note} |\n`;
}

function buildHeader(habit: string) {
  return `---\ntype: habit_log\nhabit: "${habit}"\n---\n\n| date | status | note |\n|------|--------|------|\n`;
}

export async function POST(req: NextRequest) {
  const { habit, status, note, date } = await req.json();
  if (!habit || !status) {
    return NextResponse.json({ error: "habit and status required" }, { status: 400 });
  }
  const day = date || new Date().toISOString().slice(0, 10);
  const noteStr = note || "";

  const result = await appendVaultRow(
    `habits/${habit}.log.md`,
    buildRow(day, status, noteStr),
    buildHeader(habit),
    `log ${habit}: ${status} on ${day}`,
  );

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, day, habit, status, mode: result.mode });
}
