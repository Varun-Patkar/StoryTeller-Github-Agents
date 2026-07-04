/**
 * nodes.mjs — Create, read, update, delete, and list graph nodes.
 *
 * A node's small metadata lives in the SQLite `nodes` table; its full details live in a
 * markdown file at `graph/nodes/<id>.md`. The two are kept in lock-step here, and the
 * FTS index is refreshed on every write so search stays current. Deterministic ids plus
 * the UNIQUE(type, name) constraint make duplicate creation impossible without an
 * explicit update, which is how we guarantee "no duplicates."
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { resolve } from "path";
import {
  openDb,
  graphPaths,
  nodeId,
  now,
  assertEnum,
  NODE_TYPES,
  CANONICITY,
} from "./db.mjs";

/**
 * Absolute path to a node's markdown file.
 * @param {string} slug Story slug.
 * @param {string} id Node id.
 * @returns {string} File path.
 */
function nodeMarkdownPath(slug, id) {
  return resolve(graphPaths(slug).nodesDir, `${id}.md`);
}

/**
 * Build the default markdown scaffold for a new node. The Canon and AU Divergence
 * sections are always present so fanfic divergence is tracked consistently; Original
 * nodes simply leave the AU section describing their invented nature.
 * @param {object} node Node metadata.
 * @returns {string} Markdown body.
 */
function defaultMarkdown(node) {
  const typeTitle = node.type.charAt(0).toUpperCase() + node.type.slice(1);
  const voiceSection =
    node.type === "character"
      ? "\n## Voice & Mannerisms\n_How they talk: speech patterns, verbal tics, 5-10 example quotes._\n"
      : "";
  return `# ${typeTitle}: ${node.name}

> id: ${node.id} | type: ${node.type} | canonicity: ${node.canonicity}

## Overview
${node.summary || "_One-paragraph summary._"}

## Canon
_What is true in the source material (or this story's established baseline)._
${voiceSection}
## AU Divergence
_How this differs from canon in our story. For original nodes, note that it is invented._

## Notes
_Additional details, arc relevance, open questions._
`;
}

/**
 * Read the markdown body for a node, or an empty string if none exists yet.
 * @param {string} slug Story slug.
 * @param {string} id Node id.
 * @returns {string} Markdown body.
 */
function readMarkdown(slug, id) {
  const path = nodeMarkdownPath(slug, id);
  return existsSync(path) ? readFileSync(path, "utf-8") : "";
}

/**
 * Refresh the FTS row for a node from its current metadata + markdown body.
 * @param {import("better-sqlite3").Database} db Open database.
 * @param {string} slug Story slug.
 * @param {object} node Node metadata row.
 */
function syncFts(db, slug, node) {
  db.prepare("DELETE FROM nodes_fts WHERE id = ?").run(node.id);
  db.prepare(
    "INSERT INTO nodes_fts (id, name, aliases, summary, tags, body) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    node.id,
    node.name,
    node.aliases,
    node.summary,
    node.tags,
    readMarkdown(slug, node.id)
  );
}

/**
 * Add a new node. Fails if a node with the same (type, name) already exists unless
 * `update` is true, in which case it delegates to updateNode. Writes the markdown file
 * (from `body`, or a scaffold if omitted) and refreshes the FTS index.
 *
 * @param {string} slug Story slug.
 * @param {object} input Node fields.
 * @param {string} input.type One of NODE_TYPES.
 * @param {string} input.name Display name.
 * @param {string} [input.canonicity="canon"] One of CANONICITY.
 * @param {string[]} [input.aliases=[]] Alternate names.
 * @param {string} [input.summary=""] One-line summary.
 * @param {string[]} [input.tags=[]] Freeform tags.
 * @param {string} [input.body] Full markdown body (scaffold used if omitted).
 * @param {boolean} [input.update=false] Upsert instead of failing on conflict.
 * @returns {object} The created/updated node metadata.
 */
export function addNode(slug, input) {
  const {
    type,
    name,
    canonicity = "canon",
    aliases = [],
    summary = "",
    tags = [],
    body,
    update = false,
  } = input;

  assertEnum(type, NODE_TYPES, "node type");
  assertEnum(canonicity, CANONICITY, "canonicity");
  if (!name || !String(name).trim()) throw new Error("Node name is required.");

  const id = nodeId(type, name);
  const db = openDb(slug);

  try {
    const existing = db.prepare("SELECT id FROM nodes WHERE id = ?").get(id);
    if (existing) {
      if (!update) {
        throw new Error(
          `Node "${id}" already exists. Use update-node, or pass --update to upsert.`
        );
      }
      db.close();
      return updateNode(slug, {
        id,
        canonicity,
        aliases,
        summary,
        tags,
        body,
      });
    }

    const ts = now();
    const row = {
      id,
      type,
      name,
      canonicity,
      aliases: JSON.stringify(aliases),
      summary,
      tags: JSON.stringify(tags),
      created_at: ts,
      updated_at: ts,
    };

    db.prepare(
      `INSERT INTO nodes (id, type, name, canonicity, aliases, summary, tags, created_at, updated_at)
       VALUES (@id, @type, @name, @canonicity, @aliases, @summary, @tags, @created_at, @updated_at)`
    ).run(row);

    writeFileSync(
      nodeMarkdownPath(slug, id),
      body ?? defaultMarkdown({ ...row, type, name, canonicity, summary }),
      "utf-8"
    );

    syncFts(db, slug, row);
    return { ...row, aliases, tags };
  } finally {
    if (db.open) db.close();
  }
}

/**
 * Update an existing node's metadata and/or markdown body. Only provided fields change.
 * @param {string} slug Story slug.
 * @param {object} input Fields to update; must include `id`.
 * @returns {object} Updated node metadata.
 */
export function updateNode(slug, input) {
  const { id } = input;
  if (!id) throw new Error("update-node requires an id.");
  const db = openDb(slug, { create: false });

  try {
    const existing = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    if (!existing) throw new Error(`Node "${id}" not found.`);

    const next = { ...existing };
    if (input.canonicity !== undefined) {
      assertEnum(input.canonicity, CANONICITY, "canonicity");
      next.canonicity = input.canonicity;
    }
    if (input.summary !== undefined) next.summary = input.summary;
    if (input.aliases !== undefined) next.aliases = JSON.stringify(input.aliases);
    if (input.tags !== undefined) next.tags = JSON.stringify(input.tags);
    next.updated_at = now();

    db.prepare(
      `UPDATE nodes SET canonicity=@canonicity, aliases=@aliases, summary=@summary,
        tags=@tags, updated_at=@updated_at WHERE id=@id`
    ).run(next);

    if (input.body !== undefined) {
      writeFileSync(nodeMarkdownPath(slug, id), input.body, "utf-8");
    }

    syncFts(db, slug, next);
    return {
      ...next,
      aliases: JSON.parse(next.aliases),
      tags: JSON.parse(next.tags),
    };
  } finally {
    if (db.open) db.close();
  }
}

/**
 * Fetch a node with its metadata, markdown body, and connected edges (both directions).
 * This is the primary "load context for grounding" call.
 * @param {string} slug Story slug.
 * @param {string} id Node id.
 * @param {{ includeBody?: boolean }} [opts] Include the markdown body (default true).
 * @returns {object|null} Node bundle or null if not found.
 */
export function getNode(slug, id, opts = {}) {
  const { includeBody = true } = opts;
  const db = openDb(slug, { create: false });
  try {
    const node = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    if (!node) return null;

    const outgoing = db
      .prepare("SELECT * FROM edges WHERE source_id = ?")
      .all(id);
    const incoming = db
      .prepare("SELECT * FROM edges WHERE target_id = ?")
      .all(id);

    return {
      ...node,
      aliases: JSON.parse(node.aliases),
      tags: JSON.parse(node.tags),
      body: includeBody ? readMarkdown(slug, id) : undefined,
      edges: { outgoing, incoming },
    };
  } finally {
    db.close();
  }
}

/**
 * List nodes, optionally filtered by type and/or canonicity.
 * @param {string} slug Story slug.
 * @param {{ type?: string, canonicity?: string }} [filter] Optional filters.
 * @returns {object[]} Node metadata rows (no body).
 */
export function listNodes(slug, filter = {}) {
  const db = openDb(slug, { create: false });
  try {
    const clauses = [];
    const params = [];
    if (filter.type) {
      clauses.push("type = ?");
      params.push(filter.type);
    }
    if (filter.canonicity) {
      clauses.push("canonicity = ?");
      params.push(filter.canonicity);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
      .prepare(`SELECT * FROM nodes ${where} ORDER BY type, name`)
      .all(...params);
    return rows.map((r) => ({
      ...r,
      aliases: JSON.parse(r.aliases),
      tags: JSON.parse(r.tags),
    }));
  } finally {
    db.close();
  }
}

/**
 * Remove a node, its markdown file, its FTS row, and (via cascade) its edges.
 * @param {string} slug Story slug.
 * @param {string} id Node id.
 * @returns {{ removed: string }} The removed id.
 */
export function removeNode(slug, id) {
  const db = openDb(slug, { create: false });
  try {
    const existing = db.prepare("SELECT id FROM nodes WHERE id = ?").get(id);
    if (!existing) throw new Error(`Node "${id}" not found.`);
    db.prepare("DELETE FROM nodes WHERE id = ?").run(id);
    db.prepare("DELETE FROM nodes_fts WHERE id = ?").run(id);
    const path = nodeMarkdownPath(slug, id);
    if (existsSync(path)) rmSync(path);
    return { removed: id };
  } finally {
    db.close();
  }
}

export { nodeMarkdownPath, readMarkdown, defaultMarkdown };
