import { getClient } from "@/lib/copilot";
import { approveAll } from "@github/copilot-sdk";
import { execSync } from "child_process";
import path from "path";

const REPO_ROOT = path.resolve(process.cwd(), "..");

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      timeout: 10000,
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Uses Copilot SDK to generate a smart commit message based on:
 * - The actual diff of staged/unstaged changes
 * - Previous commit messages for style matching
 */
export async function generateCommitMessage(): Promise<string> {
  // Get diff (staged + unstaged, limited to avoid token overflow)
  const diff = git("diff HEAD --stat") || git("diff --stat");
  const diffContent = git("diff HEAD -U2 -- . ':!package-lock.json' ':!*.png' ':!*.jpg'");
  const truncatedDiff = diffContent.substring(0, 8000);

  // Get recent commit messages for style reference
  const recentMessages = git('log --oneline -10 --format="%s"');

  // Get list of untracked files
  const untracked = git("ls-files --others --exclude-standard");

  if (!diff && !untracked) {
    return "No changes to commit";
  }

  const prompt = `Generate a concise git commit message for the following changes. Follow the style of the previous commit messages shown below.

## Previous commit messages (for style reference):
${recentMessages || "No previous commits"}

## Changed files summary:
${diff || "No tracked changes"}

${untracked ? `## New untracked files:\n${untracked}` : ""}

## Diff (truncated):
${truncatedDiff || "No diff available"}

Rules:
- Write ONE line, no quotes, no prefix like "feat:" or "chore:"
- Be specific about what changed (mention book names, chapter numbers, component names)
- Match the tone and style of previous commits
- Keep it under 100 characters if possible
- Just output the message, nothing else`;

  const client = await getClient();
  const session = await client.createSession({
    model: "claude-sonnet-4.5",
    sessionId: `commit-msg-${Date.now()}`,
    streaming: false,
    onPermissionRequest: approveAll,
    systemMessage: {
      mode: "replace" as const,
      content: "You are a git commit message generator. Output ONLY the commit message text, nothing else. No quotes, no explanations, no markdown.",
    },
  });

  try {
    const result = await session.sendAndWait({ prompt }, 15000);
    const message = result?.data?.content?.trim();

    // Clean up: remove quotes, backticks, prefixes
    const cleaned = (message || "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^(feat|fix|chore|docs|style|refactor|perf|test|ci|build|revert)(\(.+?\))?:\s*/i, "")
      .trim();

    await session.disconnect();

    // Delete the ephemeral session
    try {
      await client.deleteSession(`commit-msg-${Date.now()}`);
    } catch {}

    return cleaned || "Update project files";
  } catch {
    try { await session.disconnect(); } catch {}
    return "Update project files";
  }
}
