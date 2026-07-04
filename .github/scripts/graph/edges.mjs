/**
 * edges.mjs — Create, list, and remove directed relationships between nodes.
 *
 * Edges carry only small metadata (type, canonicity, a short label). The deterministic
 * edge id plus UNIQUE(source, type, target) prevent duplicate relationships. Both
 * endpoints must already exist as nodes, so the graph never contains dangling edges.
 */
import {
  openDb,
  edgeId,
  now,
  assertEnum,
  EDGE_TYPES,
  CANONICITY,
} from "./db.mjs";

/**
 * Add a directed edge from source to target. Fails if either endpoint is missing, or if
 * the same (source, type, target) already exists unless `update` is set (updates label/
 * canonicity).
 *
 * @param {string} slug Story slug.
 * @param {object} input Edge fields.
 * @param {string} input.source Source node id.
 * @param {string} input.target Target node id.
 * @param {string} input.type One of EDGE_TYPES.
 * @param {string} [input.canonicity="canon"] One of CANONICITY.
 * @param {string} [input.label=""] Short human-readable description.
 * @param {boolean} [input.update=false] Upsert instead of failing on conflict.
 * @returns {object} The created/updated edge row.
 */
export function addEdge(slug, input) {
  const {
    source,
    target,
    type,
    canonicity = "canon",
    label = "",
    update = false,
  } = input;

  assertEnum(type, EDGE_TYPES, "edge type");
  assertEnum(canonicity, CANONICITY, "canonicity");
  if (!source || !target) throw new Error("Edge requires source and target ids.");
  if (source === target) throw new Error("Edge source and target must differ.");

  const db = openDb(slug, { create: false });
  try {
    for (const nid of [source, target]) {
      const exists = db.prepare("SELECT id FROM nodes WHERE id = ?").get(nid);
      if (!exists) {
        throw new Error(`Cannot add edge: node "${nid}" does not exist.`);
      }
    }

    const id = edgeId(source, type, target);
    const existing = db.prepare("SELECT id FROM edges WHERE id = ?").get(id);
    const ts = now();

    if (existing) {
      if (!update) {
        throw new Error(
          `Edge "${id}" already exists. Pass --update to change its label/canonicity.`
        );
      }
      db.prepare(
        "UPDATE edges SET canonicity=?, label=?, updated_at=? WHERE id=?"
      ).run(canonicity, label, ts, id);
      return db.prepare("SELECT * FROM edges WHERE id = ?").get(id);
    }

    const row = {
      id,
      source_id: source,
      target_id: target,
      type,
      canonicity,
      label,
      created_at: ts,
      updated_at: ts,
    };
    db.prepare(
      `INSERT INTO edges (id, source_id, target_id, type, canonicity, label, created_at, updated_at)
       VALUES (@id, @source_id, @target_id, @type, @canonicity, @label, @created_at, @updated_at)`
    ).run(row);
    return row;
  } finally {
    db.close();
  }
}

/**
 * List edges, optionally filtered by an endpoint node id and/or edge type.
 * @param {string} slug Story slug.
 * @param {{ node?: string, type?: string }} [filter] Optional filters.
 * @returns {object[]} Edge rows.
 */
export function listEdges(slug, filter = {}) {
  const db = openDb(slug, { create: false });
  try {
    const clauses = [];
    const params = [];
    if (filter.node) {
      clauses.push("(source_id = ? OR target_id = ?)");
      params.push(filter.node, filter.node);
    }
    if (filter.type) {
      clauses.push("type = ?");
      params.push(filter.type);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return db
      .prepare(`SELECT * FROM edges ${where} ORDER BY source_id, type, target_id`)
      .all(...params);
  } finally {
    db.close();
  }
}

/**
 * Remove a single edge by its id.
 * @param {string} slug Story slug.
 * @param {string} id Edge id.
 * @returns {{ removed: string }} The removed edge id.
 */
export function removeEdge(slug, id) {
  const db = openDb(slug, { create: false });
  try {
    const existing = db.prepare("SELECT id FROM edges WHERE id = ?").get(id);
    if (!existing) throw new Error(`Edge "${id}" not found.`);
    db.prepare("DELETE FROM edges WHERE id = ?").run(id);
    return { removed: id };
  } finally {
    db.close();
  }
}
