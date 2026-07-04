/**
 * db.mjs — Schema, enums, and connection helpers for the per-story knowledge graph.
 *
 * Each story owns a SQLite database at `books/<slug>/graph/graph.db` plus a folder of
 * markdown files at `books/<slug>/graph/nodes/<id>.md`. The database stores the graph
 * skeleton (small node metadata + relationships) while the markdown files hold the full,
 * token-heavy details. This module is the single source of truth for the allowed node
 * types, edge types, and canonicity values — every other module imports these constants.
 */
import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Workspace root — three levels up from `.github/scripts/graph/`. */
export const WORKSPACE_ROOT = resolve(__dirname, "..", "..", "..");

/** Directory that holds every story folder. */
export const BOOKS_DIR = resolve(WORKSPACE_ROOT, "books");

/**
 * Allowed node types. A node is any distinct, addressable piece of story knowledge.
 * Keeping this list closed prevents the graph from sprawling into free-form categories.
 */
export const NODE_TYPES = Object.freeze([
  "character", // A person/being: protagonist, antagonist, supporting cast.
  "location", // A place: city, building, region, landmark.
  "faction", // An organization/group: government, guild, family, army.
  "item", // A notable object: artifact, weapon, key, resource.
  "event", // A happening: battle, reveal, meeting, disaster (canon or story).
  "ability", // A power/skill/technique/system mechanic.
  "concept", // Terminology, lore, world rule, or abstract idea.
  "arc", // A story arc (matches plan.md arc structure).
  "thread", // A setup/payoff, promise, debt, or mystery to track across chapters.
]);

/**
 * Allowed edge types. Edges are directed (source -> target). `related_to` is the generic
 * fallback; `diverges_from` is the key fanfic edge that links an AU node to the canon
 * baseline it changes, so the story stays internally consistent while tracking divergence.
 */
export const EDGE_TYPES = Object.freeze([
  "family_of", // character -> character (parent, sibling, spouse, child).
  "ally_of", // character/faction -> character/faction (friendly).
  "enemy_of", // character/faction -> character/faction (hostile).
  "knows", // character -> character (acquainted, non-committal).
  "member_of", // character -> faction.
  "located_in", // character/faction/item/event -> location.
  "owns", // character/faction -> item.
  "has_ability", // character -> ability.
  "occurs_in", // event -> arc / event -> location.
  "involves", // event -> character/faction/item.
  "causes", // event -> event.
  "precedes", // event -> event / arc -> arc (timeline ordering).
  "part_of", // location -> location / faction -> faction / arc -> arc.
  "related_to", // generic fallback when nothing more specific fits.
  "diverges_from", // au node -> the canon node/baseline it overwrites (fanfic AU tracking).
]);

/**
 * Canonicity marks whether a node/edge reflects source-material truth, our alternate-
 * universe change, or something invented for this story with no canon equivalent.
 *   canon    — true to the source fandom (or the story's own established baseline).
 *   au       — an alternate-universe divergence from canon we are deliberately creating.
 *   original — invented for this story; no canon counterpart exists.
 */
export const CANONICITY = Object.freeze(["canon", "au", "original"]);

/**
 * Slugify a free-text name into a filesystem/id-safe token.
 * Deterministic: the same name always yields the same slug, which is what guarantees
 * that duplicate inserts collide on the primary key instead of creating twins.
 * @param {string} name Raw display name.
 * @returns {string} Lowercased, hyphenated, ascii-safe slug.
 */
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Build the deterministic node id from a type and name, e.g. `character-joel-miller`.
 * @param {string} type One of NODE_TYPES.
 * @param {string} name Display name.
 * @returns {string} Node id.
 */
export function nodeId(type, name) {
  return `${type}-${slugify(name)}`;
}

/**
 * Build the deterministic edge id, e.g. `character-a__ally_of__character-b`.
 * @param {string} sourceId Source node id.
 * @param {string} type Edge type.
 * @param {string} targetId Target node id.
 * @returns {string} Edge id.
 */
export function edgeId(sourceId, type, targetId) {
  return `${sourceId}__${type}__${targetId}`;
}

/**
 * Resolve the absolute path to a story's graph directory and its sub-paths.
 * @param {string} slug Story slug (folder name under books/).
 * @returns {{ dir: string, dbPath: string, nodesDir: string }}
 */
export function graphPaths(slug) {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const dir = resolve(BOOKS_DIR, safeSlug, "graph");
  return {
    dir,
    dbPath: resolve(dir, "graph.db"),
    nodesDir: resolve(dir, "nodes"),
  };
}

/**
 * SQL that creates the full schema. Safe to run repeatedly (IF NOT EXISTS).
 * `nodes_fts` is an FTS5 contentless-ish table kept in sync by the node module so that
 * full-text search covers name, aliases, summary, tags, and the markdown body.
 */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  canonicity  TEXT NOT NULL DEFAULT 'canon',
  aliases     TEXT NOT NULL DEFAULT '[]',   -- JSON array of alternate names
  summary     TEXT NOT NULL DEFAULT '',     -- one-line description (body lives in markdown)
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON array of freeform tags
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE (type, name)
);

CREATE TABLE IF NOT EXISTS edges (
  id          TEXT PRIMARY KEY,
  source_id   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  canonicity  TEXT NOT NULL DEFAULT 'canon',
  label       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE (source_id, type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type   ON nodes(type);

CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  id UNINDEXED,
  name,
  aliases,
  summary,
  tags,
  body
);
`;

/**
 * Open (creating if needed) the SQLite database for a story and ensure the schema exists.
 * Also guarantees the `nodes/` markdown directory exists.
 * @param {string} slug Story slug.
 * @param {{ create?: boolean }} [opts] When create is false, throws if the db is missing.
 * @returns {import("better-sqlite3").Database} Open database handle.
 */
export function openDb(slug, opts = {}) {
  const { create = true } = opts;
  const { dir, dbPath, nodesDir } = graphPaths(slug);

  if (!create && !existsSync(dbPath)) {
    throw new Error(`Graph database not found for story "${slug}": ${dbPath}`);
  }

  mkdirSync(nodesDir, { recursive: true });
  const db = new Database(dbPath);
  // Rollback-journal (DELETE) mode keeps everything inside graph.db with no persistent
  // sidecar files, so the committed database is always complete. Access is single-process
  // (one CLI invocation at a time), so WAL concurrency would add no benefit.
  db.pragma("journal_mode = DELETE");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}

/**
 * Validate an enum value, throwing a descriptive error listing the allowed set.
 * @param {string} value Provided value.
 * @param {readonly string[]} allowed Allowed values.
 * @param {string} label Field name for the error message.
 */
export function assertEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new Error(
      `Invalid ${label} "${value}". Allowed: ${allowed.join(", ")}`
    );
  }
}

/** Current ISO timestamp helper. */
export function now() {
  return new Date().toISOString();
}
