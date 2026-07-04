/**
 * consolidate.mjs — Detect and merge near-duplicate nodes.
 *
 * Deterministic ids stop exact duplicates, but agents can still create near-duplicates
 * ("Joel" vs "Joel Miller", "The Fireflies" vs "Fireflies"). `findDuplicates` reports
 * likely pairs using name/alias similarity within the same node type; `merge` folds one
 * node into another, re-pointing edges and appending the losing node's markdown so no
 * detail is lost.
 */
import { readFileSync } from "fs";
import { openDb } from "./db.mjs";
import { getNode, updateNode, removeNode, nodeMarkdownPath } from "./nodes.mjs";
import { addEdge } from "./edges.mjs";

/**
 * Normalise a name for comparison: lowercase, strip common leading articles and all
 * non-alphanumerics. "The Fireflies" and "Fireflies" both become "fireflies".
 * @param {string} s Raw name.
 * @returns {string} Normalised token.
 */
function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Levenshtein edit distance between two strings (small inputs, iterative DP).
 * @param {string} a First string.
 * @param {string} b Second string.
 * @returns {number} Edit distance.
 */
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Similarity ratio in [0,1] derived from edit distance over the longer string length.
 * @param {string} a First normalised name.
 * @param {string} b Second normalised name.
 * @returns {number} Similarity (1 = identical).
 */
function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  const longer = Math.max(a.length, b.length);
  return 1 - editDistance(a, b) / longer;
}

/**
 * Find likely duplicate node pairs within the same type. Two nodes are flagged when one
 * normalised name/alias contains the other, or their similarity meets the threshold.
 * @param {string} slug Story slug.
 * @param {{ threshold?: number }} [opts] Similarity threshold (default 0.82).
 * @returns {Array<{ a: object, b: object, reason: string, score: number }>} Candidate pairs.
 */
export function findDuplicates(slug, opts = {}) {
  const { threshold = 0.82 } = opts;
  const db = openDb(slug, { create: false });
  try {
    const nodes = db.prepare("SELECT * FROM nodes ORDER BY type, name").all();
    const enriched = nodes.map((n) => ({
      ...n,
      _keys: [n.name, ...JSON.parse(n.aliases)].map(normalize).filter(Boolean),
    }));

    const pairs = [];
    for (let i = 0; i < enriched.length; i++) {
      for (let j = i + 1; j < enriched.length; j++) {
        const a = enriched[i];
        const b = enriched[j];
        if (a.type !== b.type) continue;

        let best = 0;
        let reason = "";
        for (const ka of a._keys) {
          for (const kb of b._keys) {
            if (!ka || !kb) continue;
            if (ka === kb) {
              best = 1;
              reason = "identical normalised name/alias";
            } else if (ka.includes(kb) || kb.includes(ka)) {
              const s = Math.max(best, 0.9);
              if (s > best) {
                best = s;
                reason = "one name/alias contains the other";
              }
            } else {
              const s = similarity(ka, kb);
              if (s > best) {
                best = s;
                reason = `name similarity ${s.toFixed(2)}`;
              }
            }
          }
        }
        if (best >= threshold) {
          pairs.push({
            a: { id: a.id, name: a.name, type: a.type },
            b: { id: b.id, name: b.name, type: b.type },
            reason,
            score: Number(best.toFixed(3)),
          });
        }
      }
    }
    return pairs.sort((x, y) => y.score - x.score);
  } finally {
    db.close();
  }
}

/**
 * Merge the `drop` node into the `keep` node: re-point every edge touching `drop` to
 * `keep` (skipping self-loops and duplicates), append `drop`'s markdown under a merge
 * heading in `keep`'s file, then delete `drop`.
 * @param {string} slug Story slug.
 * @param {string} keepId Node id to retain.
 * @param {string} dropId Node id to remove.
 * @returns {{ kept: string, dropped: string, rewiredEdges: number }} Merge result.
 */
export function merge(slug, keepId, dropId) {
  if (keepId === dropId) throw new Error("keep and drop ids must differ.");

  const keep = getNode(slug, keepId, { includeBody: false });
  const drop = getNode(slug, dropId, { includeBody: true });
  if (!keep) throw new Error(`keep node "${keepId}" not found.`);
  if (!drop) throw new Error(`drop node "${dropId}" not found.`);

  let rewired = 0;
  const allEdges = [...drop.edges.outgoing, ...drop.edges.incoming];
  for (const e of allEdges) {
    const source = e.source_id === dropId ? keepId : e.source_id;
    const target = e.target_id === dropId ? keepId : e.target_id;
    if (source === target) continue; // would become a self-loop; drop it
    try {
      addEdge(slug, {
        source,
        target,
        type: e.type,
        canonicity: e.canonicity,
        label: e.label,
        update: true,
      });
      rewired++;
    } catch {
      // Endpoint may already be gone or edge duplicate; safe to skip.
    }
  }

  // Preserve the dropped node's details by appending them to the kept node's markdown.
  // Using updateNode keeps the FTS body index in sync with the merged content.
  const keepPath = nodeMarkdownPath(slug, keepId);
  const keepBody = readFileSync(keepPath, "utf-8");
  const mergedBody =
    `${keepBody}\n\n## Merged from ${dropId}\n\n${drop.body || "_(no body)_"}\n`;
  updateNode(slug, { id: keepId, body: mergedBody });

  removeNode(slug, dropId);
  return { kept: keepId, dropped: dropId, rewiredEdges: rewired };
}
