import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const VAULT = path.resolve(process.cwd(), process.env.VAULT_PATH || "../vault");

// POST /api/log
// body: { habit: "morning-walk", status: "done" | "skip", note?: string, date?: "YYYY-MM-DD" }
export async function POST(req: NextRequest) {
  const { habit, status, note, date } = await req.json();
  if (!habit || !status) {
    return NextResponse.json({ error: "habit and status required" }, { status: 400 });
  }
  const day = date || new Date().toISOString().slice(0, 10);
  const file = path.join(VAULT, "habits", `${habit}.log.md`);

  if (!fs.existsSync(file)) {
    const header = `---\ntype: habit_log\nhabit: "${habit}"\n---\n\n| date | status | note |\n|------|--------|------|\n`;
    fs.writeFileSync(file, header);
  }
  fs.appendFileSync(file, `| ${day} | ${status} | ${note || ""} |\n`);
  return NextResponse.json({ ok: true, day, habit, status });
}
