#!/usr/bin/env node
/**
 * graph.mjs — CLI for the per-story knowledge graph.
 *
 * The storyteller agents cannot run raw SQL, so every graph operation goes through this
 * deterministic command-line interface. All commands print a single JSON object to
 * stdout (so the agent can parse the result) and exit non-zero on error.
 *
 * Usage:
 *   node graph.mjs <command> --story <slug> [options]
 *
 * Commands:
 *   init          Create the graph.db + nodes/ folder for a story.
 *   add-node      Create a node (+ markdown file). --type --name [--canonicity --aliases
 *                 --summary --tags --body|--body-file --update]
 *   update-node   Update a node. --id [--canonicity --aliases --summary --tags --body|--body-file]
 *   get-node      Print a node with body + connected edges. --id [--no-body]
 *   list-nodes    List node metadata. [--type --canonicity]
 *   remove-node   Delete a node (cascades edges + markdown). --id
 *   add-edge      Create a relationship. --source --target --type [--canonicity --label --update]
 *   list-edges    List relationships. [--node --type]
 *   remove-edge   Delete an edge. --id
 *   neighbors     Print the subgraph around a node. --id [--depth]
 *   search        Full-text search over nodes + bodies. --query [--limit]
 *   consolidate   Report likely duplicate node pairs. [--threshold]
 *                 With --merge <keepId> <dropId>: merge two nodes.
 *   migrate       Import a legacy research/ folder into the graph. --story
 *   validate      Check db/markdown integrity. --story
 *   export        Dump the whole graph (nodes + edges, no bodies) as JSON. --story
 *   schema        Print the allowed node types, edge types, and canonicity values.
 */
import { readFileSync } from "fs";
import { openDb, NODE_TYPES, EDGE_TYPES, CANONICITY } from "./graph/db.mjs";
import {
  addNode,
  updateNode,
  getNode,
  listNodes,
  removeNode,
} from "./graph/nodes.mjs";
import { addEdge, listEdges, removeEdge } from "./graph/edges.mjs";
import { search, neighbors, validate } from "./graph/search.mjs";
import { findDuplicates, merge } from "./graph/consolidate.mjs";
import { migrate } from "./graph/migrate.mjs";

/**
 * Parse `--flag value` and `--bool` style args into an object. Repeatable flags are not
 * needed here; last value wins. Boolean flags (no following value) become `true`.
 * @param {string[]} argv Arguments after the command name.
 * @returns {Record<string, string|boolean>} Parsed options.
 */
function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/**
 * Split a comma-separated flag value into a trimmed array; empty/undefined -> [].
 * @param {string|undefined} v Flag value.
 * @returns {string[]} Parsed list.
 */
function toList(v) {
  if (!v || typeof v !== "string") return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Resolve the markdown body from either --body (inline) or --body-file (path).
 * @param {Record<string, any>} f Parsed flags.
 * @returns {string|undefined} Body text, or undefined if neither provided.
 */
function resolveBody(f) {
  if (f["body-file"]) return readFileSync(f["body-file"], "utf-8");
  if (typeof f.body === "string") return f.body;
  return undefined;
}

/** Print a JSON result and exit 0. */
function ok(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  process.exit(0);
}

/** Print an error as JSON and exit 1. */
function fail(message) {
  process.stdout.write(JSON.stringify({ error: message }, null, 2) + "\n");
  process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);
const flags = parseFlags(rest);
const slug = flags.story;

/** Commands that require a --story slug. */
const NEEDS_STORY = new Set([
  "init", "add-node", "update-node", "get-node", "list-nodes", "remove-node",
  "add-edge", "list-edges", "remove-edge", "neighbors", "search",
  "consolidate", "migrate", "validate", "export",
]);

try {
  if (!command || command === "schema") {
    ok({
      nodeTypes: NODE_TYPES,
      edgeTypes: EDGE_TYPES,
      canonicity: CANONICITY,
    });
  }

  if (NEEDS_STORY.has(command) && !slug) {
    fail(`Command "${command}" requires --story <slug>.`);
  }

  switch (command) {
    case "init": {
      const db = openDb(slug); // creating the db + schema is the whole job
      db.close();
      ok({ initialized: slug });
      break;
    }
    case "add-node":
      ok(
        addNode(slug, {
          type: flags.type,
          name: flags.name,
          canonicity: flags.canonicity,
          aliases: toList(flags.aliases),
          summary: flags.summary || "",
          tags: toList(flags.tags),
          body: resolveBody(flags),
          update: !!flags.update,
        })
      );
      break;
    case "update-node":
      ok(
        updateNode(slug, {
          id: flags.id,
          canonicity: flags.canonicity,
          aliases: flags.aliases !== undefined ? toList(flags.aliases) : undefined,
          summary: flags.summary,
          tags: flags.tags !== undefined ? toList(flags.tags) : undefined,
          body: resolveBody(flags),
        })
      );
      break;
    case "get-node": {
      const node = getNode(slug, flags.id, { includeBody: !flags["no-body"] });
      if (!node) fail(`Node "${flags.id}" not found.`);
      ok(node);
      break;
    }
    case "list-nodes":
      ok(
        listNodes(slug, {
          type: typeof flags.type === "string" ? flags.type : undefined,
          canonicity:
            typeof flags.canonicity === "string" ? flags.canonicity : undefined,
        })
      );
      break;
    case "remove-node":
      ok(removeNode(slug, flags.id));
      break;
    case "add-edge":
      ok(
        addEdge(slug, {
          source: flags.source,
          target: flags.target,
          type: flags.type,
          canonicity: flags.canonicity,
          label: flags.label || "",
          update: !!flags.update,
        })
      );
      break;
    case "list-edges":
      ok(
        listEdges(slug, {
          node: typeof flags.node === "string" ? flags.node : undefined,
          type: typeof flags.type === "string" ? flags.type : undefined,
        })
      );
      break;
    case "remove-edge":
      ok(removeEdge(slug, flags.id));
      break;
    case "neighbors":
      ok(neighbors(slug, flags.id, { depth: Number(flags.depth) || 1 }));
      break;
    case "search":
      ok(search(slug, flags.query, { limit: Number(flags.limit) || 10 }));
      break;
    case "consolidate": {
      if (flags.merge) {
        // --merge <keepId> <dropId> : the two ids follow the flag positionally.
        const idx = rest.indexOf("--merge");
        const keepId = rest[idx + 1];
        const dropId = rest[idx + 2];
        if (!keepId || !dropId || dropId.startsWith("--")) {
          fail("--merge requires <keepId> <dropId>.");
        }
        ok(merge(slug, keepId, dropId));
      } else {
        ok(findDuplicates(slug, { threshold: Number(flags.threshold) || 0.82 }));
      }
      break;
    }
    case "migrate":
      ok(migrate(slug));
      break;
    case "validate":
      ok(validate(slug));
      break;
    case "export": {
      ok({
        nodes: listNodes(slug),
        edges: listEdges(slug),
      });
      break;
    }
    default:
      fail(`Unknown command "${command}". Run with no args for schema, or see header.`);
  }
} catch (err) {
  fail(err.message);
}
