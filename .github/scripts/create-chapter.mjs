#!/usr/bin/env node
/**
 * Creates the next chapter file in a story folder deterministically.
 *
 * Usage: node create-chapter.mjs <story-folder>
 *
 * Scans the chapters/ subfolder, finds the highest chapter number, and creates
 * the next one (e.g., chapter-04.md). Prints the path of the created file.
 */
import { readdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, "..", "..");

const storyFolder = process.argv[2];

if (!storyFolder) {
  console.error("Usage: node create-chapter.mjs <story-folder>");
  process.exit(1);
}

const storyDir = resolve(WORKSPACE_ROOT, storyFolder);
const chaptersDir = resolve(storyDir, "chapters");

if (!existsSync(chaptersDir)) {
  console.error(`Chapters directory not found: ${chaptersDir}`);
  process.exit(1);
}

// Find the next chapter number
const existing = readdirSync(chaptersDir)
  .filter((f) => /^chapter-\d+\.md$/.test(f))
  .map((f) => parseInt(f.match(/chapter-(\d+)\.md/)[1], 10))
  .sort((a, b) => a - b);

const nextNum = existing.length > 0 ? existing[existing.length - 1] + 1 : 1;
const padded = String(nextNum).padStart(2, "0");
const fileName = `chapter-${padded}.md`;
const filePath = resolve(chaptersDir, fileName);

writeFileSync(filePath, `# Chapter ${nextNum}: \n\n`, "utf-8");

console.log(JSON.stringify({
  chapter_number: nextNum,
  file_name: fileName,
  file_path: filePath,
}, null, 2));
