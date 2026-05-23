import { defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import { execSync } from "child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "fs";
import path from "path";
import { WORKSPACE_ROOT } from "./copilot";

const BOOKS_DIR = path.join(WORKSPACE_ROOT, "books");
const SCRIPTS_DIR = path.join(WORKSPACE_ROOT, ".github", "scripts");

/** Prevent path traversal — resolve and ensure path is within workspace */
function safePath(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}

function safeBookPath(slug: string): string {
  const resolved = path.resolve(BOOKS_DIR, slug);
  if (!resolved.startsWith(BOOKS_DIR)) {
    throw new Error("Invalid book slug");
  }
  return resolved;
}

export function getStorytellerTools() {
  return [
    // ── Story Management ──────────────────────────────────

    defineTool("list_books", {
      description:
        "List all books in the library with their config metadata. Returns an array of book slugs and their config fields.",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => {
        if (!existsSync(BOOKS_DIR)) return { books: [] };
        const dirs = readdirSync(BOOKS_DIR, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .filter((d) =>
            existsSync(path.join(BOOKS_DIR, d.name, "config.md"))
          );

        return {
          books: dirs.map((d) => {
            const config = readFileSync(
              path.join(BOOKS_DIR, d.name, "config.md"),
              "utf-8"
            );
            return { slug: d.name, config };
          }),
        };
      },
    }),

    defineTool("get_book_config", {
      description: "Read a book's config.md file containing all story settings.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug (e.g. 'new-game-plus-the-last-of-us')"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const p = path.join(safeBookPath(slug), "config.md");
        if (!existsSync(p)) return { error: "Book not found" };
        return { content: readFileSync(p, "utf-8") };
      },
    }),

    defineTool("get_book_plan", {
      description: "Read a book's plan.md file containing the full story outline.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const p = path.join(safeBookPath(slug), "plan.md");
        if (!existsSync(p)) return { error: "Plan not found" };
        return { content: readFileSync(p, "utf-8") };
      },
    }),

    defineTool("get_book_summary", {
      description: "Read a book's summary.md file containing the running story summary.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const p = path.join(safeBookPath(slug), "summary.md");
        if (!existsSync(p)) return { error: "Summary not found" };
        return { content: readFileSync(p, "utf-8") };
      },
    }),

    defineTool("get_chapter", {
      description: "Read a specific chapter's content from a book.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
        chapter: z.number().describe("Chapter number"),
      }),
      skipPermission: true,
      handler: async ({ slug, chapter }) => {
        const padded = String(chapter).padStart(2, "0");
        const p = path.join(
          safeBookPath(slug),
          "chapters",
          `chapter-${padded}.md`
        );
        if (!existsSync(p)) return { error: `Chapter ${chapter} not found` };
        return { content: readFileSync(p, "utf-8") };
      },
    }),

    defineTool("get_research_file", {
      description: "Read a research file from a book's research folder.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
        filePath: z
          .string()
          .describe("Relative path within research/ (e.g. 'characters/joel-miller.md')"),
      }),
      skipPermission: true,
      handler: async ({ slug, filePath }) => {
        const base = safeBookPath(slug);
        const full = path.resolve(base, "research", filePath);
        if (!full.startsWith(path.join(base, "research"))) {
          return { error: "Invalid path" };
        }
        if (!existsSync(full)) return { error: "File not found" };
        return { content: readFileSync(full, "utf-8") };
      },
    }),

    defineTool("list_research_files", {
      description: "List all research files for a book.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const researchDir = path.join(safeBookPath(slug), "research");
        if (!existsSync(researchDir)) return { files: [] };

        const files: string[] = [];
        function walk(dir: string, prefix: string) {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
              walk(path.join(dir, entry.name), rel);
            } else {
              files.push(rel);
            }
          }
        }
        walk(researchDir, "");
        return { files };
      },
    }),

    defineTool("create_story_structure", {
      description:
        "Create a new story folder structure with config, plan, summary, and research directories. Uses the project's create-story-structure.mjs script.",
      parameters: z.object({
        name: z.string().describe("Story display name"),
        type: z.string().optional().describe("Story type (e.g. 'Fanfiction', 'Original')"),
        fandom: z.string().optional(),
        genre: z.string().optional(),
        themes: z.string().optional(),
        mode: z.string().optional(),
        pacing: z.string().optional(),
        pov: z.string().optional(),
        tone: z.string().optional(),
        author: z.string().optional(),
      }),
      skipPermission: true,
      handler: async (args) => {
        const flags = Object.entries(args)
          .filter(([k, v]) => k !== "name" && v)
          .map(([k, v]) => `--${k} "${String(v).replace(/"/g, "")}"`)
          .join(" ");
        const cmd = `node "${path.join(SCRIPTS_DIR, "create-story-structure.mjs")}" "${args.name.replace(/"/g, "")}" ${flags}`;
        const output = execSync(cmd, { cwd: WORKSPACE_ROOT, encoding: "utf-8" });
        return JSON.parse(output);
      },
    }),

    defineTool("create_chapter_file", {
      description:
        "Create the next chapter file in a book's chapters/ folder. Returns the chapter number and file path.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const cmd = `node "${path.join(SCRIPTS_DIR, "create-chapter.mjs")}" "${slug.replace(/"/g, "")}"`;
        const output = execSync(cmd, { cwd: WORKSPACE_ROOT, encoding: "utf-8" });
        return JSON.parse(output);
      },
    }),

    defineTool("write_chapter_content", {
      description: "Write or overwrite the content of a chapter file.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
        chapter: z.number().describe("Chapter number"),
        content: z.string().describe("Full chapter content in markdown"),
      }),
      skipPermission: true,
      handler: async ({ slug, chapter, content }) => {
        const padded = String(chapter).padStart(2, "0");
        const p = path.join(
          safeBookPath(slug),
          "chapters",
          `chapter-${padded}.md`
        );
        writeFileSync(p, content, "utf-8");
        return { success: true, path: `books/${slug}/chapters/chapter-${padded}.md` };
      },
    }),

    defineTool("update_file", {
      description: "Write content to a file in a book folder (config.md, plan.md, summary.md, or research files).",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
        filePath: z.string().describe("Relative path within the book folder (e.g. 'config.md', 'plan.md', 'research/characters/mc.md')"),
        content: z.string().describe("Full file content"),
      }),
      skipPermission: true,
      handler: async ({ slug, filePath, content }) => {
        const base = safeBookPath(slug);
        const full = path.resolve(base, filePath);
        if (!full.startsWith(base)) return { error: "Invalid path" };
        const dir = path.dirname(full);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(full, content, "utf-8");
        return { success: true, path: `books/${slug}/${filePath}` };
      },
    }),

    defineTool("delete_chapter", {
      description: "Delete a chapter file from a book.",
      parameters: z.object({
        slug: z.string().describe("Book folder slug"),
        chapter: z.number().describe("Chapter number to delete"),
      }),
      skipPermission: true,
      handler: async ({ slug, chapter }) => {
        const padded = String(chapter).padStart(2, "0");
        const p = path.join(
          safeBookPath(slug),
          "chapters",
          `chapter-${padded}.md`
        );
        if (!existsSync(p)) return { error: `Chapter ${chapter} not found` };
        rmSync(p);
        return { success: true, deleted: `chapter-${padded}.md` };
      },
    }),

    defineTool("delete_book", {
      description: "Delete an entire book folder and all its contents. This is irreversible!",
      parameters: z.object({
        slug: z.string().describe("Book folder slug to delete"),
      }),
      skipPermission: true,
      handler: async ({ slug }) => {
        const p = safeBookPath(slug);
        if (!existsSync(p)) return { error: "Book not found" };
        rmSync(p, { recursive: true, force: true });
        return { success: true, deleted: slug };
      },
    }),

    // ── File System ───────────────────────────────────────

    defineTool("read_workspace_file", {
      description: "Read any file in the workspace.",
      parameters: z.object({
        path: z.string().describe("Relative path from workspace root"),
      }),
      skipPermission: true,
      handler: async ({ path: relPath }) => {
        const p = safePath(relPath);
        if (!existsSync(p)) return { error: "File not found" };
        if (statSync(p).isDirectory()) return { error: "Path is a directory" };
        return { content: readFileSync(p, "utf-8") };
      },
    }),

    defineTool("write_workspace_file", {
      description: "Write content to any file in the workspace.",
      parameters: z.object({
        path: z.string().describe("Relative path from workspace root"),
        content: z.string().describe("File content to write"),
      }),
      skipPermission: true,
      handler: async ({ path: relPath, content }) => {
        const p = safePath(relPath);
        const dir = path.dirname(p);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(p, content, "utf-8");
        return { success: true };
      },
    }),

    defineTool("list_directory", {
      description: "List the contents of a directory in the workspace.",
      parameters: z.object({
        path: z
          .string()
          .optional()
          .describe("Relative path from workspace root (default: root)"),
      }),
      skipPermission: true,
      handler: async ({ path: relPath }) => {
        const p = safePath(relPath || ".");
        if (!existsSync(p)) return { error: "Directory not found" };
        const entries = readdirSync(p, { withFileTypes: true }).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
        }));
        return { entries };
      },
    }),

    // ── Web Research ──────────────────────────────────────

    defineTool("web_search", {
      description:
        "Search the web using SearXNG (must be running on localhost:8080). Returns search results with titles, URLs, and snippets.",
      parameters: z.object({
        query: z.string().describe("Search query"),
        categories: z
          .string()
          .optional()
          .describe("Comma-separated categories (e.g. 'general,wiki')"),
      }),
      skipPermission: true,
      handler: async ({ query, categories }) => {
        try {
          const params = new URLSearchParams({
            q: query,
            format: "json",
          });
          if (categories) params.set("categories", categories);
          const res = await fetch(
            `http://localhost:8080/search?${params.toString()}`
          );
          if (!res.ok) return { error: "SearXNG not available. Use fetch_webpage on known URLs instead." };
          const data = await res.json();
          const results = (data.results || []).slice(0, 10).map(
            (r: { title: string; url: string; content: string }) => ({
              title: r.title,
              url: r.url,
              snippet: r.content,
            })
          );
          return { results };
        } catch {
          return {
            error: "SearXNG not available. Use fetch_webpage on known URLs instead.",
          };
        }
      },
    }),

    defineTool("fetch_webpage", {
      description:
        "Fetch the text content of a webpage. Useful for reading wiki pages, documentation, etc.",
      parameters: z.object({
        url: z.string().url().describe("URL to fetch"),
      }),
      skipPermission: true,
      handler: async ({ url }) => {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "StoryTeller/1.0" },
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) return { error: `HTTP ${res.status}` };
          const html = await res.text();
          // Basic HTML to text conversion
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 20000);
          return { content: text };
        } catch (e) {
          return { error: String(e) };
        }
      },
    }),

    // ── Git ───────────────────────────────────────────────

    defineTool("git_status", {
      description: "Get the current git status of the workspace.",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => {
        try {
          const output = execSync("git status --short", {
            cwd: WORKSPACE_ROOT,
            encoding: "utf-8",
          });
          const branch = execSync("git rev-parse --abbrev-ref HEAD", {
            cwd: WORKSPACE_ROOT,
            encoding: "utf-8",
          }).trim();
          return { branch, changes: output || "No changes" };
        } catch (e) {
          return { error: String(e) };
        }
      },
    }),

    defineTool("git_commit", {
      description: "Stage all changes and commit with the given message.",
      parameters: z.object({
        message: z.string().describe("Commit message"),
      }),
      skipPermission: true,
      handler: async ({ message }) => {
        const safe = message.replace(/["\\`$]/g, "").substring(0, 500);
        execSync("git add -A", { cwd: WORKSPACE_ROOT });
        execSync(`git commit -m "${safe}"`, {
          cwd: WORKSPACE_ROOT,
          encoding: "utf-8",
        });
        const hash = execSync("git rev-parse --short HEAD", {
          cwd: WORKSPACE_ROOT,
          encoding: "utf-8",
        }).trim();
        return { success: true, hash };
      },
    }),

    defineTool("git_push", {
      description: "Push committed changes to the remote.",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => {
        execSync("git push", { cwd: WORKSPACE_ROOT, encoding: "utf-8" });
        return { success: true };
      },
    }),

    defineTool("git_pull", {
      description: "Pull latest changes from the remote.",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => {
        const output = execSync("git pull --ff-only", {
          cwd: WORKSPACE_ROOT,
          encoding: "utf-8",
        });
        return { success: true, output };
      },
    }),

    defineTool("git_undo_file", {
      description: "Revert a specific file to its last committed version.",
      parameters: z.object({
        filePath: z.string().describe("Relative path of the file to revert"),
      }),
      skipPermission: true,
      handler: async ({ filePath }) => {
        if (filePath.includes("..") || path.isAbsolute(filePath)) {
          return { error: "Invalid path" };
        }
        execSync(`git checkout -- "${filePath.replace(/"/g, "")}"`, {
          cwd: WORKSPACE_ROOT,
          encoding: "utf-8",
        });
        return { success: true, reverted: filePath };
      },
    }),

    defineTool("git_undo_all_changes", {
      description: "Discard ALL local changes and untracked files, reverting the workspace to the last commit.",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => {
        execSync("git checkout -- .", { cwd: WORKSPACE_ROOT });
        execSync("git clean -fd", { cwd: WORKSPACE_ROOT });
        return { success: true };
      },
    }),
  ];
}
