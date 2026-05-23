import { execSync } from "child_process";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");

function git(command: string): string {
  try {
    return execSync(`git ${command}`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      timeout: 10000,
    }).trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || "Git command failed");
  }
}

export interface GitFileChange {
  status: string; // "M", "A", "D", "??"
  file: string;
}

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  refs: string;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: GitFileChange[];
  hasChanges: boolean;
}

export function getGitStatus(): GitStatus {
  try {
    git("rev-parse --git-dir");
  } catch {
    return {
      isRepo: false,
      branch: "",
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
      hasChanges: false,
    };
  }

  const branch = git("rev-parse --abbrev-ref HEAD");

  let ahead = 0;
  let behind = 0;
  try {
    const counts = git(`rev-list --left-right --count HEAD...@{upstream}`);
    const [a, b] = counts.split(/\s+/);
    ahead = parseInt(a) || 0;
    behind = parseInt(b) || 0;
  } catch {
    // No upstream configured
  }

  const statusOutput = git("status --porcelain");
  const staged: GitFileChange[] = [];
  const unstaged: GitFileChange[] = [];
  const untracked: GitFileChange[] = [];

  for (const line of statusOutput.split("\n").filter(Boolean)) {
    const indexStatus = line[0];
    const workTreeStatus = line[1];
    const file = line.substring(3).trim();

    if (indexStatus === "?") {
      untracked.push({ status: "??", file });
    } else {
      if (indexStatus && indexStatus !== " ") {
        staged.push({ status: indexStatus, file });
      }
      if (workTreeStatus && workTreeStatus !== " ") {
        unstaged.push({ status: workTreeStatus, file });
      }
    }
  }

  return {
    isRepo: true,
    branch,
    ahead,
    behind,
    staged,
    unstaged,
    untracked,
    hasChanges: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
  };
}

export function getGitLog(count = 20): GitLogEntry[] {
  try {
    const format = "%H|%h|%s|%an|%ar|%D";
    const output = git(`log --format="${format}" -${count}`);
    return output.split("\n").filter(Boolean).map((line) => {
      const [hash, shortHash, message, author, date, refs] = line.split("|");
      return { hash, shortHash, message, author, date, refs: refs || "" };
    });
  } catch {
    return [];
  }
}

export function stageAll(): void {
  git("add -A");
}

export function stageFiles(files: string[]): void {
  // Sanitize file paths - only allow relative paths within the repo
  for (const f of files) {
    if (f.includes("..") || path.isAbsolute(f)) {
      throw new Error(`Invalid file path: ${f}`);
    }
  }
  const escaped = files.map((f) => `"${f.replace(/"/g, "")}"`).join(" ");
  git(`add ${escaped}`);
}

export function commitChanges(message: string): string {
  // Sanitize commit message
  const safe = message.replace(/["\\`$]/g, "").substring(0, 500);
  if (!safe.trim()) throw new Error("Commit message cannot be empty");
  git(`commit -m "${safe}"`);
  return git("rev-parse --short HEAD");
}

export function pushChanges(): void {
  git("push");
}

export function pullChanges(): void {
  git("pull --ff-only");
}

export function undoFile(filePath: string): void {
  if (filePath.includes("..") || path.isAbsolute(filePath)) {
    throw new Error("Invalid file path");
  }
  git(`checkout -- "${filePath.replace(/"/g, "")}"`);
}

export function undoAllChanges(): void {
  git("checkout -- .");
  git("clean -fd");
}

/**
 * Generates a smart commit message based on changed files.
 */
export function suggestCommitMessage(status: GitStatus): string {
  const allFiles = [
    ...status.staged.map((f) => f.file),
    ...status.unstaged.map((f) => f.file),
    ...status.untracked.map((f) => f.file),
  ];

  const bookChanges = new Map<string, { chapters: string[]; config: boolean; plan: boolean; research: boolean; cover: boolean }>();
  const webappChanges: string[] = [];
  const agentChanges: string[] = [];
  const otherChanges: string[] = [];

  for (const file of allFiles) {
    const booksMatch = file.match(/^books\/([^/]+)\/(.*)/);
    if (booksMatch) {
      const [, bookSlug, rest] = booksMatch;
      if (!bookChanges.has(bookSlug)) {
        bookChanges.set(bookSlug, { chapters: [], config: false, plan: false, research: false, cover: false });
      }
      const entry = bookChanges.get(bookSlug)!;

      const chapterMatch = rest.match(/chapters\/chapter-(\d+)\.md/);
      if (chapterMatch) {
        entry.chapters.push(chapterMatch[1]);
      } else if (rest === "config.md") {
        entry.config = true;
      } else if (rest === "plan.md") {
        entry.plan = true;
      } else if (rest.startsWith("research/")) {
        entry.research = true;
      } else if (rest.startsWith("cover.")) {
        entry.cover = true;
      }
    } else if (file.startsWith("webapp/")) {
      webappChanges.push(file);
    } else if (file.startsWith(".github/")) {
      agentChanges.push(file);
    } else {
      otherChanges.push(file);
    }
  }

  const parts: string[] = [];

  for (const [slug, changes] of bookChanges) {
    const name = slug.replace(/-/g, " ");
    if (changes.config && changes.plan && changes.research) {
      parts.push(`Add new book: ${name}`);
    } else if (changes.chapters.length > 0) {
      const nums = changes.chapters.sort().join(", ");
      parts.push(`Add chapter${changes.chapters.length > 1 ? "s" : ""} ${nums} to ${name}`);
    } else if (changes.cover) {
      parts.push(`Add cover image for ${name}`);
    } else if (changes.config) {
      parts.push(`Update config for ${name}`);
    } else if (changes.plan) {
      parts.push(`Update plan for ${name}`);
    } else if (changes.research) {
      parts.push(`Update research for ${name}`);
    }
  }

  if (webappChanges.length > 0) {
    parts.push(`Update webapp (${webappChanges.length} file${webappChanges.length > 1 ? "s" : ""})`);
  }

  if (agentChanges.length > 0) {
    parts.push(`Update agents/scripts`);
  }

  if (otherChanges.length > 0 && parts.length === 0) {
    parts.push(`Update ${otherChanges.length} file${otherChanges.length > 1 ? "s" : ""}`);
  }

  return parts.length > 0 ? parts.join("; ") : "Update project files";
}
