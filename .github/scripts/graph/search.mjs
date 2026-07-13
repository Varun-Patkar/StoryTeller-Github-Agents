/**
 * search.mjs — Full-text search, neighbourhood traversal, and integrity validation.
 *
 * `search` uses the FTS5 index over node name/aliases/summary/tags/body to find relevant
 * nodes cheaply (the point of the graph: surface the few nodes worth loading, not every
 * markdown file). `neighbors` does a bounded breadth-first walk so an agent can pull a
 * character plus everyone/everything connected to them for grounded writing. `validate`
 * checks the db and markdown folder are consistent.
 */
import { readdirSync, existsSync } from "fs";
import { openDb, graphPaths } from "./db.mjs";

/**
 * Escape a user query for FTS5 by quoting each token, so punctuation in names/terms does
 * not break the MATCH syntax. Tokens are OR-combined for recall.
 * @param {string} query Raw query string.
 * @returns {string} FTS5 MATCH expression.
 */
function toFtsQuery(query) {
  const tokens = String(query)
    .split(/\s+/)
    .map((t) => t.replace(/["]/g, ""))
    .filter(Boolean)
    .map((t) => `"${t}"`);
  return tokens.length ? tokens.join(" OR ") : '""';
}

/**
 * Full-text search across nodes. Returns ranked matches with a snippet from the body.
 * @param {string} slug Story slug.
 * @param {string} query Search text.
 * @param {{ limit?: number }} [opts] Max results (default 10).
 * @returns {object[]} Matches: { id, type, name, canonicity, summary, snippet }.
 */
export function search(slug, query, opts = {}) {
  const { limit = 10 } = opts;
  const db = openDb(slug, { create: false });
  try {
    const rows = db
      .prepare(
        `SELECT f.id AS id,
                snippet(nodes_fts, 5, '[', ']', ' ... ', 12) AS snippet,
                n.type AS type, n.name AS name,
                n.canonicity AS canonicity, n.summary AS summary
         FROM nodes_fts f
         JOIN nodes n ON n.id = f.id
         WHERE nodes_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(toFtsQuery(query), limit);
    return rows;
  } finally {
    db.close();
  }
}

/**
 * Breadth-first walk outward from a node up to `depth` hops, returning the reached nodes
 * and the edges that connect them. Useful for assembling a focused context bundle.
 * @param {string} slug Story slug.
 * @param {string} id Starting node id.
 * @param {{ depth?: number }} [opts] Hop limit (default 1).
 * @returns {{ nodes: object[], edges: object[] }} Reached subgraph.
 */
export function neighbors(slug, id, opts = {}) {
  const { depth = 1 } = opts;
  const db = openDb(slug, { create: false });
  try {
    const start = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    if (!start) throw new Error(`Node "${id}" not found.`);

    const seen = new Map([[id, start]]);
    const edgeMap = new Map();
    let frontier = [id];

    for (let hop = 0; hop < depth; hop++) {
      const next = [];
      for (const nid of frontier) {
        const rows = db
          .prepare("SELECT * FROM edges WHERE source_id = ? OR target_id = ?")
          .all(nid, nid);
        for (const e of rows) {
          edgeMap.set(e.id, e);
          for (const other of [e.source_id, e.target_id]) {
            if (!seen.has(other)) {
              const node = db
                .prepare("SELECT * FROM nodes WHERE id = ?")
                .get(other);
              if (node) {
                seen.set(other, node);
                next.push(other);
              }
            }
          }
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }

    return {
      nodes: [...seen.values()].map((n) => ({
        ...n,
        aliases: JSON.parse(n.aliases),
        tags: JSON.parse(n.tags),
      })),
      edges: [...edgeMap.values()],
    };
  } finally {
    db.close();
  }
}

/**
 * Assemble a compact "chapter briefing" for the write-chapter skill: the few nodes relevant to
 * the next chapter, how they connect, and the story spine (open threads + arcs). This is
 * a token-light bundle (metadata only, no markdown bodies) so the writer can ground a
 * chapter in one call instead of many search/get-node/neighbors round-trips. Fetch full
 * bodies with `get-node` only for the handful of nodes that actually need deep detail.
 *
 * @param {string} slug Story slug.
 * @param {{ query?: string, ids?: string[], limit?: number }} [opts]
 *   query — free-text of the people/places/terms in this chapter (drives FTS search).
 *   ids   — explicit node ids to force into the focus set (e.g. this chapter's leads).
 *   limit — max search hits to fold into the focus set (default 8).
 * @returns {{ focus: object[], connections: object[], neighbors: object[], threads: object[], arcs: object[] }}
 *   focus       — nodes central to this chapter (id/type/name/canonicity/summary).
 *   connections — edges touching any focus node (source/type/target/canonicity/label).
 *   neighbors   — one-hop nodes connected to the focus set (compact metadata).
 *   threads     — every `thread` node (setups/payoffs to honor or resolve).
 *   arcs        — every `arc` node (the planned spine) for pacing context.
 */
export function recap(slug, opts = {}) {
  const { query = "", ids = [], limit = 8 } = opts;
  const db = openDb(slug, { create: false });
  try {
    const meta = (id) =>
      db
        .prepare(
          "SELECT id, type, name, canonicity, summary FROM nodes WHERE id = ?"
        )
        .get(id);

    // 1. Build the focus set: explicit ids first, then top full-text search hits.
    const focusIds = new Set();
    for (const id of ids) {
      if (meta(id)) focusIds.add(id);
    }
    if (query && String(query).trim()) {
      for (const hit of search(slug, query, { limit })) focusIds.add(hit.id);
    }

    const focus = [...focusIds].map(meta).filter(Boolean);

    // 2. Every edge touching a focus node, plus the one-hop neighbours they reach.
    const connections = [];
    const edgeSeen = new Set();
    const neighborIds = new Set();
    for (const id of focusIds) {
      const rows = db
        .prepare("SELECT * FROM edges WHERE source_id = ? OR target_id = ?")
        .all(id, id);
      for (const e of rows) {
        if (edgeSeen.has(e.id)) continue;
        edgeSeen.add(e.id);
        connections.push({
          source: e.source_id,
          type: e.type,
          target: e.target_id,
          canonicity: e.canonicity,
          label: e.label,
        });
        for (const other of [e.source_id, e.target_id]) {
          if (!focusIds.has(other)) neighborIds.add(other);
        }
      }
    }
    const neighbors = [...neighborIds].map(meta).filter(Boolean);

    // 3. The story spine: all open threads (setups/payoffs) and arcs for pacing context.
    const threads = db
      .prepare(
        "SELECT id, name, canonicity, summary FROM nodes WHERE type = 'thread' ORDER BY name"
      )
      .all();
    const arcs = db
      .prepare(
        "SELECT id, name, canonicity, summary FROM nodes WHERE type = 'arc' ORDER BY name"
      )
      .all();

    return { focus, connections, neighbors, threads, arcs };
  } finally {
    db.close();
  }
}

/**
 * Validate structural integrity: dangling edges (endpoint missing), nodes without a
 * markdown file, and orphan markdown files without a node row.
 * @param {string} slug Story slug.
 * @returns {{ ok: boolean, danglingEdges: string[], missingMarkdown: string[], orphanMarkdown: string[] }}
 */
export function validate(slug) {
  const db = openDb(slug, { create: false });
  const { nodesDir } = graphPaths(slug);
  try {
    const nodeIds = new Set(
      db.prepare("SELECT id FROM nodes").all().map((r) => r.id)
    );

    const danglingEdges = db
      .prepare(
        `SELECT id FROM edges
         WHERE source_id NOT IN (SELECT id FROM nodes)
            OR target_id NOT IN (SELECT id FROM nodes)`
      )
      .all()
      .map((r) => r.id);

    const files = existsSync(nodesDir)
      ? readdirSync(nodesDir).filter((f) => f.endsWith(".md"))
      : [];
    const fileIds = new Set(files.map((f) => f.replace(/\.md$/, "")));

    const missingMarkdown = [...nodeIds].filter((id) => !fileIds.has(id));
    const orphanMarkdown = [...fileIds].filter((id) => !nodeIds.has(id));

    return {
      ok:
        danglingEdges.length === 0 &&
        missingMarkdown.length === 0 &&
        orphanMarkdown.length === 0,
      danglingEdges,
      missingMarkdown,
      orphanMarkdown,
    };
  } finally {
    db.close();
  }
}
