import fs from "node:fs";
import path from "node:path";

// Generic vault writer used by all server actions and API routes.
// Two execution modes:
//   - Local dev: write directly to disk under VAULT_PATH (default ../vault).
//   - Vercel/serverless: commit via the GitHub Contents API using GITHUB_TOKEN
//     + GITHUB_REPO env vars so changes flow through git and Vercel redeploys.

const VAULT = path.resolve(process.cwd(), process.env.VAULT_PATH || "../vault");

export type WriteMode = "local" | "github";

export function vaultMode(): WriteMode {
  return process.env.GITHUB_TOKEN && process.env.GITHUB_REPO ? "github" : "local";
}

export function vaultRoot(): string {
  return VAULT;
}

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  } as const;
}

function ghBranch() {
  return process.env.GITHUB_BRANCH || "main";
}

async function ghGetSha(repoPath: string): Promise<string | undefined> {
  const url = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${repoPath}?ref=${ghBranch()}`;
  const r = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`GitHub GET ${repoPath} failed: ${r.status}`);
  const data = (await r.json()) as { sha: string };
  return data.sha;
}

async function ghPut(repoPath: string, content: string, message: string) {
  const sha = await ghGetSha(repoPath);
  const url = `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${repoPath}`;
  const r = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: ghBranch(),
      sha,
    }),
  });
  if (!r.ok) throw new Error(`GitHub PUT ${repoPath} failed: ${r.status} ${await r.text()}`);
}

/**
 * Write a file in the vault.
 * @param relPath  path relative to vault root, e.g. "events/2026-05-12-dentist.md"
 * @param content  full file content
 * @param message  commit message used in GitHub mode
 */
export async function writeVaultFile(relPath: string, content: string, message: string) {
  if (vaultMode() === "github") {
    await ghPut(`vault/${relPath}`, content, message);
    return;
  }
  const full = path.join(VAULT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

export function readVaultFile(relPath: string): string | null {
  const full = path.join(VAULT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}
