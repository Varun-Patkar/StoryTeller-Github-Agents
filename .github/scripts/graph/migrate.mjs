/**
 * migrate.mjs — One-time conversion of a story's legacy `research/` folder into graph nodes.
 *
 * The old format stored free-form markdown files under `research/` (fandom-overview.md,
 * world-building.md, power-system.md, genre-conventions.md, characters/<name>.md,
 * characters/supporting-cast.md). This script creates a node for each meaningful file and
 * loads its markdown as the node body. It intentionally does NOT try to parse prose into
 * edges — relationship extraction is left to the agent, which reviews the imported nodes
 * and adds edges + canonicity deliberately. The goal here is a lossless, deterministic
 * lift of existing content into the new structure.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { resolve } from "path";
import { BOOKS_DIR } from "./db.mjs";
import { addNode } from "./nodes.mjs";

/**
 * Derive a human title from a research filename (e.g. "joel-miller.md" -> "Joel Miller").
 * Prefers the first markdown H1 in the file if present.
 * @param {string} fileName Base filename.
 * @param {string} content File contents.
 * @returns {string} Display name.
 */
function deriveName(fileName, content) {
  const h1 = content.match(/^#\s+(?:Character:\s*)?(.+)$/m);
  if (h1) return h1[1].trim();
  return fileName
    .replace(/\.md$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Map a research file to a node type. Character files become `character`; the world/
 * power/genre/fandom overview files become `concept` nodes (broad lore containers the
 * agent can later split apart).
 * @param {string} relPath Path relative to research/.
 * @returns {string} Node type.
 */
function inferType(relPath) {
  if (relPath.startsWith("characters/")) return "character";
  if (/power-system/i.test(relPath)) return "ability";
  if (/world-building/i.test(relPath)) return "location";
  return "concept";
}

/**
 * Migrate one story's research folder into its graph.
 * @param {string} slug Story slug.
 * @returns {{ created: string[], skipped: string[] }} Import report.
 */
export function migrate(slug) {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const researchDir = resolve(BOOKS_DIR, safeSlug, "research");
  if (!existsSync(researchDir)) {
    throw new Error(`No research/ folder found for story "${slug}".`);
  }

  const created = [];
  const skipped = [];

  /**
   * Recursively walk research/ collecting markdown files with their relative paths.
   * @param {string} dir Absolute directory.
   * @param {string} prefix Relative prefix.
   * @returns {Array<{ rel: string, abs: string }>} Markdown file descriptors.
   */
  function walk(dir, prefix = "") {
    const out = [];
    for (const entry of readdirSync(dir)) {
      const abs = resolve(dir, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(abs).isDirectory()) {
        out.push(...walk(abs, rel));
      } else if (entry.endsWith(".md")) {
        out.push({ rel, abs });
      }
    }
    return out;
  }

  for (const { rel, abs } of walk(researchDir)) {
    const content = readFileSync(abs, "utf-8");
    const type = inferType(rel);

    // supporting-cast.md holds many characters; import it as a single concept node the
    // agent can split, rather than guessing character boundaries deterministically.
    const isBundle = /supporting-cast/i.test(rel);
    const name = isBundle ? "Supporting Cast" : deriveName(rel.split("/").pop(), content);
    const nodeType = isBundle ? "concept" : type;

    try {
      const node = addNode(slug, {
        type: nodeType,
        name,
        canonicity: "canon",
        summary: `Imported from research/${rel}`,
        tags: ["imported"],
        body: content,
      });
      created.push(node.id);
    } catch (err) {
      skipped.push(`${rel}: ${err.message}`);
    }
  }

  return { created, skipped };
}
