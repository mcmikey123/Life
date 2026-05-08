import fs from "node:fs";
import path from "node:path";

const VAULT_DIR = path.resolve(process.cwd(), process.env.VAULT_PATH || "../vault");
const VAULT_REPO_PREFIX = "vault";

export type WriteResult = { ok: true; path: string; mode: "local" | "github" } | { error: string };

export function isGitHubMode(): boolean {
  return !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_REPO;
}

/**
 * Create a new vault file. Refuses to overwrite an existing file.
 *
 * @param relPath  path inside the vault, e.g. "events/2026-05-12-dentist.md"
 * @param content  full file contents (frontmatter + body)
 * @param commitMessage  used only in GitHub mode
 */
export async function createVaultFile(
  relPath: string,
  content: string,
  commitMessage: string,
): Promise<WriteResult> {
  if (isGitHubMode()) return createViaGitHub(relPath, content, commitMessage);
  return createLocal(relPath, content);
}

/**
 * Append a row to a file, creating it (with a header) if missing. Used by habit logging.
 *
 * @param relPath        path inside the vault
 * @param row            line to append (must include trailing \n)
 * @param headerIfNew    full header content used when the file does not yet exist
 * @param commitMessage  used only in GitHub mode
 */
export async function appendVaultRow(
  relPath: string,
  row: string,
  headerIfNew: string,
  commitMessage: string,
): Promise<WriteResult> {
  if (isGitHubMode()) return appendViaGitHub(relPath, row, headerIfNew, commitMessage);
  return appendLocal(relPath, row, headerIfNew);
}

// -------------- LOCAL --------------

function createLocal(relPath: string, content: string): WriteResult {
  const file = path.join(VAULT_DIR, relPath);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) return { error: `File already exists: ${relPath}` };
    fs.writeFileSync(file, content);
    return { ok: true, path: relPath, mode: "local" };
  } catch (err: any) {
    return { error: err.message || "local write failed" };
  }
}

function appendLocal(relPath: string, row: string, headerIfNew: string): WriteResult {
  const file = path.join(VAULT_DIR, relPath);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, headerIfNew);
    fs.appendFileSync(file, row);
    return { ok: true, path: relPath, mode: "local" };
  } catch (err: any) {
    return { error: err.message || "local append failed" };
  }
}

// -------------- GITHUB --------------

function gh() {
  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH || "main";
  return {
    repo,
    branch,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    } as Record<string, string>,
  };
}

async function getExisting(apiPath: string): Promise<{ sha?: string; existing: string } | { error: string }> {
  const { repo, branch, headers } = gh();
  const url = `https://api.github.com/repos/${repo}/contents/${apiPath}?ref=${branch}`;
  const res = await fetch(url, { headers, cache: "no-store" });
  if (res.status === 404) return { existing: "" };
  if (!res.ok) return { error: `GitHub GET failed: ${res.status} ${await res.text()}` };
  const data = (await res.json()) as { sha: string; content: string };
  return { sha: data.sha, existing: atob(data.content.replace(/\n/g, "")) };
}

async function putContent(
  apiPath: string,
  contentB64: string,
  message: string,
  sha?: string,
): Promise<WriteResult> {
  const { repo, branch, headers } = gh();
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${apiPath}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: contentB64, branch, sha }),
  });
  if (!res.ok) return { error: `GitHub PUT failed: ${res.status} ${await res.text()}` };
  return { ok: true, path: apiPath, mode: "github" };
}

async function createViaGitHub(relPath: string, content: string, message: string): Promise<WriteResult> {
  const apiPath = `${VAULT_REPO_PREFIX}/${relPath}`;
  const probe = await getExisting(apiPath);
  if ("error" in probe) return probe;
  if (probe.sha) return { error: `File already exists: ${relPath}` };
  return putContent(apiPath, btoa(content), message);
}

async function appendViaGitHub(
  relPath: string,
  row: string,
  headerIfNew: string,
  message: string,
): Promise<WriteResult> {
  const apiPath = `${VAULT_REPO_PREFIX}/${relPath}`;
  const probe = await getExisting(apiPath);
  if ("error" in probe) return probe;
  const next = (probe.existing || headerIfNew) + row;
  return putContent(apiPath, btoa(next), message, probe.sha);
}
