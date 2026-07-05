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
  edgeId,
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
    if (input.name !== undefined) {
      if (!String(input.name).trim()) throw new Error("Node name cannot be empty.");
      next.name = input.name;
    }
    if (input.canonicity !== undefined) {
      assertEnum(input.canonicity, CANONICITY, "canonicity");
      next.canonicity = input.canonicity;
    }
    if (input.summary !== undefined) next.summary = input.summary;
    if (input.aliases !== undefined) next.aliases = JSON.stringify(input.aliases);
    if (input.tags !== undefined) next.tags = JSON.stringify(input.tags);
    next.updated_at = now();

    db.prepare(
      `UPDATE nodes SET name=@name, canonicity=@canonicity, aliases=@aliases, summary=@summary,
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

/**
 * Rename a node's id, keeping the whole graph consistent. This re-points every edge that
 * touches the node (edge ids embed the endpoint ids, so they are regenerated too), moves
 * the markdown file, rewrites references to the old id inside the body, and refreshes the
 * FTS index. The node's other fields (type, name, canonicity, etc.) are unchanged.
 *
 * The id is updated in place with foreign-key enforcement briefly disabled. An in-place
 * update (rather than clone-then-delete) avoids the UNIQUE(type, name) collision two rows
 * would cause, and lets the child edges be re-pointed without the foreign key blocking the
 * parent key change. The mutation runs inside a single transaction.
 *
 * @param {string} slug Story slug.
 * @param {string} oldId Current node id.
 * @param {string} newId Desired node id (lowercase, hyphen-separated token).
 * @returns {{ renamed: { from: string, to: string }, edgesUpdated: number, markdownMoved: boolean }}
 */
export function renameNode(slug, oldId, newId) {
  if (!oldId) throw new Error("rename-node requires --id (the current id).");
  if (!newId) throw new Error("rename-node requires --new-id (the new id).");
  if (oldId === newId) throw new Error("New id must differ from the current id.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newId)) {
    throw new Error(
      `Invalid new id "${newId}". Use lowercase letters, numbers, and single hyphens ` +
        `(e.g. "event-abels-sparing").`
    );
  }

  const db = openDb(slug, { create: false });
  try {
    const existing = db.prepare("SELECT * FROM nodes WHERE id = ?").get(oldId);
    if (!existing) throw new Error(`Node "${oldId}" not found.`);
    const clash = db.prepare("SELECT id FROM nodes WHERE id = ?").get(newId);
    if (clash) throw new Error(`Node "${newId}" already exists; cannot rename onto it.`);

    const ts = now();

    // Pre-compute the new (id, source, target) for every touched edge and detect any
    // collision with an existing edge id BEFORE mutating anything.
    const affectedEdges = db
      .prepare("SELECT * FROM edges WHERE source_id = ? OR target_id = ?")
      .all(oldId, oldId);
    const rewrites = affectedEdges.map((e) => {
      const source_id = e.source_id === oldId ? newId : e.source_id;
      const target_id = e.target_id === oldId ? newId : e.target_id;
      return { oldEdgeId: e.id, id: edgeId(source_id, e.type, target_id), source_id, target_id };
    });
    for (const r of rewrites) {
      if (r.id !== r.oldEdgeId) {
        const collide = db.prepare("SELECT id FROM edges WHERE id = ?").get(r.id);
        if (collide) {
          throw new Error(`Rename would collide with existing edge "${r.id}".`);
        }
      }
    }

    // Foreign-key enforcement must be toggled outside the transaction (SQLite ignores the
    // pragma while a transaction is open). It is always restored in the finally block.
    db.pragma("foreign_keys = OFF");
    try {
      const tx = db.transaction(() => {
        // 1. Move the node's primary key in place.
        db.prepare("UPDATE nodes SET id=@newId, updated_at=@ts WHERE id=@oldId").run({
          newId,
          oldId,
          ts,
        });
        // 2. Re-point every edge and refresh its deterministic id.
        for (const r of rewrites) {
          db.prepare(
            "UPDATE edges SET id=@id, source_id=@source_id, target_id=@target_id, updated_at=@ts WHERE id=@oldEdgeId"
          ).run({ ...r, ts });
        }
        // 3. Drop the stale FTS row (the fresh one is rebuilt after the markdown moves).
        db.prepare("DELETE FROM nodes_fts WHERE id = ?").run(oldId);
      });
      tx();
    } finally {
      db.pragma("foreign_keys = ON");
    }

    // 4. Move the markdown file and rewrite any inline references to the old id.
    const oldPath = nodeMarkdownPath(slug, oldId);
    const newPath = nodeMarkdownPath(slug, newId);
    let markdownMoved = false;
    if (existsSync(oldPath)) {
      const body = readFileSync(oldPath, "utf-8").split(oldId).join(newId);
      writeFileSync(newPath, body, "utf-8");
      rmSync(oldPath);
      markdownMoved = true;
    }

    // 5. Rebuild the FTS row for the new id from its (possibly moved) markdown body.
    const movedNode = db.prepare("SELECT * FROM nodes WHERE id = ?").get(newId);
    syncFts(db, slug, movedNode);

    return {
      renamed: { from: oldId, to: newId },
      edgesUpdated: rewrites.length,
      markdownMoved,
    };
  } finally {
    if (db.open) db.close();
  }
}

export { nodeMarkdownPath, readMarkdown, defaultMarkdown };
