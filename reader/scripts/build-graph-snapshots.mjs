/**
 * build-graph-snapshots.mjs — Reader prebuild step that snapshots each story's knowledge
 * graph into a static JSON file the Brain Viewer can load in the browser.
 *
 * The reader is a static frontend: it cannot open the SQLite graph or read git state at
 * runtime. So at build ("publish to reader") time we read every `books/<slug>/graph/graph.db`
 * plus its node markdown bodies, pre-render the markdown to HTML, and emit
 * `reader/public/graph/<slug>.json`. That snapshot is frozen at build time — exactly the
 * "state as of publish" the viewer displays.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const booksDir = resolve(__dirname, "..", "..", "books");
const outDir = resolve(__dirname, "..", "public", "graph");

/**
 * Build the snapshot object for a single story graph.
 * @param {string} slug Story slug (book folder name).
 * @param {string} graphDir Absolute path to the story's graph/ folder.
 * @returns {object|null} Snapshot { slug, generatedAt, nodes, edges } or null if unreadable.
 */
function buildSnapshot(slug, graphDir) {
  const dbPath = join(graphDir, "graph.db");
  const nodesDir = join(graphDir, "nodes");
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const nodeRows = db
      .prepare(
        "SELECT id, type, name, canonicity, aliases, summary, tags FROM nodes ORDER BY type, name"
      )
      .all();

    const nodes = nodeRows.map((n) => {
      const bodyPath = join(nodesDir, `${n.id}.md`);
      const body = existsSync(bodyPath) ? readFileSync(bodyPath, "utf-8") : "";
      return {
        id: n.id,
        type: n.type,
        name: n.name,
        canonicity: n.canonicity,
        aliases: safeJson(n.aliases, []),
        summary: n.summary,
        tags: safeJson(n.tags, []),
        // Pre-render markdown so the viewer needs no client-side markdown library.
        bodyHtml: body ? marked.parse(body) : "",
      };
    });

    const edges = db
      .prepare(
        "SELECT id, source_id, target_id, type, canonicity, label FROM edges"
      )
      .all()
      .map((e) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        type: e.type,
        canonicity: e.canonicity,
        label: e.label,
      }));

    return { slug, generatedAt: new Date().toISOString(), nodes, edges };
  } finally {
    db.close();
  }
}

/**
 * Parse a JSON string, returning a fallback on any error.
 * @param {string} value Raw JSON text.
 * @param {any} fallback Value to return on failure.
 * @returns {any} Parsed value or fallback.
 */
function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

if (!existsSync(booksDir)) {
  console.log("No books directory found, skipping graph snapshots.");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

let written = 0;
for (const entry of readdirSync(booksDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const graphDir = join(booksDir, entry.name, "graph");
  if (!existsSync(join(graphDir, "graph.db"))) continue;
  try {
    const snapshot = buildSnapshot(entry.name, graphDir);
    writeFileSync(
      join(outDir, `${entry.name}.json`),
      JSON.stringify(snapshot),
      "utf-8"
    );
    written++;
  } catch (err) {
    console.warn(`Skipping graph snapshot for "${entry.name}": ${err.message}`);
  }
}

console.log(`Wrote ${written} graph snapshot(s).`);
