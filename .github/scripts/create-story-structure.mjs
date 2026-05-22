#!/usr/bin/env node
/**
 * Creates the full story folder structure deterministically.
 *
 * Usage: node create-story-structure.mjs <story-name> [--type <type>] [--fandom <fandom>]
 *        [--genre <genre>] [--themes <themes>] [--mode <mode>] [--pacing <pacing>]
 *        [--pov <pov>] [--tone <tone>]
 *
 * The story name is slugified (lowercased, spaces → hyphens, special chars removed).
 * Creates the folder at the workspace root (two levels up from this script).
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, "..", "..");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseArgs(args) {
  const result = { name: args[0] };
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const val = args[i + 1];
    if (key && val) result[key] = val;
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

if (!args.name) {
  console.error("Usage: node create-story-structure.mjs <story-name> [--type ...] [--fandom ...] ...");
  process.exit(1);
}

const slug = slugify(args.name);
const storyDir = resolve(WORKSPACE_ROOT, slug);

if (existsSync(storyDir)) {
  console.error(`Story folder already exists: ${storyDir}`);
  process.exit(1);
}

// Create directories
const dirs = [
  storyDir,
  resolve(storyDir, "chapters"),
  resolve(storyDir, "research"),
  resolve(storyDir, "research", "characters"),
];
dirs.forEach((d) => mkdirSync(d, { recursive: true }));

// Create config.md
const configContent = `# Story Configuration

| Setting | Value |
| ------- | ----- |
| Type    | ${args.type || "Original"} |
| Fandom  | ${args.fandom || "N/A"} |
| Genre   | ${args.genre || "Fantasy"} |
| Themes  | ${args.themes || ""} |
| Mode    | ${args.mode || "Here for the Ride"} |
| Pacing  | ${args.pacing || "Medium (1500-3000 characters)"} |
| POV     | ${args.pov || "Third Person Limited"} |
| Tone    | ${args.tone || "Balanced"} |
`;
writeFileSync(resolve(storyDir, "config.md"), configContent, "utf-8");

// Create empty summary.md
const summaryContent = `# Story Summary: ${args.name}

_No chapters written yet._
`;
writeFileSync(resolve(storyDir, "summary.md"), summaryContent, "utf-8");

// Create empty plan.md (agent fills in content)
writeFileSync(resolve(storyDir, "plan.md"), `# Story Plan: ${args.name}\n`, "utf-8");

console.log(JSON.stringify({
  story_folder: storyDir,
  slug,
  created: ["config.md", "summary.md", "plan.md", "chapters/", "research/", "research/characters/"],
}, null, 2));
